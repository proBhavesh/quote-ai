"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import JSZip from "jszip";
import { Upload, File as FileIcon, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { showUsageLimitToast } from "@/components/ui/usage-limit-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
const MAX_FILES_PER_BATCH = 10;

interface FileWithPath {
  file: File;
  path: string;
}

interface UploadProgress {
  processed: number;
  total: number;
  status: "idle" | "processing" | "complete" | "error";
  error?: string;
}

export default function MultiUploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    processed: 0,
    total: 0,
    status: "idle",
  });

  const processZipFile = async (file: File) => {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const zipFiles: FileWithPath[] = [];

      for (const [path, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && path.toLowerCase().endsWith(".pdf")) {
          const blob = await zipEntry.async("blob");
          const file = new File([blob], zipEntry.name, {
            type: "application/pdf",
          });
          zipFiles.push({ file, path });
        }
      }

      return zipFiles;
    } catch (error) {
      console.error("Error processing ZIP:", error);
      throw new Error("Invalid ZIP file");
    }
  };

  const handleFiles = useCallback(
    async (inputFiles: FileList | null, isFolder: boolean = false) => {
      if (!inputFiles?.length) return;

      try {
        const newFiles: FileWithPath[] = [];
        let totalSize = 0;

        for (const file of Array.from(inputFiles)) {
          console.log("Processing file:", file.name, "Type:", file.type); // Debug log

          if (file.size > MAX_FILE_SIZE) {
            toast({
              title: "Error",
              description: `File ${file.name} exceeds maximum size of 10MB`,
              variant: "destructive",
            });
            continue;
          }

          // Updated ZIP type checking
          if (
            file.type === "application/zip" ||
            file.type === "application/x-zip-compressed" ||
            file.type === "application/zip-compressed" ||
            file.name.toLowerCase().endsWith(".zip")
          ) {
            console.log("Processing ZIP file:", file.name); // Debug log
            try {
              const zipFiles = await processZipFile(file);
              console.log("Extracted files from ZIP:", zipFiles.length); // Debug log
              newFiles.push(...zipFiles);
            } catch (error) {
              console.error("ZIP processing error:", error);
              toast({
                title: "Error",
                description: `Failed to process ZIP file ${file.name}`,
                variant: "destructive",
              });
            }
          } else if (file.type === "application/pdf") {
            const path = isFolder
              ? file.webkitRelativePath || file.name
              : file.name;
            newFiles.push({ file, path });
          }

          totalSize += file.size;
        }

        if (totalSize > MAX_TOTAL_SIZE) {
          toast({
            title: "Error",
            description: "Total file size exceeds 50MB limit",
            variant: "destructive",
          });
          return;
        }

        if (newFiles.length > MAX_FILES_PER_BATCH) {
          toast({
            title: "Error",
            description: `Maximum ${MAX_FILES_PER_BATCH} files allowed per batch`,
            variant: "destructive",
          });
          return;
        }

        setFiles((prev) => [...prev, ...newFiles]);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Upload failed",
          variant: "destructive",
        });
      }
    },
    []
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      await handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleUpload = async () => {
    if (!files.length) return;

    setProgress({ processed: 0, total: files.length, status: "processing" });

    try {
      // Create upload session
      const sessionResponse = await fetch("/api/upload/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "MULTIPLE",
          totalFiles: files.length,
        }),
      });

      const responseData = await sessionResponse.json();

      if (!sessionResponse.ok) {
        // Handle specific error cases
        if (responseData.code === "USAGE_LIMIT_EXCEEDED") {
          showUsageLimitToast({ message: responseData.error });
          return;
        }
        throw new Error("Failed to create upload session");
      }

      const { sessionId } = responseData;

      // Upload files in parallel with rate limiting
      const batchSize = 3;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async ({ file, path }) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("path", path);
            formData.append("sessionId", sessionId);

            const response = await fetch("/api/upload/quote", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) throw new Error(`Failed to upload ${file.name}`);

            setProgress((prev) => ({
              ...prev,
              processed: prev.processed + 1,
            }));
          })
        );
      }

      setProgress((prev) => ({ ...prev, status: "complete" }));
      toast({
        title: "Success",
        description: "All files uploaded successfully",
      });

      // Redirect to quotes page after short delay
      setTimeout(() => router.push("/quotes"), 1500);
    } catch (error) {
      setProgress((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      }));

      // Show error toast with the specific message
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });

      // Reset progress after a short delay
      setTimeout(() => {
        setProgress((prev) => ({ ...prev, status: "idle" }));
      }, 3000);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Quotes</CardTitle>
        <CardDescription>
          Upload PDFs, ZIP files containing PDFs, or select a folder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-12 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
            "hover:border-primary hover:bg-primary/5"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">
                Drag & drop files here or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Support for PDF files and ZIP archives
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true;
                  input.accept =
                    ".pdf,.zip,application/zip,application/x-zip-compressed,application/zip-compressed";
                  input.onchange = (e) =>
                    handleFiles((e.target as HTMLInputElement).files);
                  input.click();
                }}
              >
                <FileIcon className="mr-2 h-4 w-4" />
                Select Files
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true;
                  input.webkitdirectory = true;
                  input.onchange = (e) =>
                    handleFiles((e.target as HTMLInputElement).files, true);
                  input.click();
                }}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Select Folder
              </Button>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Selected Files ({files.length})
              </span>
              <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                Clear All
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-md border border-border">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border p-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[300px]">
                      {file.path}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.status !== "idle" && (
          <div className="space-y-2">
            <Progress
              value={(progress.processed / progress.total) * 100}
              className="h-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {progress.processed} of {progress.total} files processed
              </span>
              <span>
                {Math.round((progress.processed / progress.total) * 100)}%
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!files.length || progress.status === "processing"}
            className="min-w-[120px]"
          >
            {progress.status === "processing" ? (
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
              "Upload Files"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
