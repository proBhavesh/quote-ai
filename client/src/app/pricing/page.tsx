import { auth } from "@/auth";
import { PricingCards } from "./pricing-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the searchParams promise
  const resolvedSearchParams = await searchParams;

  // Safely access searchParams
  const from = resolvedSearchParams?.from as string | undefined;
  const isFromRegister = from === "register";

  // Fetch session data
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Choose your plan
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isFromRegister
            ? "Welcome! Please select a plan to get started"
            : "Get started with our flexible pricing options"}
        </p>
      </div>

      {isFromRegister && (
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <Alert>
            <AlertDescription>
              You can start with our free plan and upgrade anytime.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-5xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <PricingCards
            userId={session?.user?.id}
            email={session?.user?.email ?? ""}
            isFromRegistration={isFromRegister}
          />
        </div>
      </div>
    </div>
  );
}
