import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { logAuditEvent } from "@/lib/audit";

export const ORG_ROLES = ["OWNER", "ADMIN", "APPROVER", "MEMBER"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class OrganizationAccessError extends Error {
  constructor(message = "You do not have access to this organization") {
    super(message);
    this.name = "OrganizationAccessError";
  }
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "org"
  );
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

/** Returns the membership row for a user in an org, or null. */
export async function getMembership(organizationId: string, userId: string) {
  return prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
}

/** Throws OrganizationAccessError unless the user is a member with one of the allowed roles. */
export async function requireOrgRole(
  organizationId: string,
  userId: string,
  allowedRoles: OrgRole[]
) {
  const membership = await getMembership(organizationId, userId);
  if (!membership || !allowedRoles.includes(membership.role as OrgRole)) {
    throw new OrganizationAccessError();
  }
  return membership;
}

export async function getUserOrganizations(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: { _count: { select: { members: true, quotes: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({
    organization: m.organization,
    role: m.role as OrgRole,
  }));
}

export async function getOrganizationForMember(
  organizationId: string,
  userId: string
) {
  await requireOrgRole(organizationId, userId, [
    "OWNER",
    "ADMIN",
    "APPROVER",
    "MEMBER",
  ]);

  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      invites: {
        where: { acceptedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createOrganization(userId: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Organization name is required");
  }

  const slug = await generateUniqueSlug(trimmedName);

  const organization = await prisma.organization.create({
    data: {
      name: trimmedName,
      slug,
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });

  await logAuditEvent({
    organizationId: organization.id,
    actorId: userId,
    action: "ORGANIZATION_CREATED",
    targetType: "Organization",
    targetId: organization.id,
  });

  return organization;
}

export async function inviteMember(
  organizationId: string,
  inviterId: string,
  email: string,
  role: Exclude<OrgRole, "OWNER">
) {
  await requireOrgRole(organizationId, inviterId, ["OWNER", "ADMIN"]);

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    const existingMembership = await getMembership(
      organizationId,
      existingUser.id
    );
    if (existingMembership) {
      throw new Error("This person is already a member of the organization");
    }
  }

  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId,
      email: normalizedEmail,
      role,
      token: nanoid(32),
      invitedById: inviterId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  await logAuditEvent({
    organizationId,
    actorId: inviterId,
    action: "MEMBER_INVITED",
    targetType: "OrganizationInvite",
    targetId: invite.id,
    metadata: { email: normalizedEmail, role },
  });

  return invite;
}

export async function revokeInvite(
  organizationId: string,
  actingUserId: string,
  inviteId: string
) {
  await requireOrgRole(organizationId, actingUserId, ["OWNER", "ADMIN"]);
  await prisma.organizationInvite.deleteMany({
    where: { id: inviteId, organizationId },
  });

  await logAuditEvent({
    organizationId,
    actorId: actingUserId,
    action: "INVITE_REVOKED",
    targetType: "OrganizationInvite",
    targetId: inviteId,
  });
}

export async function acceptInvite(
  token: string,
  userId: string,
  userEmail: string
) {
  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new Error("This invite is invalid or has expired");
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error("This invite was sent to a different email address");
  }

  const existingMembership = await getMembership(
    invite.organizationId,
    userId
  );
  if (existingMembership) {
    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return invite.organizationId;
  }

  await prisma.$transaction([
    prisma.organizationMember.create({
      data: {
        organizationId: invite.organizationId,
        userId,
        role: invite.role,
      },
    }),
    prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await logAuditEvent({
    organizationId: invite.organizationId,
    actorId: userId,
    action: "INVITE_ACCEPTED",
    targetType: "OrganizationInvite",
    targetId: invite.id,
  });

  return invite.organizationId;
}

export async function updateMemberRole(
  organizationId: string,
  actingUserId: string,
  memberId: string,
  role: Exclude<OrgRole, "OWNER">
) {
  await requireOrgRole(organizationId, actingUserId, ["OWNER", "ADMIN"]);

  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });
  if (!member || member.organizationId !== organizationId) {
    throw new Error("Member not found");
  }
  if (member.role === "OWNER") {
    throw new Error("The organization owner's role cannot be changed");
  }

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
  });

  await logAuditEvent({
    organizationId,
    actorId: actingUserId,
    action: "MEMBER_ROLE_CHANGED",
    targetType: "OrganizationMember",
    targetId: memberId,
    metadata: { previousRole: member.role, newRole: role },
  });

  return updated;
}

export async function removeMember(
  organizationId: string,
  actingUserId: string,
  memberId: string
) {
  await requireOrgRole(organizationId, actingUserId, ["OWNER", "ADMIN"]);

  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });
  if (!member || member.organizationId !== organizationId) {
    throw new Error("Member not found");
  }
  if (member.role === "OWNER") {
    throw new Error("The organization owner cannot be removed");
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });

  await logAuditEvent({
    organizationId,
    actorId: actingUserId,
    action: "MEMBER_REMOVED",
    targetType: "OrganizationMember",
    targetId: memberId,
    metadata: { removedUserId: member.userId },
  });
}
