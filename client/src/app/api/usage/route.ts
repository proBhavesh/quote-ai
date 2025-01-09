import { auth } from "@/auth";
import { PLANS } from "@/lib/plans";
import { checkSubscription } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");
    const subscription = await checkSubscription(session.user.id);

    // Get current billing period
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get quotes analyzed in current period
    const currentUsage = await prisma.usage.findFirst({
      where: {
        userId: session.user.id,
        periodStart: {
          lte: now,
        },
        periodEnd: {
          gte: now,
        },
      },
    });

    // If no usage record exists for current period, create one
    const usage =
      currentUsage ||
      (await prisma.usage.create({
        data: {
          id: `${session.user.id}-${firstDayOfMonth.getTime()}`,
          userId: session.user.id,
          quotesAnalyzed: 0,
          periodStart: firstDayOfMonth,
          periodEnd: lastDayOfMonth,
          updatedAt: new Date(),
        },
      }));

    const plan = PLANS[subscription.plan];

    return NextResponse.json({
      quotesAnalyzed: usage.quotesAnalyzed,
      maxQuotes: plan.quotas.maxQuotes,
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
