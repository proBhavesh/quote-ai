import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  image: z.string().url().optional(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  categories: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const data = postSchema.parse(body);

    // Check if slug is unique
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
    });

    if (existingPost) {
      return new NextResponse("Slug already exists", { status: 400 });
    }

    // Create post with categories
    const { categories, ...postData } = data;
    const post = await prisma.blogPost.create({
      data: {
        ...postData,
        authorId: session.user.id,
        categories: categories ? {
          connect: categories.map(id => ({ id })),
        } : undefined,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }

    console.error("[BLOG_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 