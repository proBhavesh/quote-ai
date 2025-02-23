import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { BlogPost, Category, Tag, User } from "@prisma/client";

interface BlogPostCardProps {
  post: BlogPost & {
    author: Pick<User, "name" | "image">;
    categories: Category[];
    tags: Tag[];
  };
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Card className="group overflow-hidden">
      <Link href={`/blog/${post.slug}`} prefetch={true}>
        <CardHeader className="p-0">
          {post.image && (
            <div className="relative h-[240px] w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-contain bg-muted"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
        </CardHeader>
      </Link>

      <CardContent className="grid gap-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
            <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium">{post.author.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        <div>
          <Link href={`/blog/${post.slug}`} prefetch={true} className="group-hover:underline">
            <h3 className="font-heading text-xl font-bold">{post.title}</h3>
          </Link>
          {post.description && (
            <p className="mt-2 line-clamp-2 text-muted-foreground">
              {post.description}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <div className="flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog?category=${category.slug}`}
              prefetch={true}
              className="hover:underline"
            >
              <Badge variant="secondary">{category.name}</Badge>
            </Link>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
} 