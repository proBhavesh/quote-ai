import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostForm } from "@/components/blog/blog-post-form";

export const metadata: Metadata = {
  title: "Edit Blog Post - QuoteAI",
  description: "Edit blog post",
};

interface EditBlogPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getBlogPost(id: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  return post;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories;
}

export default async function EditBlogPostPage({
  params,
}: EditBlogPostPageProps) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;
  const [post, categories] = await Promise.all([
    getBlogPost(id),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <BlogPostForm post={post} categories={categories} />
    </div>
  );
} 