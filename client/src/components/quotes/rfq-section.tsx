import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RfqSummary {
  id: string;
  title: string;
  status: string;
  suppliers: { status: string }[];
}

export function RfqSection({
  quoteId,
  rfqs,
}: {
  quoteId: string;
  rfqs: RfqSummary[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Requests for quote</CardTitle>
          <CardDescription>
            Ask alternate suppliers to beat this quote
          </CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href={`/quotes/${quoteId}/rfq/new`}>New RFQ</Link>
        </Button>
      </CardHeader>
      {rfqs.length > 0 && (
        <CardContent className="space-y-2">
          {rfqs.map((rfq) => {
            const responded = rfq.suppliers.filter((s) => s.status === "RESPONDED").length;
            return (
              <Link
                key={rfq.id}
                href={`/rfq/${rfq.id}`}
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent/50"
              >
                <span>{rfq.title}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {responded}/{rfq.suppliers.length} responded
                  <Badge variant={rfq.status === "DRAFT" ? "secondary" : "default"}>
                    {rfq.status}
                  </Badge>
                </span>
              </Link>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
