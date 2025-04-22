"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Category, BlogPost } from "@prisma/client";

interface BlogSidebarProps {
  categories: (Category & {
    _count: {
      posts: number;
    };
  })[];
  popularPosts: Pick<BlogPost, "title" | "slug" | "createdAt">[];
}

export function BlogSidebar({ categories, popularPosts }: BlogSidebarProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog?category=${category.slug}`}
                className="hover:underline"
              >
                <Badge
                  variant={
                    currentCategory === category.slug ? "default" : "secondary"
                  }
                  className="cursor-pointer"
                >
                  {category.name} ({category._count.posts})
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Popular Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block hover:underline"
              >
                <h3 className="line-clamp-2 font-medium">{post.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
