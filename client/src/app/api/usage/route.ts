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

    // Get current usage period
    const now = new Date();
    const usage = await prisma.usage.findFirst({
      where: {
        userId: session.user.id,
        periodStart: {
          lte: now,
        },
        periodEnd: {
          gte: now,
        },
      },
      orderBy: {
        periodStart: "desc",
      },
    });

    if (!usage) {
      // If no usage record exists, create one for current month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const newUsage = await prisma.usage.create({
        data: {
          id: `${session.user.id}-${firstDayOfMonth.getTime()}`,
          userId: session.user.id,
          quotesAnalyzed: 0,
          periodStart: firstDayOfMonth,
          periodEnd: lastDayOfMonth,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        quotesAnalyzed: 0,
        maxQuotes: PLANS[subscription.plan].quotas.maxQuotes,
        periodStart: newUsage.periodStart,
        periodEnd: newUsage.periodEnd,
      });
    }

    // Get the plan's quota
    const plan = PLANS[subscription.plan];
    const maxQuotes = plan.quotas.maxQuotes;

    return NextResponse.json({
      quotesAnalyzed: usage.quotesAnalyzed,
      maxQuotes: maxQuotes === -1 ? Infinity : maxQuotes, // Handle unlimited quotes
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
