"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { decideQuoteApproval, submitQuoteForApproval } from "@/lib/approvals";

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required");
  return userId;
}

export async function submitQuoteForApprovalAction(quoteId: string) {
  const userId = await requireUserId();
  await submitQuoteForApproval(quoteId, userId);
  revalidatePath(`/quotes/${quoteId}`);
  return { success: true };
}

export async function decideQuoteApprovalAction(
  quoteId: string,
  decision: "APPROVED" | "REJECTED",
  note?: string
) {
  const userId = await requireUserId();
  await decideQuoteApproval(quoteId, userId, decision, note);
  revalidatePath(`/quotes/${quoteId}`);
  return { success: true };
}
