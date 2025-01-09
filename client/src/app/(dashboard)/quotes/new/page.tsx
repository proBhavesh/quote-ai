import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import QuoteUploadForm from "./quote-upload-form";
import { MAX_FILE_SIZE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Upload Quote - Quote AI",
  description: "Upload a new quote for analysis",
};

async function uploadQuote(userId: string, formData: FormData) {
  "use server";

  try {
    const title = formData.get("title");
    const file = formData.get("file") as File;

    if (!file || !title) {
      throw new Error("Please provide both a title and a file");
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      throw new Error("Please provide a valid title");
    }

    if (!(file instanceof File)) {
      throw new Error("Invalid file upload");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size must be less than 10MB");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Please upload a PDF file");
    }

    // Convert File to ArrayBuffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Generate a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("quotes")
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);

      // Handle specific error cases
      if (uploadError.message.includes("row-level security policy")) {
        throw new Error(
          "Storage permission error. Please contact support to enable file uploads."
        );
      } else if (uploadError.message.includes("Unauthorized")) {
        throw new Error(
          "You don't have permission to upload files. Please check your authentication."
        );
      } else if (uploadError.message.includes("Payload Too Large")) {
        throw new Error("File is too large. Maximum size is 10MB.");
      }

      throw new Error("Failed to upload file. Please try again later.");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("quotes")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    // Create quote record in database
    await prisma.quote.create({
      data: {
        title: title.trim(),
        fileUrl: publicUrlData.publicUrl,
        userId,
        status: "PENDING",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Quote upload error:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

export default async function NewQuotePage() {
  const session = await auth();
  const userId = await session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload New Quote</h2>
        <p className="text-muted-foreground">
          Upload a PDF file containing the quote you want to analyze
        </p>
      </div>

      <QuoteUploadForm userId={userId} uploadQuote={uploadQuote} />
    </div>
  );
}
