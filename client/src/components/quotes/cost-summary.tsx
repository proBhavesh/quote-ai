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
    tax: number;
    total: number;
    subtotal: number;
    discounts: number;
    market_comparison: {
      total_at_market_price: number;
      total_price_difference: number;
      percentage_above_market: number;
    };
  };
  currency?: string;
}

export function CostSummary({ summary, currency = "AED" }: CostSummaryProps) {
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
                {formatCurrency(summary.total, currency)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Market Average Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  summary.market_comparison.total_at_market_price,
                  currency
                )}
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
                {formatCurrency(
                  summary.market_comparison.total_price_difference,
                  currency
                )}
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
                {summary.market_comparison.percentage_above_market.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
