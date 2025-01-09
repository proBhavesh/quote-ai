"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe-client";
import type Stripe from "stripe";

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
    success_url: `${process.env.NEXTAUTH_URL}/settings?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
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
