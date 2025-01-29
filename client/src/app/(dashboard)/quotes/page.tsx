import { Metadata } from "next";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { QuotesList } from "@/components/quotes/quotes-list";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Quotes - Quote AI",
  description: "Manage and analyze your quotes",
};

interface SearchParams {
  status?: string;
  sort?: string;
  page?: string;
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    // Await searchParams values
    const { status, sort = "desc", page = "1" } = await searchParams;
    const currentPage = Number(page);
    const limit = 10;

    const where = {
      userId: session.user.id,
      ...(status && status !== "all" && { status: status.toUpperCase() }),
    };

    const [quotes, totalQuotes] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: {
          createdAt: sort as "asc" | "desc",
        },
        skip: (currentPage - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.quote.count({ where }),
    ]);

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
          <Link href="/quotes/new">
            <Button>Upload New Quote</Button>
          </Link>
        </div>

        {quotes.length === 0 && !status ? (
          <Card>
            <CardHeader>
              <CardTitle>No Quotes Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You haven&apos;t uploaded any quotes yet. Click the button above
                to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <QuotesList
            initialQuotes={quotes}
            totalQuotes={totalQuotes}
            userId={session.user.id}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error("[QUOTES_PAGE]", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            There was an error loading your quotes. Please try again later or
            contact support if the problem persists.
          </p>
        </CardContent>
      </Card>
    );
  }
}
