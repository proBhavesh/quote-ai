import { Metadata } from "next";
import { auth } from "@/auth";
import { XeroDocumentBrowser } from "@/components/xero";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import XeroDocumentsLoading from "./loading";

export const metadata: Metadata = {
  title: "Import Documents from Xero - Quote AI",
  description: "Select documents from Xero to import for analysis",
};

// Define interface for params
interface XeroDocumentParams {
  connectionId: string;
}

export default async function XeroDocumentsPage({
  params,
}: {
  params: Promise<XeroDocumentParams>;
}) {
  return (
    <Suspense fallback={<XeroDocumentsLoading />}>
      <XeroDocumentsContent params={params} />
    </Suspense>
  );
}

async function XeroDocumentsContent({
  params,
}: {
  params: Promise<XeroDocumentParams>;
}) {
  const session = await auth();

  // Await params before accessing properties
  const { connectionId } = await params;

  // Verify connection belongs to user
  const connection = await prisma.xeroConnection.findFirst({
    where: {
      id: connectionId,
      userId: session?.user?.id,
    },
    select: {
      id: true,
      tenantName: true,
    },
  });

  if (!connection) {
    redirect("/integrations");
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4 inline-flex items-center"
        >
          <Link href="/integrations">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Integrations
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">Import from Xero</h1>
        <p className="text-muted-foreground mt-2">
          Select documents from your Xero account to import for analysis
        </p>
      </div>

      <XeroDocumentBrowser
        connectionId={connection.id}
        tenantName={connection.tenantName}
      />
    </div>
  );
}
