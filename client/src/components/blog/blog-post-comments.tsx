"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Comment, User } from "@prisma/client";

interface CommentWithAuthor extends Comment {
  author: Pick<User, "name" | "image">;
  replies?: CommentWithAuthor[];
}

interface BlogPostCommentsProps {
  comments: CommentWithAuthor[];
  postId: string;
  isAuthenticated: boolean;
}

export function BlogPostComments({
  comments,
  postId,
  isAuthenticated,
}: BlogPostCommentsProps) {
  const router = useRouter();
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          postId,
          parentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to post comment");

      setContent("");
      setReplyToId(null);
      router.refresh();
      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CommentComponent = ({ comment }: { comment: CommentWithAuthor }) => (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.image || undefined} alt={comment.author.name || ""} />
          <AvatarFallback>{comment.author.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{comment.author.name}</p>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{comment.content}</p>
          {isAuthenticated && (
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => setReplyToId(comment.id)}
            >
              Reply
            </Button>
          )}
        </div>
      </div>

      {replyToId === comment.id && (
        <form
          onSubmit={(e) => handleSubmit(e, comment.id)}
          className="ml-12 space-y-4"
        >
          <Textarea
            placeholder="Write a reply..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Reply"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReplyToId(null);
                setContent("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-4">
          {comment.replies.map((reply) => (
            <CommentComponent key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAuthenticated && replyToId === null && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Write a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </form>
        )}

        {!isAuthenticated && (
          <p className="text-center text-sm text-muted-foreground">
            Please{" "}
            <Button variant="link" className="h-auto p-0" asChild>
              <a href="/login">sign in</a>
            </Button>{" "}
            to comment
          </p>
        )}

        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentComponent key={comment.id} comment={comment} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 