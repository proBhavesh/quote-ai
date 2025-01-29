"use client";

import { Button } from "@/components/ui/button";
import { handleSubscriptionChange } from "../actions/stripe";
import { useToast } from "@/hooks/use-toast";
import { PLANS, PlanId } from "@/lib/plans";
import { Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PricingCardsProps {
  userId?: string;
  currentPlan: PlanId;
  isFromRegistration?: boolean;
}

export function PricingCards({
  userId,
  currentPlan,
  isFromRegistration,
}: PricingCardsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Handle success/cancel messages from Stripe
  useEffect(() => {
    if (searchParams?.get("success")) {
      toast({
        title: "Payment successful",
        description: "Your subscription has been updated.",
      });
    }
    if (searchParams?.get("canceled")) {
      toast({
        title: "Payment canceled",
        description: "Your subscription remains unchanged.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  async function handleSubscribe(planId: PlanId) {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingPlan(planId);

      const result = await handleSubscriptionChange(planId);

      if (result.status === "error") {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: result.message,
      });

      if (result.url) {
        router.push(result.url);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  }

  const features = {
    FREE: [
      "5 quotes per month",
      "Basic quote analysis",
      "Email support",
      "Community access",
    ],
    PREMIUM: [
      "50 quotes per month",
      "Advanced quote analysis",
      "Priority email support",
      "Custom reports",
      "Sector-specific estimates",
      "Batch processing (up to 5 files)",
    ],
    ENTERPRISE: [
      "Unlimited quotes",
      "Enterprise-grade analysis",
      "Dedicated support",
      "Custom integrations",
      "API access",
      "Team collaboration",
      "Advanced analytics",
      "Custom workflows",
      "SLA guarantees",
    ],
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Pricing Plans</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Start free and upgrade as you grow
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(PLANS).map(([planId, plan]) => {
          const isCurrentPlan = currentPlan === planId;
          const planKey = planId as PlanId;
          const isUpgrade = planKey !== "FREE" && currentPlan === "FREE";
          const isDowngrade = planKey === "FREE" && currentPlan !== "FREE";

          return (
            <Card
              key={planId}
              className={cn(
                "relative rounded-lg p-6",
                planId === "PREMIUM" && "bg-primary/5 ring-2 ring-primary",
                isCurrentPlan && "ring-2 ring-green-500"
              )}
            >
              {planId === "PREMIUM" && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-32 rounded-full bg-primary px-3 py-1 text-center text-sm font-medium text-white">
                  Most Popular
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute right-6 top-6 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Current Plan
                </div>
              )}
              <div className="flex flex-col h-full">
                <div>
                  <h3
                    className={cn(
                      "text-lg font-semibold",
                      planId === "PREMIUM" && "text-primary",
                      isCurrentPlan && "text-green-700"
                    )}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {planId === "FREE"
                      ? "Perfect for getting started"
                      : planId === "PREMIUM"
                      ? "Best for growing businesses"
                      : "For large enterprises"}
                  </p>
                  <p className="mt-4 flex items-baseline">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      /month
                    </span>
                  </p>
                </div>

                <ul className="mt-6 space-y-2 text-sm flex-grow">
                  {features[planKey].map((feature) => (
                    <li key={feature} className="flex gap-x-2">
                      <Check
                        className={cn(
                          "h-5 w-4 flex-none",
                          isCurrentPlan ? "text-green-500" : "text-primary"
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "mt-6",
                    planId === "PREMIUM" && "bg-primary hover:bg-primary/90",
                    isCurrentPlan &&
                      "bg-green-100 text-green-700 hover:bg-green-200",
                    isUpgrade && "bg-primary hover:bg-primary/90",
                    isDowngrade && "bg-destructive hover:bg-destructive/90"
                  )}
                  onClick={() => handleSubscribe(planKey)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === planId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    planId === "FREE" ? (
                      "Current Plan"
                    ) : (
                      "Manage Subscription"
                    )
                  ) : planId === "FREE" ? (
                    isFromRegistration ? (
                      "Start with Free"
                    ) : (
                      "Downgrade to Free"
                    )
                  ) : isUpgrade ? (
                    "Upgrade Now"
                  ) : planKey === "ENTERPRISE" ? (
                    "Contact Sales"
                  ) : (
                    "Change Plan"
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
