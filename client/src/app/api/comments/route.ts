import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1),
  postId: z.string(),
  parentId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Auth is handled by middleware
    const userId = session!.user!.id;

    const body = await req.json();
    const { content, postId, parentId } = commentSchema.parse(body);

    // Check if the blog post exists and is published
    const post = await prisma.blogPost.findUnique({
      where: { id: postId, published: true },
    });

    if (!post) {
      return new NextResponse("Blog post not found", { status: 404 });
    }

    // If it's a reply, check if the parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return new NextResponse("Parent comment not found", { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentId,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }

    console.error("[COMMENTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 