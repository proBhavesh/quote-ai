import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserUsage } from "@/lib/usage";

export async function GET() {
  try {
    const session = await auth();
    // Auth is handled by middleware
    const userId = session!.user!.id;

    const usage = await getUserUsage(userId);

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
