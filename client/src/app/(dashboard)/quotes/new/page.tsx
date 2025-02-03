import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MultiUploadForm from "./multi-upload-form";

export const metadata: Metadata = {
  title: "Upload Quote - Quote AI",
  description: "Upload a new quote for analysis",
};

export default async function NewQuotePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <MultiUploadForm />
    </div>
  );
}
