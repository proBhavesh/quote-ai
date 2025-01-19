import { Metadata } from "next";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { QuotesList } from "@/components/quotes/quotes-list";

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
  if (!session?.user?.id) {
    return null;
  }

  const params = await searchParams;
  const status = params.status;
  const sort = params.sort || "desc";
  const page = Number(params.page) || 1;
  const limit = 10;

  const where = {
    userId: session.user.id,
    ...(status && status !== "all" && { status: status.toUpperCase() }),
  };

  const [initialQuotes, totalQuotes] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: {
        createdAt: sort as "asc" | "desc",
      },
      skip: (page - 1) * limit,
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

      <QuotesList
        initialQuotes={initialQuotes}
        totalQuotes={totalQuotes}
        userId={session.user.id}
      />
    </div>
  );
}
