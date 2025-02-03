"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe-client";
import type Stripe from "stripe";
import { createOrRetrieveCustomer } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { PLANS, PlanId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCheckoutSession(priceId: string) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription" as Stripe.Checkout.SessionCreateParams.Mode,
    customer_email: session.user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
    subscription_data: {
      metadata: {
        userId: session.user.id,
      },
    },
  } as Stripe.Checkout.SessionCreateParams);

  if (!checkoutSession.url) {
    throw new Error("Failed to create checkout session");
  }

  redirect(checkoutSession.url);
}

interface SubscriptionAction {
  status: "success" | "error";
  message: string;
  url?: string;
}

/**
 * Handle subscription plan changes
 */
export async function handleSubscriptionChange(
  planId: PlanId
): Promise<SubscriptionAction> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        status: "error",
        message: "You must be logged in to manage subscriptions.",
      };
    }

    // Get current subscription status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return {
        status: "error",
        message: "User not found.",
      };
    }

    const currentPlan = user.subscriptionStatus || "FREE";

    // If selecting the same plan
    if (currentPlan === planId) {
      if (planId === "FREE") {
        return {
          status: "error",
          message: "You are already on the Free plan.",
        };
      }
      // For paid plans, redirect to billing portal
      if (!user.stripeCustomerId) {
        return {
          status: "error",
          message: "No billing information found.",
        };
      }
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: absoluteUrl("/dashboard"),
      });
      return {
        status: "success",
        message: "Redirecting to billing portal...",
        url: portalSession.url,
      };
    }

    // Handling Free Plan Selection
    if (planId === "FREE") {
      if (!user.stripeSubscriptionId) {
        return {
          status: "error",
          message: "No active subscription to cancel.",
        };
      }
      // Redirect to billing portal to cancel subscription
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId!,
        return_url: absoluteUrl("/dashboard"),
      });
      return {
        status: "success",
        message: "Redirecting to cancel your subscription...",
        url: portalSession.url,
      };
    }

    // Handle paid plan changes
    const plan = PLANS[planId];
    if (!("stripePriceId" in plan) || !plan.stripePriceId) {
      return {
        status: "error",
        message: "Invalid plan selected.",
      };
    }

    // Create or get Stripe customer
    const customer = await createOrRetrieveCustomer(
      session.user.id,
      session.user.email ?? ""
    );

    // If user has an active subscription
    if (user.stripeSubscriptionId) {
      // Update the subscription
      const subscription = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId
      );
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: plan.stripePriceId,
          },
        ],
        proration_behavior: "always_invoice",
        metadata: {
          userId: session.user.id,
          planId: planId,
        },
      });

      revalidatePath("/dashboard");
      revalidatePath("/settings");

      return {
        status: "success",
        message: "Your subscription has been updated.",
      };
    }

    // Create new subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: absoluteUrl("/dashboard?success=true"),
      cancel_url: absoluteUrl("/pricing?canceled=true"),
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId: planId,
        },
      },
      metadata: {
        userId: session.user.id,
        planId: planId,
      },
    });

    if (!checkoutSession.url) {
      return {
        status: "error",
        message: "Failed to create checkout session.",
      };
    }

    return {
      status: "success",
      message: "Redirecting to checkout...",
      url: checkoutSession.url,
    };
  } catch (error) {
    console.error("Subscription change error:", error);
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
