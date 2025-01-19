import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineItem } from "@/types/quotes";
import { formatCurrency } from "@/lib/format";

interface LineItemsAnalysisProps {
  items: LineItem[];
}

export function LineItemsAnalysis({ items }: LineItemsAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Items Analysis</CardTitle>
        <CardDescription>
          Detailed analysis of each item with market comparison
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Report No.</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Market Price</TableHead>
              <TableHead>Price Difference</TableHead>
              <TableHead>% Above Market</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.report_no}>
                <TableCell>{item.no}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.report_no}</TableCell>
                <TableCell>
                  {item.unit_price !== undefined
                    ? formatCurrency(item.unit_price)
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {item.market_data?.current_market_price !== undefined
                    ? formatCurrency(item.market_data.current_market_price)
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {item.market_data?.price_difference !== undefined
                    ? formatCurrency(item.market_data.price_difference)
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {item.market_data?.percentage_difference !== undefined
                    ? `${item.market_data.percentage_difference.toFixed(2)}%`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {item.market_data?.potential_savings &&
                  typeof item.market_data.potential_savings === "number"
                    ? formatCurrency(item.market_data.potential_savings)
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {item.total_price !== undefined
                    ? formatCurrency(item.total_price)
                    : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
