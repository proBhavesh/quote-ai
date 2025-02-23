import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for images

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse(
        JSON.stringify({
          error: "File is required",
          code: "FILE_REQUIRED",
        }),
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse(
        JSON.stringify({
          error: "File size exceeds the maximum limit of 5MB",
          code: "FILE_TOO_LARGE",
          maxSize: MAX_FILE_SIZE,
        }),
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid file type. Only JPEG, PNG and WebP images are supported",
          code: "INVALID_FILE_TYPE",
          supportedTypes: allowedTypes,
        }),
        { status: 400 }
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file);

    if (uploadError) {
      console.error("[BLOG_IMAGE_UPLOAD_ERROR]", uploadError);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to upload image",
          code: "UPLOAD_FAILED",
        }),
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("blog-images").getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("[BLOG_IMAGE_UPLOAD]", error);
    return new NextResponse(
      JSON.stringify({
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      }),
      { status: 500 }
    );
  }
} 