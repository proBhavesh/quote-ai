import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface CostSummaryProps {
  summary: {
    tax?: number;
    total?: number;
    subtotal?: number;
    discounts?: number;
    market_comparison?: {
      total_at_market_price?: number;
      total_price_difference?: number;
      percentage_above_market?: number;
    };
  };
  currency?: string;
}

export function CostSummary({ summary, currency = "AED" }: CostSummaryProps) {
  const showMarketComparison = summary.market_comparison !== undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
        <CardDescription>
          Overview of costs and potential savings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof summary.total === "number"
                  ? formatCurrency(summary.total, currency)
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
          {showMarketComparison && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Market Average Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {typeof summary.market_comparison?.total_at_market_price ===
                    "number"
                      ? formatCurrency(
                          summary.market_comparison.total_at_market_price,
                          currency
                        )
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Potential Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {typeof summary.market_comparison
                      ?.total_price_difference === "number"
                      ? formatCurrency(
                          summary.market_comparison.total_price_difference,
                          currency
                        )
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Above Market Average
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {typeof summary.market_comparison
                      ?.percentage_above_market === "number"
                      ? `${summary.market_comparison.percentage_above_market.toFixed(
                          2
                        )}%`
                      : "N/A"}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
