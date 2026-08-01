import { Metadata } from "next";
import { PriceHistorySearch } from "./price-history-search";

export const metadata: Metadata = {
  title: "Price Insights - Quote AI",
  description: "Search your historical quoted and market prices",
};

export default function InsightsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Price Insights</h1>
        <p className="text-muted-foreground">
          Search across everything you&apos;ve quoted and every real supplier
          response you&apos;ve collected. This grows more useful the more you use
          QuoteAI - it&apos;s your own pricing data, not a fresh AI guess each time.
        </p>
      </div>
      <PriceHistorySearch />
    </div>
  );
}
