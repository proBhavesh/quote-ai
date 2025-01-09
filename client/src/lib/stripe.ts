"use server";

import { PlanId, PLANS } from "./plans";
import { stripe } from "./stripe-client";

export async function createOrRetrieveCustomer(userId: string, email: string) {
  const { prisma } = await import("@/lib/prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) {
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    if (customer.deleted) {
      throw new Error("Customer deleted in Stripe");
    }
    return customer;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer;
}

export async function checkSubscription(userId: string): Promise<{
  isSubscribed: boolean;
  plan: PlanId;
  isCanceled: boolean;
  stripeCurrentPeriodEnd: Date | null;
}> {
  const { prisma } = await import("@/lib/prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeCurrentPeriodEnd: true,
      subscriptionStatus: true,
    },
  });

  if (!user) throw new Error("User not found");

  // If the user has no subscription data, they're on the free plan
  if (!user.stripeSubscriptionId || !user.stripePriceId) {
    return {
      isSubscribed: false,
      plan: "FREE",
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    };
  }

  // Check if subscription is active
  const isSubscribed =
    (user.stripeCurrentPeriodEnd?.getTime() ?? 0) + 86_400_000 > Date.now();

  const subscription = await stripe.subscriptions.retrieve(
    user.stripeSubscriptionId
  );

  const isCanceled = subscription.cancel_at_period_end;

  // Find the plan by matching the price ID
  const planEntry = Object.entries(PLANS).find(
    ([, plan]) =>
      "stripePriceId" in plan && plan.stripePriceId === user.stripePriceId
  );

  const plan = (planEntry?.[0] as PlanId) || "FREE";

  return {
    isSubscribed,
    plan,
    isCanceled,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
  };
}
