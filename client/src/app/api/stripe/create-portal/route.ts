import { auth } from "@/auth";
import { stripe } from "@/lib/stripe-client";
import { absoluteUrl } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    // Auth is handled by middleware
    const userId = session!.user!.id;

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return new NextResponse("No stripe customer id", { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: absoluteUrl("/dashboard"),
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
