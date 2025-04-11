import { Metadata } from "next";
import { auth } from "@/auth";
import MultiUploadForm from "./multi-upload-form";

export const metadata: Metadata = {
  title: "Upload Quote - Quote AI",
  description: "Upload a new quote for analysis",
};

export default async function NewQuotePage() {
  // Auth is handled by middleware, just calling auth() to ensure session is loaded
  await auth();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <MultiUploadForm />
    </div>
  );
}
