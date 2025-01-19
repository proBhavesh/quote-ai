import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "desc";
    const page = Number(searchParams.get("page")) || 1;
    const limit = 10;

    const where = {
      userId: session.user.id,
      ...(status && status !== "all" && { status: status.toUpperCase() }),
    };

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: {
          createdAt: sort as "asc" | "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[QUOTES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
