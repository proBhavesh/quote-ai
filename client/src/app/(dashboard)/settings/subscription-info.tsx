"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionInfoProps {
  subscription: {
    isSubscribed: boolean;
    plan: keyof typeof PLANS;
    isCanceled: boolean;
    stripeCurrentPeriodEnd: Date | null;
  };
}

export function SubscriptionInfo({ subscription }: SubscriptionInfoProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Default to FREE plan if subscription or plan is undefined
  const plan = subscription?.plan ? PLANS[subscription.plan] : PLANS.FREE;

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) router.push(data.url);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading subscription info...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{plan.name} Plan</h3>
            {subscription.isCanceled ? (
              <Badge variant="destructive">Canceled</Badge>
            ) : subscription.isSubscribed ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="secondary">Free</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {subscription.isSubscribed
              ? `${plan.quotas.maxQuotes} quotes per month`
              : "Up to 5 quotes per month"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-2xl font-bold">
            ${plan.price}
            <span className="text-sm font-normal text-muted-foreground">
              /month
            </span>
          </div>
          {subscription.stripeCurrentPeriodEnd && (
            <p className="text-xs text-muted-foreground">
              Current period ends on{" "}
              {new Date(
                subscription.stripeCurrentPeriodEnd
              ).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          onClick={handleManageSubscription}
          disabled={loading || !subscription.isSubscribed}
        >
          {loading
            ? "Loading..."
            : subscription.isSubscribed
            ? "Manage Subscription"
            : "Upgrade Plan"}
        </Button>
      </div>
    </Card>
  );
}
