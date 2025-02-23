import { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { BlogHeader } from "@/components/blog/blog-header";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { BlogPagination } from "@/components/blog/blog-pagination";
import BlogLoading from "./loading";

export const metadata: Metadata = {
  title: "Blog - QuoteAI",
  description: "Latest insights, guides, and updates about quote analysis and procurement",
};

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  }>;
}

async function getBlogPosts(params: Awaited<BlogPageProps["searchParams"]>) {
  const page = Number(params.page) || 1;
  const limit = 9;
  const skip = (page - 1) * limit;

  const where: Prisma.BlogPostWhereInput = {
    published: true,
    ...(params.category && {
      categories: {
        some: {
          slug: params.category,
        },
      },
    }),
    ...(params.tag && {
      tags: {
        some: {
          slug: params.tag,
        },
      },
    }),
    ...(params.search && {
      OR: [
        {
          title: {
            contains: params.search,
            mode: Prisma.QueryMode.INSENSITIVE,
          },
        },
        {
          description: {
            contains: params.search,
            mode: Prisma.QueryMode.INSENSITIVE,
          },
        },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        categories: true,
        tags: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts,
    total,
    pages: Math.ceil(total / limit),
  };
}

async function getSidebarData() {
  const [categories, popularPosts] = await Promise.all([
    prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { views: "desc" },
      take: 5,
      select: {
        title: true,
        slug: true,
        createdAt: true,
      },
    }),
  ]);

  return { categories, popularPosts };
}

async function BlogContent({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const [{ posts, pages }, { categories, popularPosts }] = await Promise.all([
    getBlogPosts(params),
    getSidebarData(),
  ]);
  const currentPage = Number(params.page) || 1;

  return (
    <>
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
        
        {pages > 1 && (
          <div className="mt-8">
            <BlogPagination
              currentPage={currentPage}
              totalPages={pages}
              baseUrl="/blog"
            />
          </div>
        )}
      </div>
      
      <div className="mt-8 lg:mt-0">
        <BlogSidebar categories={categories} popularPosts={popularPosts} />
      </div>
    </>
  );
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <BlogHeader />
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <Suspense fallback={<BlogLoading />}>
          <BlogContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
} 