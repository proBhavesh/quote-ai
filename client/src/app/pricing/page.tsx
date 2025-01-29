import { auth } from "@/auth";
import { PricingCards } from "./pricing-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkSubscription } from "@/lib/stripe";
import { Suspense } from "react";
import PricingLoading from "./loading";

async function PricingContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const from = resolvedSearchParams?.from as string | undefined;
  const isFromRegister = from === "register";
  const session = await auth();

  // Get current subscription status
  let currentPlan = "FREE";
  if (session?.user?.id) {
    const subscription = await checkSubscription(session.user.id);
    currentPlan = subscription.plan;
  }

  return (
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
          currentPlan={currentPlan as "FREE" | "PREMIUM" | "ENTERPRISE"}
          isFromRegistration={isFromRegister}
        />
      </div>
    </div>
  );
}

export default function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Suspense fallback={<PricingLoading />}>
        <PricingContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
