"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Category, Tag, User } from "@prisma/client";

interface BlogPostSidebarProps {
  author: Pick<User, "name" | "image" | "bio" | "socialLinks">;
  categories: Category[];
  tags: Tag[];
}

export function BlogPostSidebar({
  author,
  categories,
  tags,
}: BlogPostSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Author</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={author.image || undefined} alt={author.name || ""} />
              <AvatarFallback>{author.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{author.name}</p>
              {author.bio && (
                <p className="text-sm text-muted-foreground">{author.bio}</p>
              )}
            </div>
          </div>
          {author.socialLinks && (
            <div className="flex gap-2">
              {Object.entries(author.socialLinks as Record<string, string>).map(
                ([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {platform}
                  </a>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {categories.length > 0 && (
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
                  <Badge variant="secondary">{category.name}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="hover:underline"
                >
                  <Badge variant="outline">{tag.name}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 