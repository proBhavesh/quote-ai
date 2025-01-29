import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { type, totalFiles } = body;

    const uploadSession = await prisma.uploadSession.create({
      data: {
        userId: session.user.id,
        type,
        totalFiles,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({ sessionId: uploadSession.id });
  } catch (error) {
    console.error("[UPLOAD_SESSION_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
