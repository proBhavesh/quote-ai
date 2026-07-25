import { Metadata } from "next";
import { getSupplierByToken } from "@/lib/rfq";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierResponseForm } from "./supplier-response-form";

export const metadata: Metadata = {
  title: "Submit your quote - Quote AI",
};

export default async function RfqRespondPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supplier = await getSupplierByToken(token);

  if (!supplier) {
    return (
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader>
            <CardTitle>Link not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This link is invalid. Please check with the person who sent it to you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (supplier.status === "RESPONDED") {
    return (
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader>
            <CardTitle>Thanks, {supplier.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We&apos;ve received your quote of {supplier.quotedTotal?.toFixed(2)} for{" "}
              {supplier.rfq.title}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>{supplier.rfq.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hi {supplier.name}, please provide your best price for the following items
            related to &quot;{supplier.rfq.quote.title}&quot;:
          </p>
          <ul className="space-y-1 text-sm">
            {supplier.rfq.lineItems.map((item) => (
              <li key={item.id}>
                {item.description} — qty {item.quantity}
              </li>
            ))}
          </ul>
          {supplier.rfq.message && (
            <p className="text-sm text-muted-foreground">{supplier.rfq.message}</p>
          )}
          <SupplierResponseForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
