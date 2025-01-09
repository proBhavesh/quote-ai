"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface UsageData {
  quotesAnalyzed: number;
  maxQuotes: number;
  periodStart: string;
  periodEnd: string;
}

export function UsageStats() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/usage");
        const data = await response.json();
        setUsage(data);
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-[100px] animate-pulse rounded-lg bg-muted" />
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">No usage data available</p>
      </Card>
    );
  }

  const percentage = (usage.quotesAnalyzed / usage.maxQuotes) * 100;
  const remaining = usage.maxQuotes - usage.quotesAnalyzed;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium">Quote Analysis Usage</h4>
          <p className="text-sm text-muted-foreground">
            {usage.quotesAnalyzed} of {usage.maxQuotes} quotes used
          </p>
        </div>

        <Progress value={percentage} className="h-2" />

        <div className="flex justify-between text-sm text-muted-foreground">
          <p>
            {remaining} quote{remaining === 1 ? "" : "s"} remaining
          </p>
          <p>Resets on {new Date(usage.periodEnd).toLocaleDateString()}</p>
        </div>
      </div>
    </Card>
  );
}
