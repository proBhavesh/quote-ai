import { Metadata } from "next";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteStatus } from "@/components/quote-status";

export const metadata: Metadata = {
  title: "Quotes - Quote AI",
  description: "Manage and analyze your quotes",
};

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; page?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const status = params.status;
  const sort = params.sort || "desc";
  const page = Number(params.page) || 1;
  const limit = 10;

  const where = {
    userId: session?.user?.id,
    ...(status && { status: status.toUpperCase() }),
  };

  const quotes = await prisma.quote.findMany({
    where,
    orderBy: {
      createdAt: sort as "asc" | "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  const totalQuotes = await prisma.quote.count({ where });
  const totalPages = Math.ceil(totalQuotes / limit);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
        <Link href="/quotes/new">
          <Button>Upload New Quote</Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input placeholder="Search quotes..." />
        </div>
        <Select defaultValue={status || "all"}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue={sort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotes</CardTitle>
          <CardDescription>
            Showing {quotes.length} of {totalQuotes} quotes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length > 0 ? (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{quote.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <QuoteStatus
                      quoteId={quote.id}
                      initialStatus={quote.status}
                    />
                    <Link href={`/quotes/${quote.id}`}>
                      <Button variant="ghost">View Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No quotes found. Start by uploading your first quote.
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`/quotes?page=${pageNum}${
                  status ? `&status=${status}` : ""
                }${sort ? `&sort=${sort}` : ""}`}
              >
                <Button
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                >
                  {pageNum}
                </Button>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
