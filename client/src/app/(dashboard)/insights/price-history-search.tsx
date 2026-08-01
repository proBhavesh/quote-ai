"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { searchPriceHistoryAction } from "@/app/actions/price-history";
import type { PriceHistoryResult } from "@/lib/price-history";

const SOURCE_LABEL: Record<string, string> = {
  QUOTE_ANALYSIS: "AI market estimate",
  RFQ_SUPPLIER_RESPONSE: "Real supplier response",
};

export function PriceHistorySearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PriceHistoryResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const data = await searchPriceHistoryAction(query);
      setResult(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Search failed",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="e.g. concrete mix, drywall, LED fixtures..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {result && result.count === 0 && (
        <p className="text-sm text-muted-foreground">
          No history yet for that search. As you analyze more quotes and collect
          RFQ responses, this will fill in.
        </p>
      )}

      {result && result.count > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {result.count} historical price point{result.count === 1 ? "" : "s"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Avg quoted</p>
                <p className="text-lg font-semibold">
                  {result.averageQuotedUnitPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg market estimate</p>
                <p className="text-lg font-semibold">
                  {result.averageMarketUnitPriceEstimate != null
                    ? result.averageMarketUnitPriceEstimate.toFixed(2)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lowest seen</p>
                <p className="text-lg font-semibold">
                  {result.minQuotedUnitPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Highest seen</p>
                <p className="text-lg font-semibold">
                  {result.maxQuotedUnitPrice.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.observations.map((obs) => (
                    <TableRow key={obs.id}>
                      <TableCell className="max-w-[240px] truncate">
                        {obs.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            obs.source === "RFQ_SUPPLIER_RESPONSE"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {SOURCE_LABEL[obs.source] || obs.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {obs.quotedUnitPrice.toFixed(2)} {obs.currency}
                      </TableCell>
                      <TableCell>
                        {obs.quote ? (
                          <Link
                            href={`/quotes/${obs.quote.id}`}
                            className="underline"
                          >
                            {obs.quote.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(obs.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
