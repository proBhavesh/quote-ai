import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostForm } from "@/components/blog/blog-post-form";

export const metadata: Metadata = {
  title: "Create Blog Post - QuoteAI",
  description: "Create a new blog post",
};

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

export default async function NewBlogPostPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <BlogPostForm categories={categories} />
    </div>
  );
} 