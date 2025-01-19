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
  TableFooter,
} from "@/components/ui/table";
import { OriginalData } from "@/types/quotes";
import { formatCurrency } from "@/lib/format";

interface OriginalQuoteDataProps {
  data: OriginalData | null;
  status: string;
}

export function OriginalQuoteData({ data, status }: OriginalQuoteDataProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Original Quote</CardTitle>
          <CardDescription>
            Details extracted from your uploaded quote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            {status === "PENDING" || status === "PROCESSING"
              ? "Quote is being processed..."
              : "No data extracted"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Original Quote</CardTitle>
        <CardDescription>
          Details extracted from your uploaded quote
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="font-medium">{data.text}</p>
          {data.parsed_tables?.map((table, tableIndex) => (
            <div key={tableIndex} className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {table.columns?.map((column, index) => (
                      <TableHead key={index}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.rows?.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {(Object.values(row) as (string | number)[]).map(
                        (cell, cellIndex) => (
                          <TableCell key={cellIndex}>{cell}</TableCell>
                        )
                      )}
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6} className="text-right font-medium">
                      Total (Excl. VAT)
                    </TableCell>
                    <TableCell>
                      {table.totals?.amount_excl_vat &&
                      typeof table.totals.amount_excl_vat === "number"
                        ? formatCurrency(table.totals.amount_excl_vat)
                        : "N/A"}
                    </TableCell>
                    <TableCell />
                    <TableCell>
                      {table.totals?.vat_amount &&
                      typeof table.totals.vat_amount === "number"
                        ? formatCurrency(table.totals.vat_amount)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {table.totals?.total_incl_vat &&
                      typeof table.totals.total_incl_vat === "number"
                        ? formatCurrency(table.totals.total_incl_vat)
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
