import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/organizations";

export async function submitQuoteForApproval(
  quoteId: string,
  userId: string
) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.userId !== userId) {
    throw new Error("Quote not found");
  }
  if (!quote.organizationId) {
    throw new Error(
      "Assign this quote to an organization before submitting it for approval"
    );
  }
  if (quote.approvalStatus === "PENDING") {
    throw new Error("This quote is already pending approval");
  }

  // Membership is implied by the quote already being assigned to the org
  await requireOrgRole(quote.organizationId, userId, [
    "OWNER",
    "ADMIN",
    "APPROVER",
    "MEMBER",
  ]);

  await prisma.$transaction([
    prisma.quoteApproval.create({
      data: {
        quoteId: quote.id,
        organizationId: quote.organizationId,
        requestedById: userId,
        status: "PENDING",
      },
    }),
    prisma.quote.update({
      where: { id: quote.id },
      data: { approvalStatus: "PENDING" },
    }),
  ]);
}

export async function decideQuoteApproval(
  quoteId: string,
  approverId: string,
  decision: "APPROVED" | "REJECTED",
  note?: string
) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || !quote.organizationId) {
    throw new Error("Quote not found");
  }
  if (quote.approvalStatus !== "PENDING") {
    throw new Error("This quote is not pending approval");
  }

  await requireOrgRole(quote.organizationId, approverId, [
    "OWNER",
    "ADMIN",
    "APPROVER",
  ]);

  const pendingApproval = await prisma.quoteApproval.findFirst({
    where: { quoteId: quote.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!pendingApproval) {
    throw new Error("No pending approval request found for this quote");
  }

  await prisma.$transaction([
    prisma.quoteApproval.update({
      where: { id: pendingApproval.id },
      data: {
        status: decision,
        approverId,
        note: note?.trim() || null,
        decidedAt: new Date(),
      },
    }),
    prisma.quote.update({
      where: { id: quote.id },
      data: { approvalStatus: decision },
    }),
  ]);
}
