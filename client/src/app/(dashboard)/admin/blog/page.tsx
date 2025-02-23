import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostsTable } from "@/components/blog/blog-posts-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog Admin - QuoteAI",
  description: "Manage blog posts",
};

async function getBlogPosts() {
  const posts = await prisma.blogPost.findMany({
    include: {
      author: {
        select: {
          name: true,
        },
      },
      categories: true,
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return posts;
}

export default async function BlogAdminPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const posts = await getBlogPosts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Blog Posts</h1>
          <p className="text-lg text-muted-foreground">
            Manage your blog posts
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">Create New Post</Link>
        </Button>
      </div>

      <BlogPostsTable posts={posts} />
    </div>
  );
} 