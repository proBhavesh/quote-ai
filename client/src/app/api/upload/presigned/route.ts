import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { checkUsageLimit } from "@/lib/usage";
import { UsageError } from "@/lib/types/usage";

// Sanitize file name
function sanitizeFileName(fileName: string): string {
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

        const { fileName, contentType } = await request.json();

        if (!fileName || !contentType) {
            return new NextResponse(
                JSON.stringify({
                    error: "Missing required fields",
                    code: "INVALID_REQUEST",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const timestamp = Date.now();
        const sanitizedName = sanitizeFileName(fileName);
        const storageKey = `${userId}/${timestamp}-${sanitizedName}`;

        // Generate signed URL for direct upload
        const { data, error } = await supabase.storage
            .from("quotes")
            .createSignedUploadUrl(storageKey);

        if (error) {
            console.error("[PRESIGNED_URL_ERROR]", error);
            return new NextResponse(
                JSON.stringify({
                    error: "Failed to generate upload URL",
                    code: "PRESIGNED_URL_FAILED",
                    details: error.message,
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Get public URL for the file
        const {
            data: { publicUrl },
        } = supabase.storage.from("quotes").getPublicUrl(storageKey);

        return NextResponse.json({
            signedUrl: data.signedUrl,
            storageKey,
            publicUrl,
        });
    } catch (error) {
        console.error("[PRESIGNED_URL_POST]", error);
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

export const maxDuration = 60; // Set timeout to 60 seconds

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
} 