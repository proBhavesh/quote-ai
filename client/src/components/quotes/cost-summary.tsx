import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { QuoteSummary } from "@/types/quotes";
import { formatCurrency, formatPercentage } from "@/lib/format";

interface CostSummaryProps {
  summary: QuoteSummary;
}

export function CostSummary({ summary }: CostSummaryProps) {
  // Helper function to safely format currency values
  const safeCurrency = (value?: number) => {
    return typeof value === "number" ? formatCurrency(value) : "N/A";
  };

  // Helper function to safely format percentage values
  const safePercentage = (value?: number) => {
    return typeof value === "number" ? formatPercentage(value) : "N/A";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
        <CardDescription>
          Overall cost analysis and market comparison
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Cost Details */}
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Subtotal</TableCell>
                <TableCell>{safeCurrency(summary.subtotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tax</TableCell>
                <TableCell>{safeCurrency(summary.tax)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Discounts</TableCell>
                <TableCell>{safeCurrency(summary.discounts)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="font-bold">
                  {safeCurrency(summary.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Market Comparison */}
          {summary.market_comparison && (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    Market Price Total
                  </TableCell>
                  <TableCell>
                    {safeCurrency(
                      summary.market_comparison.total_at_market_price
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Price Difference
                  </TableCell>
                  <TableCell>
                    {safeCurrency(
                      summary.market_comparison.total_price_difference
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">% Above Market</TableCell>
                  <TableCell>
                    {safePercentage(
                      summary.market_comparison.percentage_above_market
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
