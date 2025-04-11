import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkUsageLimit } from "@/lib/usage";
import { UsageError } from "@/lib/types/usage";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session!.user!.id;

    const body = await request.json();
    const { type, totalFiles } = body;

    // Check if total files would exceed the quota
    try {
      const usage = await checkUsageLimit(userId);
      if (usage.remainingQuotes < totalFiles) {
        return new NextResponse(
          JSON.stringify({
            error: `Cannot upload ${totalFiles} files. You only have ${usage.remainingQuotes
              } quote${usage.remainingQuotes === 1 ? "" : "s"
              } remaining in your ${usage.planName} plan.`,
            code: "USAGE_LIMIT_EXCEEDED",
            usage,
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "USAGE_LIMIT_EXCEEDED"
      ) {
        const usageError = error as UsageError;
        return new NextResponse(
          JSON.stringify({
            error: usageError.message,
            code: usageError.code,
            usage: usageError.usage,
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw error;
    }

    const uploadSession = await prisma.uploadSession.create({
      data: {
        userId: userId,
        type,
        totalFiles,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({ sessionId: uploadSession.id });
  } catch (error) {
    console.error("[UPLOAD_SESSION_POST]", error);
    return new NextResponse(
      JSON.stringify({
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
