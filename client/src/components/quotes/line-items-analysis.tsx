"use client";

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
import { formatCurrency } from "@/lib/format";

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

interface MarketData {
  current_market_price: number;
  price_difference: number;
  percentage_difference: number;
}

interface LineItem {
  no: number;
  description: string;
  report_no: string;
  unit_price: number;
  total_price: number;
  market_data?: MarketData;
}

interface LineItemsAnalysisProps {
  items: LineItem[];
  currency?: string;
}

export function LineItemsAnalysis({
  items,
  currency = "AED",
}: LineItemsAnalysisProps) {
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
              <TableHead>Difference</TableHead>
              <TableHead>% Difference</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const itemKey = item.report_no
                ? String(item.report_no)
                : `item-${index}`;
              return (
                <TableRow key={itemKey}>
                  <TableCell>{String(item.no ?? "N/A")}</TableCell>
                  <TableCell>{String(item.description ?? "N/A")}</TableCell>
                  <TableCell>{String(item.report_no ?? "N/A")}</TableCell>
                  <TableCell>
                    {item.unit_price !== undefined
                      ? formatCurrency(item.unit_price, currency)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.market_data?.current_market_price !== undefined
                      ? formatCurrency(
                          item.market_data.current_market_price,
                          currency
                        )
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.market_data?.price_difference !== undefined
                      ? formatCurrency(
                          item.market_data.price_difference,
                          currency
                        )
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.market_data?.percentage_difference !== undefined
                      ? formatPercentage(item.market_data.percentage_difference)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.total_price !== undefined
                      ? formatCurrency(item.total_price, currency)
                      : "N/A"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
