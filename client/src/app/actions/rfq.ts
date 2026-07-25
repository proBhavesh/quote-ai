"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import {
  createRfq,
  markRfqSent,
  submitSupplierResponse,
  type RfqLineItemInput,
  type RfqSupplierInput,
} from "@/lib/rfq";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required");
  return userId;
}

async function sendRfqEmail(
  supplierEmail: string,
  supplierName: string,
  rfqTitle: string,
  message: string | null,
  lineItems: { description: string; quantity: number }[],
  token: string
) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resend = new Resend(process.env.RESEND_API_KEY);
    const itemsHtml = lineItems
      .map((item) => `<li>${item.description} — qty ${item.quantity}</li>`)
      .join("");

    await resend.emails.send({
      from: "QuoteAI <onboarding@resend.dev>",
      to: [supplierEmail],
      subject: `Request for quote: ${rfqTitle}`,
      html: `
        <p>Hi ${supplierName},</p>
        <p>We'd like a quote for the following items:</p>
        <ul>${itemsHtml}</ul>
        ${message ? `<p>${message}</p>` : ""}
        <p><a href="${baseUrl}/rfq/respond/${token}">Submit your quote</a></p>
      `,
    });
  } catch (error) {
    console.error("[SEND_RFQ_EMAIL]", error);
  }
}

export async function createRfqAction(
  quoteId: string,
  title: string,
  message: string,
  lineItems: RfqLineItemInput[],
  suppliers: RfqSupplierInput[]
) {
  const userId = await requireUserId();
  const rfq = await createRfq({
    quoteId,
    userId,
    title,
    message,
    lineItems,
    suppliers,
  });

  revalidatePath(`/quotes/${quoteId}`);
  return { success: true, rfqId: rfq.id };
}

export async function sendRfqAction(rfqId: string) {
  const userId = await requireUserId();
  await markRfqSent(rfqId, userId);

  const rfq = await prisma.rfq.findUnique({
    where: { id: rfqId },
    include: { lineItems: true, suppliers: { where: { status: "SENT" } } },
  });
  if (rfq) {
    await Promise.all(
      rfq.suppliers.map((supplier) =>
        sendRfqEmail(
          supplier.email,
          supplier.name,
          rfq.title,
          rfq.message,
          rfq.lineItems,
          supplier.token
        )
      )
    );
    revalidatePath(`/quotes/${rfq.quoteId}`);
    revalidatePath(`/rfq/${rfqId}`);
  }

  return { success: true };
}

export async function submitSupplierResponseAction(
  token: string,
  quotedTotal: number,
  notes: string
) {
  await submitSupplierResponse(token, quotedTotal, notes);
  revalidatePath(`/rfq/respond/${token}`);
  return { success: true };
}
