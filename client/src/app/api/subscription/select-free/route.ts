import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    // Auth is handled by middleware
    const userId = session!.user!.id;

    const { prisma } = await import("@/lib/prisma");

    // Get current billing period
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Update user subscription status
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "FREE",
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });

    // Check if usage record already exists for current period
    const existingUsage = await prisma.usage.findFirst({
      where: {
        userId: userId,
        periodStart: {
          gte: firstDayOfMonth,
        },
        periodEnd: {
          lte: lastDayOfMonth,
        },
      },
    });

    // Only create a new usage record if one doesn't exist
    if (!existingUsage) {
      await prisma.usage.create({
        data: {
          id: `${userId}-${firstDayOfMonth.getTime()}`,
          userId: userId,
          quotesAnalyzed: 0,
          periodStart: firstDayOfMonth,
          periodEnd: lastDayOfMonth,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error selecting free plan:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
