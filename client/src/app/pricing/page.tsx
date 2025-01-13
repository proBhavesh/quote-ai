import { auth } from "@/auth";
import { PricingCards } from "./pricing-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const from = resolvedSearchParams?.from as string | undefined;
  const isFromRegister = from === "register";
  const session = await auth();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        {isFromRegister && (
          <Alert>
            <AlertDescription>
              You can start with our free plan and upgrade anytime.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white py-6 px-4 shadow-sm sm:rounded-lg sm:px-6">
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
