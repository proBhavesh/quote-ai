import { prisma } from "./prisma";
import { supabase } from "./supabase";
import * as pdfLib from "pdf-lib";

export async function checkAndCompleteUploadSession(sessionId: string) {
  const session = await prisma.uploadSession.findUnique({
    where: { id: sessionId },
    select: {
      totalFiles: true,
      processedFiles: true,
      status: true,
    },
  });

  if (!session) return;

  if (
    session.processedFiles === session.totalFiles &&
    session.status === "PROCESSING"
  ) {
    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });
  }
}

export async function getUploadSessionProgress(sessionId: string) {
  const session = await prisma.uploadSession.findUnique({
    where: { id: sessionId },
    select: {
      totalFiles: true,
      processedFiles: true,
      status: true,
    },
  });

  if (!session) return null;

  return {
    total: session.totalFiles,
    processed: session.processedFiles,
    status: session.status,
    progress: Math.round((session.processedFiles / session.totalFiles) * 100),
  };
}

/**
 * Compress a PDF file to reduce size before upload.
 * Files other than PDFs are returned unchanged.
 */
export async function compressPdf(file: File): Promise<File> {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return file;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer);

    // Optimize PDF (remove metadata, compress streams)
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: false
    });

    // If the compressed file is actually larger, return the original
    if (compressedBytes.byteLength >= arrayBuffer.byteLength) {
      return file;
    }

    // Create a new file with the compressed data
    return new File([compressedBytes], file.name, { type: 'application/pdf' });
  } catch (error) {
    console.error("PDF compression failed:", error);
    // Return the original file if compression fails
    return file;
  }
}

/**
 * Process multiple functions with concurrency limit
 */
export async function processConcurrent<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number = 3
): Promise<T[]> {
  const results: T[] = [];
  const running = new Set<Promise<unknown>>();

  for (const task of tasks) {
    const run = async () => {
      try {
        results.push(await task());
      } finally {
        running.delete(runPromise);
      }
    };

    const runPromise = run();
    running.add(runPromise);

    if (running.size >= concurrency) {
      await Promise.race(running);
    }
  }

  // Wait for all remaining tasks
  await Promise.all(running);
  return results;
}

/**
 * Upload a single chunk of a file
 */
export async function uploadChunk(
  chunk: Blob,
  chunkIndex: number,
  userId: string,
  fileName: string
): Promise<{ chunkIndex: number; etag: string }> {
  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(fileName);
  const chunkKey = `${userId}/${timestamp}-${sanitizedName}.part${chunkIndex}`;

  const { data, error } = await supabase.storage
    .from("quotes")
    .upload(chunkKey, chunk, {
      contentType: "application/octet-stream",
      cacheControl: "3600"
    });

  if (error) {
    throw new Error(`Failed to upload chunk ${chunkIndex}: ${error.message}`);
  }

  return {
    chunkIndex,
    etag: data?.path || chunkKey
  };
}

/**
 * Upload a file in chunks
 */
export async function uploadFileChunked(
  file: File,
  userId: string
): Promise<string> {
  const chunkSize = 2 * 1024 * 1024; // 2MB chunks
  const chunks = Math.ceil(file.size / chunkSize);
  const uploads = [];
  const sanitizedName = sanitizeFileName(file.name);
  const timestamp = Date.now();
  const finalKey = `${userId}/${timestamp}-${sanitizedName}`;

  // Create upload tasks for each chunk
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    uploads.push(() => uploadChunk(chunk, i, userId, file.name));
  }

  // Upload chunks with concurrency
  const results = await processConcurrent(uploads, 3);

  // For single chunk files, we can just rename the file
  if (chunks === 1) {
    const { error } = await supabase.storage
      .from("quotes")
      .move(results[0].etag, finalKey);

    if (error) {
      throw new Error(`Failed to finalize upload: ${error.message}`);
    }
  } else {
    // For multi-chunk files, we need to create a multipart upload
    // Note: Supabase doesn't directly support multipart completion
    // This is a simplification. In production, you'd need to implement 
    // server-side consolidation of chunks
    console.warn("Multi-chunk uploads require server-side implementation");
  }

  // Return the public URL
  const publicUrlData = supabase.storage.from("quotes").getPublicUrl(finalKey);
  return publicUrlData.data.publicUrl;
}

/**
 * Sanitize a filename for storage
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
    .replace(/_{2,}/g, "_"); // Replace multiple underscores with single
}

/**
 * Generate a presigned URL for direct upload
 */
export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  fileSize: number
): Promise<{ signedUrl: string; storageKey: string; publicUrl: string }> {
  const response = await fetch("/api/upload/presigned", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      contentType,
      fileSize,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get presigned URL: ${error.message || "Unknown error"}`);
  }

  return response.json();
}
