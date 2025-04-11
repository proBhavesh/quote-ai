"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { compressPdf, getPresignedUrl } from "@/lib/upload-utils";
import { Progress } from "@/components/ui/progress";

interface QuoteUploadFormProps {
  userId: string;
  uploadQuote: (
    userId: string,
    formData: FormData
  ) => Promise<{ success?: boolean }>;
}

export default function QuoteUploadForm({
  userId,
  uploadQuote,
}: QuoteUploadFormProps) {
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleOptimizedUpload = async (formData: FormData) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const title = formData.get("title") as string;
      const file = formData.get("file") as File;

      if (!file || !title) {
        throw new Error("Missing required fields");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds the maximum limit of 10MB");
      }

      // Step 1: Compress the PDF file
      setUploadProgress(10);
      const compressedFile = await compressPdf(file);
      setUploadProgress(25);

      // Step 2: Get a presigned URL for direct upload
      const { signedUrl, publicUrl } = await getPresignedUrl(
        file.name,
        file.type,
        compressedFile.size
      );
      setUploadProgress(40);

      // Step 3: Upload the file directly to storage
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: compressedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }
      setUploadProgress(75);

      // Step 4: Create a new quote record in the database
      const quoteFormData = new FormData();
      quoteFormData.append("title", title);
      quoteFormData.append("fileUrl", publicUrl);

      const result = await uploadQuote(userId, quoteFormData);
      setUploadProgress(100);

      if (result.success) {
        toast({
          title: "Success",
          description: "Quote uploaded successfully. Redirecting...",
        });
        // Short delay to show the success message before redirecting
        setTimeout(() => {
          router.push("/quotes");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Details</CardTitle>
        <CardDescription>
          Please provide a title and upload your quote document (max 10MB)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUploading ? (
          <div className="space-y-4">
            <p className="text-sm text-center">
              Uploading and optimizing your quote...
            </p>
            <Progress value={uploadProgress} />
            <p className="text-xs text-muted-foreground text-center">
              {uploadProgress < 25
                ? "Compressing file..."
                : uploadProgress < 50
                ? "Preparing upload..."
                : uploadProgress < 75
                ? "Uploading to server..."
                : "Processing quote..."}
            </p>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handleOptimizedUpload(formData);
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter a descriptive title"
                required
                minLength={1}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept="application/pdf"
                required
                max={MAX_FILE_SIZE}
              />
              <p className="text-sm text-muted-foreground">
                Only PDF files up to 10MB are supported
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isUploading}>
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
                  "Upload and Analyze"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
