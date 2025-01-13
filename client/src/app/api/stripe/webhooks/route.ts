import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-client";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature");

  if (!signature) {
    console.error("[Webhook] No signature found in request headers");
    return new NextResponse("No signature found", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", {
      error: err,
      message: err instanceof Error ? err.message : "Unknown error",
    });
    return new NextResponse(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 400 }
    );
  }

  console.log("[Webhook] Event received:", {
    type: event.type,
    id: event.id,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get subscription details to access metadata
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        console.log("[Webhook] Subscription retrieved:", {
          subscriptionId: subscription.id,
          metadata: subscription.metadata,
        });

        const userId = subscription.metadata.userId;
        if (!userId) {
          console.error("[Webhook] Missing userId in metadata");
          return new NextResponse("Missing userId", { status: 400 });
        }

        // Find user first to ensure they exist
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          console.error("[Webhook] User not found:", { userId });
          return new NextResponse("User not found", { status: 404 });
        }

        // Determine plan from price ID
        const priceId = subscription.items.data[0].price.id;
        const planId =
          priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
            ? "PREMIUM"
            : priceId === process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
            ? "ENTERPRISE"
            : "FREE";

        console.log("[Webhook] Updating user subscription:", {
          userId,
          planId,
          subscriptionId: subscription.id,
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: priceId,
            subscriptionStatus: planId,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            updatedAt: new Date(),
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) {
          console.log("[Webhook] No subscription in invoice");
          return new NextResponse(null, { status: 200 });
        }

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        console.log("[Webhook] Processing invoice payment:", {
          subscriptionId: subscription.id,
        });

        const user = await prisma.user.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error("[Webhook] User not found for subscription:", {
            subscriptionId: subscription.id,
          });
          return new NextResponse("User not found", { status: 404 });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            updatedAt: new Date(),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[Webhook] Processing subscription deletion:", {
          subscriptionId: subscription.id,
        });

        const user = await prisma.user.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error("[Webhook] User not found for subscription:", {
            subscriptionId: subscription.id,
          });
          return new NextResponse("User not found", { status: 404 });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            subscriptionStatus: "FREE",
            stripeCurrentPeriodEnd: null,
            updatedAt: new Date(),
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0].price.id;
        console.log("[Webhook] Processing subscription update:", {
          subscriptionId: subscription.id,
          priceId,
        });

        const user = await prisma.user.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error("[Webhook] User not found for subscription:", {
            subscriptionId: subscription.id,
          });
          return new NextResponse("User not found", { status: 404 });
        }

        const planId =
          priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
            ? "PREMIUM"
            : priceId === process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
            ? "ENTERPRISE"
            : "FREE";

        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripePriceId: priceId,
            subscriptionStatus: planId,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            updatedAt: new Date(),
          },
        });
        break;
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      type: event.type,
    });
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
