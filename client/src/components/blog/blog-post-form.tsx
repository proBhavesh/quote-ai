"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  content: string;
  image?: string | null;
  published: boolean;
  featured: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  readingTime?: number | null;
  categories?: Category[];
}

interface Category {
  id: string;
  name: string;
}

interface BlogPostFormProps {
  post?: BlogPost;
  categories: Category[];
}

export function BlogPostForm({ post, categories }: BlogPostFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    description: post?.description || "",
    content: post?.content || "",
    image: post?.image || "",
    published: post?.published || false,
    featured: post?.featured || false,
    categoryIds: post?.categories?.map(cat => cat.id) || [],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/blog-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const { url } = await response.json();
      setFormData((prev) => ({ ...prev, image: url }));
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        post ? `/api/blog/${post.id}` : "/api/blog",
        {
          method: post ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            categories: formData.categoryIds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const savedPost = await response.json();
      toast({
        title: "Success",
        description: `Post ${post ? "updated" : "created"} successfully`,
      });
      router.push(`/blog/${savedPost.slug}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: "published" | "featured") => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => {
      const categoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      return { ...prev, categoryIds };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={formData.categoryIds.includes(category.id) ? "default" : "outline"}
                onClick={() => handleCategoryToggle(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Featured Image</Label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
            <Input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            {formData.image && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {formData.image && (
            <div className="relative aspect-video mt-2 overflow-hidden rounded-lg border">
              <Image
                src={formData.image}
                alt="Blog post image"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="content">Content (Markdown)</Label>
          <Textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            className="min-h-[400px]"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={() => handleToggle("published")}
            />
            <Label htmlFor="published">Published</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={() => handleToggle("featured")}
            />
            <Label htmlFor="featured">Featured</Label>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? post
            ? "Updating..."
            : "Creating..."
          : post
          ? "Update Post"
          : "Create Post"}
      </Button>
    </form>
  );
} 