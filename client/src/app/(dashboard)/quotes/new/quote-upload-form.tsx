"use client";

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
import { useFormStatus } from "react-dom";
import { MAX_FILE_SIZE } from "@/lib/constants";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
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
  );
}

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Details</CardTitle>
        <CardDescription>
          Please provide a title and upload your quote document (max 10MB)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData: FormData) => {
            try {
              const result = await uploadQuote(userId, formData);
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
            }
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
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
