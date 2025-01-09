import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { checkUsage } from "./middleware/check-usage";

// List of public routes that don't require authentication
const publicRoutes = ["/", "/pricing", "/api/webhooks"];

// List of authentication routes
const authRoutes = ["/login", "/register", "/auth"];

export async function middleware(request: NextRequest) {
  const session = await auth();
  const path = request.nextUrl.pathname;

  // Check usage limits for quote analysis endpoints
  if (path.startsWith("/api/quotes/analyze")) {
    return checkUsage(request);
  }

  // If it's a public route, allow access
  if (
    publicRoutes.some(
      (route) => path === route || path.startsWith("/api/webhooks")
    )
  ) {
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
