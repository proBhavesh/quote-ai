"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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

        if (quoteIndex === -1 && shouldDisplay) {
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
    [status, sort, limit]
  );

  // Subscribe to real-time updates
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

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
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            try {
              const { error } = await supabase
                .from("Quote")
                .select("*")
                .eq("userId", userId)
                .order("createdAt", { ascending: false })
                .limit(1);

              if (error) {
                console.error("Subscription verification failed:", error);
              }
            } catch (err) {
              console.error("Subscription verification failed:", err);
            }
          } else if (status === "CLOSED" && retryCount < maxRetries) {
            retryCount++;
            setupChannel();
          } else if (status === "CHANNEL_ERROR") {
            console.error("Supabase channel error:", status);
          }
        });

      return channel;
    }

    const channel = setupChannel();

    return () => {
      supabase.removeChannel(channel).catch((error) => {
        console.error("Failed to remove Supabase channel:", error);
      });
    };
  }, [userId, handleQuoteUpdate, quotes]);

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
            Showing {quotes.length} of {totalQuotes} quotes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground">
              Loading...
            </div>
          ) : quotes.length > 0 ? (
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
                    <div className="flex items-center gap-2">
                      <QuoteStatusIcon status={quote.status} />
                      <span className="text-sm font-medium capitalize">
                        {quote.status.toLowerCase()}
                      </span>
                    </div>
                    <Link href={`/quotes/${quote.id}`}>
                      <Button variant="ghost">View Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No quotes found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
