import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserUsage } from "@/lib/usage";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        }),
        { status: 401 }
      );
    }

    const usage = await getUserUsage(session.user.id);

    return NextResponse.json(usage);
  } catch (error) {
    console.error("[USAGE_GET]", error);
    return new NextResponse(
      JSON.stringify({
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      }),
      { status: 500 }
    );
  }
}
