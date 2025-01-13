"use client";

import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "../actions/stripe";
import { useToast } from "@/hooks/use-toast";
import { PLANS } from "@/lib/plans";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingCardsProps {
  userId?: string;
  email?: string;
  isFromRegistration?: boolean;
}

export function PricingCards({
  userId,
  email,
  isFromRegistration,
}: PricingCardsProps) {
  const { toast } = useToast();

  async function handleSubscribe(planId: keyof typeof PLANS) {
    try {
      const plan = PLANS[planId];

      if (planId === "FREE") {
        toast({
          title: "Free plan selected",
          description: "You can now use the free features.",
        });
        return;
      }

      if (!("stripePriceId" in plan) || !plan.stripePriceId) {
        throw new Error("No price ID found");
      }

      await createCheckoutSession(plan.stripePriceId);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
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
        {Object.entries(PLANS).map(([planId, plan]) => (
          <Card
            key={planId}
            className={cn(
              "relative rounded-lg p-6",
              planId === "PREMIUM" && "bg-primary/5 ring-2 ring-primary"
            )}
          >
            {planId === "PREMIUM" && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-32 rounded-full bg-primary px-3 py-1 text-center text-sm font-medium text-white">
                Most Popular
              </div>
            )}
            <div className="flex flex-col h-full">
              <div>
                <h3
                  className={cn(
                    "text-lg font-semibold",
                    planId === "PREMIUM" && "text-primary"
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
                {features[planId as keyof typeof features].map((feature) => (
                  <li key={feature} className="flex gap-x-2">
                    <Check
                      className="h-5 w-4 flex-none text-primary"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "mt-6",
                  planId === "PREMIUM" && "bg-primary hover:bg-primary/90"
                )}
                onClick={() => handleSubscribe(planId as keyof typeof PLANS)}
              >
                {planId === "FREE"
                  ? isFromRegistration
                    ? "Start with Free"
                    : "Get Started"
                  : "Subscribe"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
