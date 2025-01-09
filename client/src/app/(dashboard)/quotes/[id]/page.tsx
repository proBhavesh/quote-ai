import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { QuoteStatus } from "@/components/quote-status";

export const metadata: Metadata = {
  title: "Quote Details - Quote AI",
  description: "View quote analysis and comparison",
};

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const quote = await prisma.quote.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!quote) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{quote.title}</h2>
          <p className="text-muted-foreground">
            Uploaded on {new Date(quote.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <QuoteStatus quoteId={quote.id} initialStatus={quote.status} />
          <Link href={quote.fileUrl} target="_blank">
            <Button variant="outline">View Original PDF</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Original Quote</CardTitle>
            <CardDescription>
              Details extracted from your uploaded quote
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quote.originalData ? (
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(quote.originalData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                {quote.status === "PENDING" || quote.status === "PROCESSING"
                  ? "Quote is being processed..."
                  : "No data extracted"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
            <CardDescription>
              Cost estimates and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quote.results ? (
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(quote.results, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                {quote.status === "PENDING" || quote.status === "PROCESSING"
                  ? "Analysis in progress..."
                  : "No analysis available"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {quote.status === "COMPLETED" && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Comparison</CardTitle>
            <CardDescription>
              Compare original costs with AI-calculated estimates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* We'll implement the comparison visualization here */}
              <p className="text-muted-foreground">
                Detailed cost comparison coming soon...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {quote.status === "ERROR" && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Processing Quote
            </CardTitle>
            <CardDescription>
              There was an error processing your quote. Please try uploading
              again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Link href="/quotes/new">
                <Button>Upload New Quote</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
