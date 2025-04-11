import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { UsageError } from "@/lib/types/usage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Set runtime configuration for Vercel
export const maxDuration = 60; // Set timeout to 60 seconds

function sanitizeFileName(fileName: string): string {
  // Remove special characters and replace spaces with underscores
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
    .replace(/_{2,}/g, "_"); // Replace multiple underscores with single
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    // Auth is handled by middleware
    const userId = session!.user!.id;

    // Check usage limits before processing
    try {
      await checkUsageLimit(userId);
    } catch (error) {
      // Check if it's a usage limit error
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "USAGE_LIMIT_EXCEEDED"
      ) {
        const usageError = error as UsageError;
        return new NextResponse(
          JSON.stringify({
            error: usageError.message,
            code: usageError.code,
            usage: usageError.usage,
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw error; // Re-throw unexpected errors
    }

    const formData = await request.formData();

    // Check if this is a direct upload (fileUrl provided) or file upload
    const fileUrl = formData.get("fileUrl") as string;
    const title = formData.get("title") as string;
    const sessionId = formData.get("sessionId") as string;
    const path = formData.get("path") as string;

    if (!title) {
      return new NextResponse(
        JSON.stringify({
          error: "Title is required",
          code: "TITLE_REQUIRED",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle direct upload case (when fileUrl is provided)
    if (fileUrl) {
      // Create quote record
      const quote = await prisma.quote.create({
        data: {
          userId: userId,
          title,
          fileUrl,
          status: "PENDING",
        },
      });

      // Create file structure record if sessionId is provided
      if (sessionId) {
        await prisma.fileStructure.create({
          data: {
            sessionId,
            originalPath: path || title,
            fileName: title,
            quoteId: quote.id,
            parentFolder: path ? path.split("/").slice(0, -1).join("/") || null : null,
          },
        });

        // Update session progress
        await prisma.uploadSession.update({
          where: { id: sessionId },
          data: {
            processedFiles: {
              increment: 1,
            },
          },
        });
      }

      // Increment usage count
      await incrementUsage();

      return NextResponse.json({
        success: true,
        quoteId: quote.id,
      });
    }

    // Handle traditional file upload
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse(
        JSON.stringify({
          error: "File is required",
          code: "FILE_REQUIRED",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse(
        JSON.stringify({
          error: "File size exceeds the maximum limit of 10MB",
          code: "FILE_TOO_LARGE",
          maxSize: MAX_FILE_SIZE,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!file.type.includes("pdf")) {
      return new NextResponse(
        JSON.stringify({
          error: "Only PDF files are supported",
          code: "INVALID_FILE_TYPE",
          supportedTypes: ["application/pdf"],
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Sanitize the file name
    const sanitizedFileName = sanitizeFileName(file.name);
    const timestamp = Date.now();
    const storageKey = `${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("quotes")
      .upload(storageKey, file);

    if (uploadError) {
      console.error("[UPLOAD_ERROR]", uploadError);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to upload file",
          code: "UPLOAD_FAILED",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("quotes").getPublicUrl(storageKey);

    // Create quote record and FileStructure in a transaction (after storage upload)
    const { quoteId } = await prisma.$transaction(async (tx) => {
      // Create quote record
      const quote = await tx.quote.create({
        data: {
          userId: userId,
          title: title || path?.split("/").pop() || sanitizedFileName,
          fileUrl: publicUrl,
          status: "PENDING",
        },
      });

      // Create file structure record if sessionId is provided
      if (sessionId) {
        await tx.fileStructure.create({
          data: {
            sessionId,
            originalPath: path || file.name,
            fileName: file.name,
            quoteId: quote.id,
            parentFolder: path ? path.split("/").slice(0, -1).join("/") || null : null,
          },
        });

        // Update session progress
        await tx.uploadSession.update({
          where: { id: sessionId },
          data: {
            processedFiles: {
              increment: 1,
            },
          },
        });
      }

      return { quoteId: quote.id };
    });

    // Increment usage count
    await incrementUsage();

    // Get updated usage info
    const updatedUsage = await checkUsageLimit(userId).catch(
      (error) => {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "USAGE_LIMIT_EXCEEDED"
        ) {
          return (error as UsageError).usage;
        }
        throw error;
      }
    );

    return NextResponse.json({
      success: true,
      quoteId,
      usage: updatedUsage,
    });
  } catch (error) {
    console.error("[QUOTE_UPLOAD_POST]", error);
    return new NextResponse(
      JSON.stringify({
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
