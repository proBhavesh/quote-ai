import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";

export async function middleware(request: NextRequest) {
  // Only check usage for quote analysis endpoints
  if (!request.url.includes("/api/analyze")) {
    return NextResponse.next();
  }

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user's subscription status and current usage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionStatus: true,
        Usage: {
          where: {
            periodStart: {
              lte: new Date(),
            },
            periodEnd: {
              gte: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get the user's plan
    const planId = user.subscriptionStatus || "FREE";
    const plan = PLANS[planId as keyof typeof PLANS];
    const currentUsage = user.Usage[0]?.quotesAnalyzed || 0;

    // Check if user has exceeded their quota
    if (plan.quotas.maxQuotes !== -1 && currentUsage >= plan.quotas.maxQuotes) {
      return new NextResponse(
        JSON.stringify({
          error: "Quote limit exceeded",
          message: "Please upgrade your plan to analyze more quotes",
          code: "QUOTA_EXCEEDED",
          currentUsage,
          maxQuotes: plan.quotas.maxQuotes,
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get or create current period usage record
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    let usage = user.Usage[0];

    if (!usage) {
      usage = await prisma.usage.create({
        data: {
          id: `${session.user.id}-${startOfMonth.getTime()}`,
          userId: session.user.id,
          periodStart: startOfMonth,
          periodEnd: endOfMonth,
          quotesAnalyzed: 0,
          updatedAt: new Date(),
        },
      });
    }

    // Increment usage count
    await prisma.usage.update({
      where: { id: usage.id },
      data: {
        quotesAnalyzed: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return NextResponse.next();
  } catch (error) {
    console.error("Error checking usage:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export const config = {
  matcher: "/api/analyze/:path*",
};
