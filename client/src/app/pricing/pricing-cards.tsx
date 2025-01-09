"use client";

import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "../actions/stripe";
import { useToast } from "@/hooks/use-toast";
import { PLANS } from "@/lib/plans";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingCardsProps {
  // These props are used for Stripe checkout
  userId?: string;
  email?: string;
  isFromRegistration?: boolean;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export function PricingCards({
  userId,
  email,
  isFromRegistration,
}: PricingCardsProps) {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const { toast } = useToast();

  // These parameters (userId: ${userId}, email: ${email}) will be used for Stripe checkout
  async function handleSubscribe(planId: keyof typeof PLANS) {
    try {
      const plan = PLANS[planId];

      if (planId === "FREE") {
        // Handle free plan selection
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
      "Export to PDF/Excel",
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
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base font-semibold leading-7 text-primary">
          Pricing
        </h2>
        <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Choose the right plan for you
        </p>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Get started for free and upgrade as you grow. All plans include core
          features.
        </p>
      </div>
      <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {Object.entries(PLANS).map(([planId, plan]) => (
          <Card
            key={planId}
            className={cn(
              "relative rounded-3xl p-8 ring-1 ring-gray-200 dark:ring-gray-800 xl:p-10",
              planId === "PREMIUM" && "bg-primary/5 ring-2 ring-primary"
            )}
          >
            {planId === "PREMIUM" && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-32 rounded-full bg-primary px-3 py-1 text-center text-sm font-medium text-white">
                Most Popular
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  className={cn(
                    "text-lg font-semibold leading-8",
                    planId === "PREMIUM" && "text-primary"
                  )}
                >
                  {plan.name}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {planId === "FREE"
                  ? "Perfect for getting started"
                  : planId === "PREMIUM"
                  ? "Best for growing businesses"
                  : "For large enterprises"}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight">
                  ${plan.price}
                </span>
                <span className="text-sm font-semibold leading-6 text-muted-foreground">
                  /month
                </span>
              </p>
              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground"
              >
                {features[planId as keyof typeof features].map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className="h-6 w-5 flex-none text-primary"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={cn(
                  "mt-8",
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
