"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { UsageInfo } from "@/lib/types/usage";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function UsageStats() {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/usage");
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch usage data");
        }
        const data = await response.json();
        setUsage(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching usage:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch usage data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-[140px] animate-pulse rounded-lg bg-muted" />
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          {error || "No usage data available"}
        </p>
      </Card>
    );
  }

  const isNearLimit = !usage.isOverLimit && usage.remainingQuotes <= 5;
  const lastDayOfMonth = new Date();
  lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
  lastDayOfMonth.setDate(0);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium">Quote Analysis Usage</h4>
            <p className="text-sm text-muted-foreground">
              {usage.currentUsage} of {usage.maxQuotes} quotes used this month
            </p>
          </div>
          {(usage.isOverLimit || isNearLimit) && (
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                Upgrade Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        <Progress
          value={usage.percentageUsed}
          className={cn(
            "h-2",
            usage.isOverLimit && "bg-destructive/20 [&>div]:bg-destructive",
            isNearLimit && "bg-warning/20 [&>div]:bg-warning"
          )}
        />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {usage.isOverLimit ? (
              <>
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="font-medium text-destructive">Quota exceeded</p>
              </>
            ) : (
              <p
                className={cn(
                  "text-muted-foreground",
                  isNearLimit && "text-warning"
                )}
              >
                {usage.remainingQuotes} quote
                {usage.remainingQuotes === 1 ? "" : "s"} remaining
              </p>
            )}
          </div>
          <p className="text-muted-foreground">
            Resets on {lastDayOfMonth.toLocaleDateString()}
          </p>
        </div>

        {usage.message && (
          <p
            className={cn(
              "text-sm",
              usage.isOverLimit ? "text-destructive" : "text-warning"
            )}
          >
            {usage.message}
          </p>
        )}
      </div>
    </Card>
  );
}
