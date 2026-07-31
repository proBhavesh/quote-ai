import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { logAuditEvent } from "@/lib/audit";

export interface RfqLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface RfqSupplierInput {
  name: string;
  email: string;
}

async function assertCanAccessQuote(quoteId: string, userId: string) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      OR: [{ userId }, { organization: { members: { some: { userId } } } }],
    },
  });
  if (!quote) {
    throw new Error("Quote not found");
  }
  return quote;
}

async function assertCanAccessRfq(rfqId: string, userId: string) {
  const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
  if (!rfq) {
    throw new Error("RFQ not found");
  }
  await assertCanAccessQuote(rfq.quoteId, userId);
  return rfq;
}

export async function createRfq(params: {
  quoteId: string;
  userId: string;
  title: string;
  message?: string;
  lineItems: RfqLineItemInput[];
  suppliers: RfqSupplierInput[];
}) {
  const { quoteId, userId, title, message, lineItems, suppliers } = params;

  const quote = await assertCanAccessQuote(quoteId, userId);

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Title is required");
  }
  if (lineItems.length === 0) {
    throw new Error("Select at least one line item");
  }
  const validSuppliers = suppliers
    .map((s) => ({ name: s.name.trim(), email: s.email.trim().toLowerCase() }))
    .filter((s) => s.name && s.email);
  if (validSuppliers.length === 0) {
    throw new Error("Add at least one supplier with a name and email");
  }

  const rfq = await prisma.rfq.create({
    data: {
      quoteId,
      organizationId: quote.organizationId,
      createdById: userId,
      title: trimmedTitle,
      message: message?.trim() || null,
      lineItems: { create: lineItems },
      suppliers: {
        create: validSuppliers.map((s) => ({
          name: s.name,
          email: s.email,
          token: nanoid(32),
        })),
      },
    },
    include: { lineItems: true, suppliers: true },
  });

  if (quote.organizationId) {
    await logAuditEvent({
      organizationId: quote.organizationId,
      actorId: userId,
      action: "RFQ_CREATED",
      targetType: "Rfq",
      targetId: rfq.id,
      metadata: { supplierCount: validSuppliers.length },
    });
  }

  return rfq;
}

export async function getRfqForUser(rfqId: string, userId: string) {
  await assertCanAccessRfq(rfqId, userId);

  return prisma.rfq.findUnique({
    where: { id: rfqId },
    include: {
      quote: { select: { id: true, title: true, results: true } },
      lineItems: true,
      suppliers: { orderBy: { createdAt: "asc" } },
      createdBy: { select: { name: true, email: true } },
    },
  });
}

export async function listRfqsForQuote(quoteId: string, userId: string) {
  await assertCanAccessQuote(quoteId, userId);
  return prisma.rfq.findMany({
    where: { quoteId },
    include: { suppliers: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function markRfqSent(rfqId: string, userId: string) {
  const rfq = await assertCanAccessRfq(rfqId, userId);
  if (rfq.status !== "DRAFT") {
    throw new Error("This RFQ has already been sent");
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.rfqSupplier.updateMany({
      where: { rfqId, status: "PENDING" },
      data: { status: "SENT", sentAt: now },
    }),
    prisma.rfq.update({ where: { id: rfqId }, data: { status: "SENT" } }),
  ]);

  if (rfq.organizationId) {
    await logAuditEvent({
      organizationId: rfq.organizationId,
      actorId: userId,
      action: "RFQ_SENT",
      targetType: "Rfq",
      targetId: rfqId,
    });
  }
}

export async function getSupplierByToken(token: string) {
  return prisma.rfqSupplier.findUnique({
    where: { token },
    include: {
      rfq: {
        include: { lineItems: true, quote: { select: { title: true } } },
      },
    },
  });
}

export async function submitSupplierResponse(
  token: string,
  quotedTotal: number,
  notes?: string
) {
  const supplier = await prisma.rfqSupplier.findUnique({
    where: { token },
    include: {
      rfq: {
        include: {
          lineItems: true,
          quote: { select: { organizationId: true, originalData: true } },
        },
      },
    },
  });
  if (!supplier) {
    throw new Error("This link is invalid");
  }
  if (supplier.status === "RESPONDED") {
    throw new Error("A response has already been submitted for this RFQ");
  }
  if (!Number.isFinite(quotedTotal) || quotedTotal < 0) {
    throw new Error("Enter a valid quoted total");
  }

  await prisma.rfqSupplier.update({
    where: { token },
    data: {
      status: "RESPONDED",
      quotedTotal,
      notes: notes?.trim() || null,
      respondedAt: new Date(),
    },
  });

  // Real supplier prices are the strongest signal in the pricing dataset -
  // proportionally attribute the total across the requested line items.
  const { lineItems, quote } = supplier.rfq;
  if (lineItems.length > 0) {
    const currency =
      (quote?.originalData as { currency?: string } | null)?.currency || "AED";
    const originalSubtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const observations = lineItems.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const share =
        originalSubtotal > 0
          ? itemSubtotal / originalSubtotal
          : 1 / lineItems.length;
      const estimatedItemTotal = quotedTotal * share;
      const estimatedUnitPrice =
        item.quantity > 0 ? estimatedItemTotal / item.quantity : estimatedItemTotal;

      return {
        description: item.description,
        quantity: item.quantity,
        currency,
        quotedUnitPrice: estimatedUnitPrice,
        source: "RFQ_SUPPLIER_RESPONSE",
        quoteId: supplier.rfq.quoteId,
        organizationId: quote?.organizationId ?? null,
        rfqSupplierId: supplier.id,
      };
    });

    await prisma.priceObservation.createMany({ data: observations });
  }
}
