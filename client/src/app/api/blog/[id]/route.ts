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
  published: z.boolean(),
  featured: z.boolean(),
  categories: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = postSchema.parse(body);

    // Check if post exists
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Check if new slug is unique (if changed)
    if (data.slug !== post.slug) {
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug: data.slug },
      });

      if (existingPost) {
        return new NextResponse("Slug already exists", { status: 400 });
      }
    }

    // Update post with categories
    const { categories, ...postData } = data;
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...postData,
        categories: categories ? {
          set: [],
          connect: categories.map(catId => ({ id: catId })),
        } : undefined,
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }

    console.error("[BLOG_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Check if post exists
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[BLOG_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 