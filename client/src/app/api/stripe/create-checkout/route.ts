import { auth } from "@/auth";
import { stripe } from "@/lib/stripe-client";
import { PLANS } from "@/lib/plans";
import { createOrRetrieveCustomer } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const createCheckoutSchema = z.object({
  planId: z.enum(["PREMIUM", "ENTERPRISE"]),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Auth is handled by middleware
    const userId = session!.user!.id;
    const userEmail = session!.user!.email ?? "";

    const json = await req.json();
    const body = createCheckoutSchema.parse(json);

    const plan = PLANS[body.planId];
    if (!plan?.stripePriceId) {
      return new NextResponse("Invalid plan", { status: 400 });
    }

    const customer = await createOrRetrieveCustomer(
      userId,
      userEmail
    );

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
      metadata: {
        userId: userId,
        planId: body.planId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }

    return new NextResponse("Internal error", { status: 500 });
  }
}
