import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-client";
import { env } from "@/env";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature");

  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Missing signature or webhook secret", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error verifying webhook signature:", error);
      return new NextResponse(`Webhook Error: ${error.message}`, {
        status: 400,
      });
    }
    return new NextResponse("Unknown error occurred", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session?.metadata?.userId) {
          throw new Error("User id is required");
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await updateSubscriptionInDatabase(
          session.metadata.userId,
          subscription
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        await updateSubscriptionInDatabase(
          subscription.metadata.userId,
          subscription
        );
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        if (!subscription?.metadata?.userId) {
          throw new Error("User id is required in subscription metadata");
        }

        await updateSubscriptionInDatabase(
          subscription.metadata.userId,
          subscription
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error processing webhook:", error);
      return new NextResponse(`Webhook Error: ${error.message}`, {
        status: 400,
      });
    }
    return new NextResponse("Unknown error occurred", { status: 400 });
  }
}

async function updateSubscriptionInDatabase(
  userId: string,
  subscription: Stripe.Subscription
) {
  const { prisma } = await import("@/lib/prisma");

  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    stripePriceId: subscription.items.data[0].price.id,
    stripeCustomerId: subscription.customer as string,
    subscriptionStatus: subscription.status,
  };

  await prisma.user.update({
    where: { id: userId },
    data: subscriptionData,
  });
}
