"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface SupplierLink {
  url: string;
  name: string;
  price?: number;
  availability?: string;
}

interface MarketData {
  price_range?: {
    lowest_market_price?: number;
    highest_market_price?: number;
  };
  supplier_links?: SupplierLink[];
  price_difference?: number;
  current_market_price?: number;
  percentage_difference?: number;
}

interface SupplierLinksProps {
  marketData: MarketData;
  currency: string;
  currentPrice: number;
}

export function SupplierLinks({
  marketData,
  currency,
  currentPrice,
}: SupplierLinksProps) {
  const showPriceRange =
    marketData.price_range?.lowest_market_price !== undefined &&
    marketData.price_range?.highest_market_price !== undefined;
  const showPriceDifference = marketData.percentage_difference !== undefined;
  const hasSuppliers =
    marketData.supplier_links && marketData.supplier_links.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Market Comparison & Alternative Suppliers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range Information */}
        {(showPriceRange || showPriceDifference) && (
          <div className="rounded-lg bg-muted p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(currentPrice, currency)}
                </p>
              </div>
              {showPriceRange && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Market Price Range
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(
                      marketData.price_range!.lowest_market_price!,
                      currency
                    )}{" "}
                    -{" "}
                    {formatCurrency(
                      marketData.price_range!.highest_market_price!,
                      currency
                    )}
                  </p>
                </div>
              )}
              {showPriceDifference && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Price Difference
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      marketData.percentage_difference! > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {marketData.percentage_difference! > 0 ? "+" : ""}
                    {marketData.percentage_difference}% vs Market
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alternative Suppliers */}
        {hasSuppliers && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Alternative Suppliers</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {marketData.supplier_links!.map((supplier, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between rounded-lg border p-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">{supplier.name}</h5>
                      {supplier.availability && (
                        <span
                          className={`text-sm ${
                            supplier.availability.toLowerCase() === "available"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {supplier.availability}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Compare prices and specifications
                    </p>
                  </div>
                  {supplier.url && (
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => window.open(supplier.url, "_blank")}
                    >
                      Visit Supplier
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
