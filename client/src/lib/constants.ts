export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv",
  "text/plain",
];

export const ALLOWED_FILE_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".docx",
  ".xlsx",
  ".xls",
  ".csv",
  ".txt",
];

export const ACCEPTED_FILE_TYPES_STRING = ALLOWED_FILE_EXTENSIONS.join(",");

export function isAllowedQuoteFile(file: { name: string; type: string }): boolean {
  const extension = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  return (
    ALLOWED_MIME_TYPES.includes(file.type) ||
    ALLOWED_FILE_EXTENSIONS.includes(extension)
  );
}

const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".csv": "text/csv",
  ".txt": "text/plain",
};

export function getMimeTypeForFileName(fileName: string): string {
  const extension = "." + (fileName.split(".").pop()?.toLowerCase() ?? "");
  return EXTENSION_TO_MIME_TYPE[extension] ?? "application/octet-stream";
}
