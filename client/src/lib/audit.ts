import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "ORGANIZATION_CREATED"
  | "MEMBER_INVITED"
  | "INVITE_REVOKED"
  | "INVITE_ACCEPTED"
  | "MEMBER_ROLE_CHANGED"
  | "MEMBER_REMOVED"
  | "QUOTE_ASSIGNED_TO_ORGANIZATION"
  | "QUOTE_SUBMITTED_FOR_APPROVAL"
  | "QUOTE_APPROVED"
  | "QUOTE_REJECTED"
  | "RFQ_CREATED"
  | "RFQ_SENT";

interface LogAuditEventParams {
  organizationId: string;
  actorId?: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(params: LogAuditEventParams) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    // Never let audit logging break the action it's recording
    console.error("[logAuditEvent] Failed to record audit log:", error);
  }
}

export async function getOrganizationAuditLog(organizationId: string) {
  return prisma.auditLog.findMany({
    where: { organizationId },
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
