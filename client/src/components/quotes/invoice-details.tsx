import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { QuoteMetadata } from "@/types/quotes";
import { formatCurrency } from "@/lib/format";

interface InvoiceDetailsProps {
  metadata: Partial<QuoteMetadata>;
}

export function InvoiceDetails({ metadata }: InvoiceDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
        <CardDescription>Basic information about the invoice</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Invoice Number</TableCell>
              <TableCell>{metadata.invoice_number || "N/A"}</TableCell>
              <TableCell className="font-medium">Date</TableCell>
              <TableCell>{metadata.date || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Vendor</TableCell>
              <TableCell>{metadata.vendor || "N/A"}</TableCell>
              <TableCell className="font-medium">Total Amount</TableCell>
              <TableCell>
                {metadata.total_amount !== undefined
                  ? formatCurrency(metadata.total_amount)
                  : "N/A"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
