import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  QuoteHeader,
  OriginalQuoteData,
  InvoiceDetails,
  LineItemsAnalysis,
  CostSummary,
  ErrorCard,
} from "@/components/quotes";
import { AIAnalysisResults, OriginalData } from "@/types/quotes";

export const metadata: Metadata = {
  title: "Quote Details - Quote AI",
  description: "View quote analysis and comparison",
};

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const quote = await prisma.quote.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!quote) {
    notFound();
  }

  const originalData = quote.originalData as OriginalData | null;
  const results = quote.results as AIAnalysisResults | null;
  const currency = originalData?.currency || "AED";

  return (
    <div className="space-y-6">
      <QuoteHeader
        title={quote.title}
        createdAt={quote.createdAt}
        status={quote.status}
        quoteId={quote.id}
        fileUrl={quote.fileUrl}
      />

      <OriginalQuoteData data={originalData} status={quote.status} />

      {results && results.metadata && results.line_items && results.summary && (
        <>
          <InvoiceDetails metadata={results.metadata} />
          <LineItemsAnalysis items={results.line_items} currency={currency} />
          <CostSummary summary={results.summary} currency={currency} />
        </>
      )}

      {quote.status === "ERROR" && <ErrorCard />}
    </div>
  );
}
