"use server";

import { PlanId, PLANS } from "./plans";
import { stripe } from "./stripe-client";
import { PrismaClient } from "@prisma/client";

export async function createOrRetrieveCustomer(userId: string, email: string) {
  try {
    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("User not found");

    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (customer.deleted) {
          // Handle deleted customer
          await handleInvalidCustomer(prisma, userId);
          return createNewCustomer(prisma, userId, email);
        }
        return customer;
      } catch (error) {
        console.error("[STRIPE_CUSTOMER_RETRIEVE_ERROR]", error);
        // Handle invalid customer ID (test/live mode mismatch or non-existent)
        await handleInvalidCustomer(prisma, userId);
        return createNewCustomer(prisma, userId, email);
      }
    }

    return createNewCustomer(prisma, userId, email);
  } catch (error) {
    console.error("[CREATE_RETRIEVE_CUSTOMER_ERROR]", error);
    throw error;
  }
}

// Helper function to create a new customer
async function createNewCustomer(
  prisma: PrismaClient,
  userId: string,
  email: string
) {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customer.id,
      // Reset other Stripe-related fields
      stripeSubscriptionId: null,
      stripePriceId: null,
      subscriptionStatus: "FREE",
      stripeCurrentPeriodEnd: null,
    },
  });

  return customer;
}

// Helper function to handle invalid customer data
async function handleInvalidCustomer(prisma: PrismaClient, userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      subscriptionStatus: "FREE",
      stripeCurrentPeriodEnd: null,
    },
  });
}

export async function checkSubscription(userId: string): Promise<{
  isSubscribed: boolean;
  plan: PlanId;
  isCanceled: boolean;
  stripeCurrentPeriodEnd: Date | null;
}> {
  try {
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

    try {
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
    } catch (error) {
      console.error("[STRIPE_SUBSCRIPTION_ERROR]", error);

      // If there's an error retrieving the subscription, reset to free plan
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: null,
          stripePriceId: null,
          subscriptionStatus: "FREE",
          stripeCurrentPeriodEnd: null,
        },
      });

      return {
        isSubscribed: false,
        plan: "FREE",
        isCanceled: false,
        stripeCurrentPeriodEnd: null,
      };
    }
  } catch (error) {
    console.error("[CHECK_SUBSCRIPTION_ERROR]", error);
    return {
      isSubscribed: false,
      plan: "FREE",
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    };
  }
}
