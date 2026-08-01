import { Metadata } from "next";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { validateQuoteData } from "@/lib/utils/validate-quote";
import { AIAnalysisResults } from "@/types/quotes";
import { CreateRfqForm } from "./create-rfq-form";

export const metadata: Metadata = {
  title: "New RFQ - Quote AI",
};

export default async function NewRfqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id;

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      OR: [{ userId }, { organization: { members: { some: { userId } } } }],
    },
  });

  if (!quote) {
    notFound();
  }

  const validationResults = await validateQuoteData({
    originalData: quote.originalData,
    results: quote.results,
  });
  const results = validationResults.results.success
    ? (validationResults.results.data as AIAnalysisResults)
    : null;

  if (!results?.line_items?.length) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-muted-foreground">
          This quote has no analyzed line items to request quotes for yet.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Request quotes from suppliers</h1>
        <p className="text-muted-foreground">
          Pick the items you want alternate pricing on and who to ask.
        </p>
      </div>
      <CreateRfqForm
        quoteId={quote.id}
        quoteTitle={quote.title}
        lineItems={results.line_items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          suggestedSuppliers: (item.market_data?.supplier_links || []).map(
            (link) => link.name
          ),
        }))}
      />
    </div>
  );
}
