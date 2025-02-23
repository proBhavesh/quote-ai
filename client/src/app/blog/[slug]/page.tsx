import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { BlogPostHeader } from "@/components/blog/blog-post-header";
import { BlogPostContent } from "@/components/blog/blog-post-content";
import { BlogPostComments } from "@/components/blog/blog-post-comments";
import { BlogPostSidebar } from "@/components/blog/blog-post-sidebar";
import BlogPostLoading from "./loading";
import { auth } from "@/auth";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          socialLinks: true,
        },
      },
      categories: true,
      tags: true,
      comments: {
        where: { parentId: null },
        include: {
          author: {
            select: {
              name: true,
              image: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post || (!post.published && post.authorId !== (await auth())?.user?.id)) {
    notFound();
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });

  return post;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  return {
    title: `${post.title} - QuoteAI Blog`,
    description: post.description || undefined,
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      images: post.image ? [{ url: post.image }] : undefined,
    },
  };
}

async function BlogPostMain({ slug }: { slug: string }) {
  const post = await getBlogPost(slug);
  const session = await auth();

  return (
    <>
      <article className="lg:col-span-3">
        <BlogPostHeader post={post} />
        <BlogPostContent content={post.content} />
        <BlogPostComments
          comments={post.comments}
          postId={post.id}
          isAuthenticated={!!session?.user}
        />
      </article>
      
      <aside className="mt-8 lg:mt-0">
        <BlogPostSidebar
          author={post.author}
          categories={post.categories}
          tags={post.tags}
        />
      </aside>
    </>
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <Suspense fallback={<BlogPostLoading />}>
          <BlogPostMain slug={slug} />
        </Suspense>
      </div>
    </div>
  );
} 