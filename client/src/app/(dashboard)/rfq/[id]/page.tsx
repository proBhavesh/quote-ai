import { Metadata } from "next";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRfqForUser } from "@/lib/rfq";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SendRfqButton } from "./send-rfq-button";

export const metadata: Metadata = {
  title: "RFQ - Quote AI",
};

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive"> = {
  PENDING: "secondary",
  SENT: "default",
  RESPONDED: "default",
  DECLINED: "destructive",
};

export default async function RfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id;

  const rfq = await getRfqForUser(id, userId);
  if (!rfq) {
    notFound();
  }

  const originalTotal = rfq.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const respondedSuppliers = rfq.suppliers.filter((s) => s.quotedTotal != null);
  const bestOffer =
    respondedSuppliers.length > 0
      ? Math.min(...respondedSuppliers.map((s) => s.quotedTotal!))
      : null;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{rfq.title}</h1>
          <p className="text-muted-foreground">
            For{" "}
            <Link href={`/quotes/${rfq.quote.id}`} className="underline">
              {rfq.quote.title}
            </Link>
          </p>
        </div>
        <Badge variant={rfq.status === "DRAFT" ? "secondary" : "default"}>
          {rfq.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items requested</CardTitle>
          <CardDescription>
            Originally quoted total for these items: {originalTotal.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {rfq.lineItems.map((item) => (
              <li key={item.id}>
                {item.description} — qty {item.quantity} @ {item.unitPrice}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Suppliers</CardTitle>
            <CardDescription>
              {bestOffer != null
                ? `Best offer so far: ${bestOffer.toFixed(2)} (vs. ${originalTotal.toFixed(2)} originally quoted)`
                : "No responses yet"}
            </CardDescription>
          </div>
          {rfq.status === "DRAFT" && <SendRfqButton rfqId={rfq.id} />}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quoted total</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfq.suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[supplier.status] || "secondary"}>
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {supplier.quotedTotal != null
                      ? supplier.quotedTotal.toFixed(2)
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {supplier.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
