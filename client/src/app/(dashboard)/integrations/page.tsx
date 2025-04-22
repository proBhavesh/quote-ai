import { Metadata } from "next";
import { auth } from "@/auth";
import { getXeroConnections } from "@/app/actions/xero";
import { XeroConnectionsList, XeroConnectForm } from "@/components/xero";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Suspense } from "react";
import IntegrationsLoading from "./loading";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Integrations - Quote AI",
  description: "Connect your accounts to import quotes",
};

// Define interface for searchParams
interface IntegrationSearchParams {
  error?: string;
  success?: string;
  connections?: string;
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<IntegrationSearchParams>;
}) {
  await auth();

  return (
    <Suspense fallback={<IntegrationsLoading />}>
      <IntegrationsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function IntegrationsContent({
  searchParams,
}: {
  searchParams: Promise<IntegrationSearchParams>;
}) {
  // Get Xero connections
  const connections = await getXeroConnections();

  // Await searchParams before accessing its properties
  const params = await searchParams;

  // Get success/error messages from query params
  const error = params.error;
  const success = params.success === "true";
  const connectionCount = params.connections;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your accounts to import quotes and receipts for analysis.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            {connectionCount
              ? `Successfully connected ${connectionCount} organization${
                  parseInt(connectionCount) !== 1 ? "s" : ""
                } from Xero.`
              : "Connection successful!"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <XeroIntegrationCard connections={connections} />
      </div>
    </div>
  );
}

async function XeroIntegrationCard({
  connections,
}: {
  connections: Awaited<ReturnType<typeof getXeroConnections>>;
}) {
  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
        <CardTitle className="flex items-center">
          <div className="mr-3 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg
              width="32"
              height="32"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M70.9389 33.3333H25.2445C20.8889 33.3333 17.8111 37.2222 18.6333 41.4333L56.4667 166.667H94.3L70.9389 33.3333Z"
                fill="#13B5EA"
              />
              <path
                d="M137.722 33.3333H92.0278C87.6722 33.3333 84.5944 37.2222 85.4167 41.4333L123.25 166.667H161.083L137.722 33.3333Z"
                fill="#13B5EA"
              />
              <path
                d="M146.778 33.3333L170.139 166.667H176.111C181.75 166.667 186.5 162.139 186.944 156.5L199.556 41.4333C200 35.7944 195.667 33.3333 190.028 33.3333H146.778Z"
                fill="#13B5EA"
              />
              <path
                d="M13.3889 33.3333H3.94446C1.66668 33.3333 0 35 0 37.2778V42.0556C0 44.3333 1.66668 46 3.94446 46H9.91668L9.47224 33.3333H13.3889Z"
                fill="#13B5EA"
              />
            </svg>
          </div>
          <div>
            Xero
            <Badge variant="outline" className="ml-2 text-blue-500 bg-blue-50">
              Accounting
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-sm mt-2">
          Import quotes and receipts from Xero for AI-powered analysis. Connect
          your Xero account to get started with document processing.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {connections.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Connected accounts ({connections.length})
            </h3>
            <XeroConnectionsList connections={connections} />
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
              <ExternalLink className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-medium mb-1">No connections</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Xero account to import and analyze documents
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter
        className={connections.length > 0 ? "pt-0" : "border-t bg-gray-50"}
      >
        <div className="w-full">
          <XeroConnectForm isNewConnection={connections.length > 0} />
        </div>
      </CardFooter>
    </Card>
  );
}
