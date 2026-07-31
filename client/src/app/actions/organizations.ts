"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import {
  acceptInvite,
  createOrganization,
  inviteMember,
  removeMember,
  revokeInvite,
  updateMemberRole,
  type OrgRole,
} from "@/lib/organizations";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

function requireUserId() {
  return auth().then((session) => {
    const userId = session?.user?.id;
    if (!userId) throw new Error("Authentication required");
    return userId;
  });
}

async function sendInviteEmail(
  email: string,
  organizationName: string,
  inviterName: string | null | undefined,
  token: string
) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "QuoteAI <onboarding@resend.dev>",
      to: [email],
      subject: `${inviterName || "Someone"} invited you to join ${organizationName} on QuoteAI`,
      html: `
        <p>${inviterName || "A teammate"} invited you to join <strong>${organizationName}</strong> on QuoteAI.</p>
        <p><a href="${baseUrl}/organizations/invites/${token}">Accept invite</a></p>
      `,
    });
  } catch (error) {
    console.error("[SEND_INVITE_EMAIL]", error);
  }
}

export async function createOrganizationAction(name: string) {
  const userId = await requireUserId();
  const organization = await createOrganization(userId, name);
  revalidatePath("/organizations");
  return { success: true, organizationId: organization.id };
}

export async function inviteMemberAction(
  organizationId: string,
  email: string,
  role: Exclude<OrgRole, "OWNER">
) {
  const userId = await requireUserId();
  const [invite, organization, inviter] = await Promise.all([
    inviteMember(organizationId, userId, email, role),
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  await sendInviteEmail(
    invite.email,
    organization?.name || "your team",
    inviter?.name,
    invite.token
  );

  revalidatePath(`/organizations/${organizationId}`);
  return { success: true };
}

export async function revokeInviteAction(
  organizationId: string,
  inviteId: string
) {
  const userId = await requireUserId();
  await revokeInvite(organizationId, userId, inviteId);
  revalidatePath(`/organizations/${organizationId}`);
  return { success: true };
}

export async function acceptInviteAction(token: string) {
  const session = await auth();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  if (!userId || !userEmail) throw new Error("Authentication required");

  const organizationId = await acceptInvite(token, userId, userEmail);
  revalidatePath("/organizations");
  return { success: true, organizationId };
}

export async function updateMemberRoleAction(
  organizationId: string,
  memberId: string,
  role: Exclude<OrgRole, "OWNER">
) {
  const userId = await requireUserId();
  await updateMemberRole(organizationId, userId, memberId, role);
  revalidatePath(`/organizations/${organizationId}`);
  return { success: true };
}

export async function removeMemberAction(
  organizationId: string,
  memberId: string
) {
  const userId = await requireUserId();
  await removeMember(organizationId, userId, memberId);
  revalidatePath(`/organizations/${organizationId}`);
  return { success: true };
}

export async function assignQuoteToOrganizationAction(
  quoteId: string,
  organizationId: string | null
) {
  const userId = await requireUserId();

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.userId !== userId) {
    throw new Error("Quote not found");
  }

  if (organizationId) {
    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) {
      throw new Error("You are not a member of this organization");
    }
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      organizationId,
      approvalStatus: organizationId ? quote.approvalStatus : "NONE",
    },
  });

  if (organizationId) {
    await logAuditEvent({
      organizationId,
      actorId: userId,
      action: "QUOTE_ASSIGNED_TO_ORGANIZATION",
      targetType: "Quote",
      targetId: quoteId,
    });
  }

  revalidatePath(`/quotes/${quoteId}`);
  return { success: true };
}
