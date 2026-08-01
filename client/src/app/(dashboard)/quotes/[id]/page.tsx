import { Metadata } from "next";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  QuoteHeader,
  OriginalQuoteData,
  InvoiceDetails,
  LineItemsAnalysis,
  CostSummary,
  ErrorCard,
  SupplierLinks,
  ApprovalPanel,
  RfqSection,
} from "@/components/quotes";
import { AIAnalysisResults, OriginalData } from "@/types/quotes";
import { Suspense } from "react";
import QuoteDetailsLoading from "./loading";
import { validateQuoteData } from "@/lib/utils/validate-quote";
import { getMembership, getUserOrganizations } from "@/lib/organizations";
import { listRfqsForQuote } from "@/lib/rfq";

export const metadata: Metadata = {
  title: "Quote Details - Quote AI",
  description: "View quote analysis and comparison",
};

async function QuoteContent({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  // Auth is handled by middleware
  const userId = session!.user!.id;

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { organization: { members: { some: { userId } } } },
      ],
    },
    include: {
      organization: true,
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          requestedBy: { select: { name: true, email: true } },
          approver: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!quote) {
    notFound();
  }

  const isOwner = quote.userId === userId;
  const membership = quote.organizationId
    ? await getMembership(quote.organizationId, userId)
    : null;
  const canDecideApproval =
    membership?.role === "OWNER" ||
    membership?.role === "ADMIN" ||
    membership?.role === "APPROVER";
  const userOrganizations = isOwner ? await getUserOrganizations(userId) : [];
  const latestApproval = quote.approvals[0]
    ? {
        requestedByName:
          quote.approvals[0].requestedBy.name || quote.approvals[0].requestedBy.email,
        approverName:
          quote.approvals[0].approver?.name || quote.approvals[0].approver?.email || null,
        note: quote.approvals[0].note,
        decidedAt: quote.approvals[0].decidedAt?.toISOString() ?? null,
      }
    : null;

  const rfqs = await listRfqsForQuote(quote.id, userId);

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

      <ApprovalPanel
        quoteId={quote.id}
        isOwner={isOwner}
        approvalStatus={quote.approvalStatus as "NONE" | "PENDING" | "APPROVED" | "REJECTED"}
        organization={
          quote.organization
            ? { id: quote.organization.id, name: quote.organization.name }
            : null
        }
        canDecide={canDecideApproval}
        userOrganizations={userOrganizations.map(({ organization }) => ({
          id: organization.id,
          name: organization.name,
        }))}
        latestApproval={latestApproval}
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
          <RfqSection quoteId={quote.id} rfqs={rfqs} />
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
