"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteStatusIcon } from "@/components/quote-status-icon";
import { supabase } from "@/lib/supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface Quote {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
}

interface QuotesListProps {
  initialQuotes: Quote[];
  totalQuotes: number;
  userId: string;
}

export function QuotesList({
  initialQuotes,
  totalQuotes,
  userId,
}: QuotesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [isLoading, setIsLoading] = useState(false);

  const status = searchParams.get("status") || "all";
  const sort = searchParams.get("sort") || "desc";
  const page = Number(searchParams.get("page")) || 1;
  const limit = 10;
  const totalPages = Math.ceil(totalQuotes / limit);

  // Function to fetch quotes
  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/quotes?status=${status}&sort=${sort}&page=${page}`
      );
      const data = await response.json();
      setQuotes(data.quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [status, sort, page]);

  // Update URL with new params
  const updateParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/quotes?${params.toString()}`);
  };

  // Handle real-time updates
  const handleQuoteUpdate = useCallback(
    (updatedQuote: Quote) => {
      setQuotes((currentQuotes) => {
        const shouldDisplay =
          status === "all" ||
          updatedQuote.status.toLowerCase() === status.toLowerCase();

        const quoteIndex = currentQuotes.findIndex(
          (q) => q.id === updatedQuote.id
        );

        if (quoteIndex === -1 && shouldDisplay && page === 1) {
          const newQuotes = [updatedQuote, ...currentQuotes].slice(0, limit);
          return sort === "desc" ? newQuotes : newQuotes.reverse();
        } else if (quoteIndex !== -1) {
          const newQuotes = [...currentQuotes];
          if (shouldDisplay) {
            newQuotes[quoteIndex] = updatedQuote;
          } else {
            newQuotes.splice(quoteIndex, 1);
          }
          return newQuotes;
        }

        return currentQuotes;
      });
    },
    [status, sort, limit, page]
  );

  // Subscribe to real-time updates
  useEffect(() => {
    function setupChannel() {
      const channel = supabase
        .channel(`quotes-list-${userId}-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "Quote",
            filter: `userId=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<Quote>) => {
            if (payload.new) {
              handleQuoteUpdate(payload.new as Quote);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Quote",
            filter: `userId=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<Quote>) => {
            if (payload.new) {
              handleQuoteUpdate(payload.new as Quote);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "Quote",
            filter: `userId=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<Quote>) => {
            const oldQuote = payload.old as Quote | undefined;
            if (oldQuote?.id) {
              setQuotes((current) =>
                current.filter((q) => q.id !== oldQuote.id)
              );
            }
          }
        )
        .subscribe();

      return channel;
    }

    const channel = setupChannel();

    return () => {
      supabase.removeChannel(channel).catch((error) => {
        console.error("Failed to remove Supabase channel:", error);
      });
    };
  }, [userId, handleQuoteUpdate]);

  // Initial fetch when params change
  useEffect(() => {
    fetchQuotes();
  }, [status, sort, page, fetchQuotes]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input placeholder="Search quotes..." />
        </div>
        <Select
          value={status}
          onValueChange={(value) => updateParams({ status: value, page: "1" })}
        >
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
        <Select
          value={sort}
          onValueChange={(value) => updateParams({ sort: value, page: "1" })}
        >
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
            Showing {Math.min(page * limit, totalQuotes) - (page - 1) * limit}{" "}
            of {totalQuotes} quotes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array.from({ length: limit }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : quotes.length > 0 ? (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <QuoteStatusIcon status={quote.status} />
                  <span className="flex-1 font-medium">{quote.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No quotes found
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) =>
                updateParams({ page: String(newPage) })
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
