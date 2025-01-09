import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");

    // Get current billing period
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Update user subscription status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionStatus: "FREE",
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });

    // Create initial usage record
    await prisma.usage.create({
      data: {
        id: `${session.user.id}-${firstDayOfMonth.getTime()}`,
        userId: session.user.id,
        quotesAnalyzed: 0,
        periodStart: firstDayOfMonth,
        periodEnd: lastDayOfMonth,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error selecting free plan:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
