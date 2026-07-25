import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";

// List of public routes that don't require authentication
const publicRoutes = ["/", "/pricing"];

// List of authentication routes
const authRoutes = ["/login", "/register", "/auth"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow Stripe webhook requests to pass through
  if (path === "/api/stripe/webhooks") {
    return NextResponse.next();
  }

  const session = await auth();

  // Check usage limits for quote analysis endpoints
  if (path.startsWith("/api/analyze")) {
    try {
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
      if (
        plan.quotas.maxQuotes !== -1 &&
        currentUsage >= plan.quotas.maxQuotes
      ) {
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

  // If it's a public route, allow access
  if (publicRoutes.some((route) => path === route)) {
    return NextResponse.next();
  }

  // Suppliers respond to RFQs via a token link, without an account
  if (path.startsWith("/rfq/respond/")) {
    return NextResponse.next();
  }

  // If it's an auth route and user is logged in, redirect to dashboard
  if (authRoutes.some((route) => path.startsWith(route)) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not logged in and trying to access protected route, redirect to login
  if (!session && !authRoutes.some((route) => path.startsWith(route))) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
