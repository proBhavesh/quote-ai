"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageSquare } from "lucide-react";
import type { BlogPost, Category, Tag, User } from "@prisma/client";

interface BlogPostHeaderProps {
  post: BlogPost & {
    author: Pick<User, "name" | "image" | "bio" | "socialLinks">;
    categories: Category[];
    tags: Tag[];
    _count?: {
      comments: number;
    };
  };
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
  return (
    <Card>
      {post.image && (
        <div className="relative h-[400px] w-full overflow-hidden rounded-t-lg bg-muted">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
          />
        </div>
      )}

      <CardContent className="grid gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {post.categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog?category=${category.slug}`}
              className="hover:underline"
            >
              <Badge variant="secondary">{category.name}</Badge>
            </Link>
          ))}
        </div>

        <h1 className="font-heading text-4xl font-bold">{post.title}</h1>

        {post.description && (
          <p className="text-xl text-muted-foreground">{post.description}</p>
        )}

        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
            <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium">{post.author.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(post.createdAt)}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{post.views}</span>
            </div>
            {post._count?.comments !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">{post._count.comments}</span>
              </div>
            )}
          </div>
        </div>

        {post.author.bio && (
          <p className="text-sm text-muted-foreground">{post.author.bio}</p>
        )}

        {post.author.socialLinks && (
          <div className="flex gap-2">
            {Object.entries(post.author.socialLinks as Record<string, string>).map(
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
  );
} 