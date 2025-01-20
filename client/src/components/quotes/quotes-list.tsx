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

  // Subscribe to real-time updates
  useEffect(() => {
    console.log("Setting up Supabase subscription with:", {
      currentStatus: status,
      userId,
      page,
      sort,
      quotesCount: quotes.length,
    });

    const channel = supabase
      .channel("quotes-channel")
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "Quote",
          filter: `userId=eq.${userId}`,
        },
        (payload: {
          new: { id: string; status: string };
          old: { status: string };
        }) => {
          console.log("Received quote update:", {
            quoteId: payload.new.id,
            oldStatus: payload.old.status,
            newStatus: payload.new.status,
            currentFilter: status,
            currentPage: page,
            currentSort: sort,
          });

          // Always refetch to ensure we have the correct page of data
          fetchQuotes();
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "Quote",
          filter: `userId=eq.${userId}`,
        },
        (payload: { new: Quote }) => {
          console.log("Received new quote:", {
            quoteId: payload.new.id,
            status: payload.new.status,
            currentFilter: status,
            currentPage: page,
            currentSort: sort,
          });

          // Always refetch to ensure we have the correct page of data
          fetchQuotes();
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "DELETE",
          schema: "public",
          table: "Quote",
          filter: `userId=eq.${userId}`,
        },
        (payload: { old: Quote }) => {
          console.log("Quote deleted:", {
            quoteId: payload.old.id,
            currentPage: page,
            currentSort: sort,
          });
          fetchQuotes();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up Supabase subscription");
      supabase.removeChannel(channel);
    };
  }, [userId, status, page, sort, fetchQuotes, quotes.length]);

  // Fetch quotes when params change
  useEffect(() => {
    console.log("Fetching quotes with params:", {
      status,
      sort,
      page,
    });
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
              No quotes found. Start by uploading your first quote.
            </div>
          )}
        </CardContent>
      </Card>

      {Math.ceil(totalQuotes / limit) > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from(
            { length: Math.ceil(totalQuotes / limit) },
            (_, i) => i + 1
          ).map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => updateParams({ page: pageNum.toString() })}
            >
              {pageNum}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
