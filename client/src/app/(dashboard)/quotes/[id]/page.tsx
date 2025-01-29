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
  SupplierLinks,
} from "@/components/quotes";
import { AIAnalysisResults, OriginalData } from "@/types/quotes";
import { Suspense } from "react";
import QuoteDetailsLoading from "./loading";
import { validateQuoteData } from "@/lib/utils/validate-quote";

export const metadata: Metadata = {
  title: "Quote Details - Quote AI",
  description: "View quote analysis and comparison",
};

async function QuoteContent({ params }: { params: Promise<{ id: string }> }) {
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

  // Validate quote data
  const validationResults = await validateQuoteData({
    originalData: quote.originalData,
    results: quote.results,
  });

  // Extract validated data or use null if validation failed
  const originalData = validationResults.originalData.success
    ? (validationResults.originalData.data as OriginalData)
    : null;

  const results = validationResults.results.success
    ? (validationResults.results.data as AIAnalysisResults)
    : null;

  const currency = originalData?.currency || "AED";

  // Handle validation errors
  const hasValidationErrors =
    !validationResults.originalData.success ||
    !validationResults.results.success;

  return (
    <div className="space-y-6">
      <QuoteHeader
        title={quote.title}
        createdAt={quote.createdAt}
        status={quote.status}
        quoteId={quote.id}
        fileUrl={quote.fileUrl}
      />

      {/* Show validation errors if any */}
      {hasValidationErrors && quote.status === "COMPLETED" && (
        <ErrorCard
          title="Data Validation Error"
          description="Some quote data failed validation. This might affect the displayed information."
          errors={[
            ...(validationResults.originalData.error?.message
              ? [validationResults.originalData.error.message]
              : []),
            ...(validationResults.results.error?.message
              ? [validationResults.results.error.message]
              : []),
          ]}
        />
      )}

      <OriginalQuoteData data={originalData} status={quote.status} />

      {results?.metadata && results.line_items && results.summary && (
        <>
          <InvoiceDetails metadata={results.metadata} />
          <LineItemsAnalysis items={results.line_items} currency={currency} />
          {results.line_items.map(
            (item, index) =>
              item.market_data && (
                <SupplierLinks
                  key={index}
                  marketData={item.market_data}
                  currency={currency}
                  currentPrice={item.unit_price}
                />
              )
          )}
          <CostSummary summary={results.summary} currency={currency} />
        </>
      )}

      {quote.status === "ERROR" && <ErrorCard />}
    </div>
  );
}

export default function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<QuoteDetailsLoading />}>
      <QuoteContent params={params} />
    </Suspense>
  );
}
