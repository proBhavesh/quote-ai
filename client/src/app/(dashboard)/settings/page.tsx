import { auth } from "@/auth";
import { checkSubscription } from "@/lib/stripe";
import { SubscriptionInfo } from "./subscription-info";
import { UsageStats } from "./usage-stats";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();
  // Auth is handled by middleware
  const userId = session!.user!.id;

  try {
    const subscription = await checkSubscription(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    const subscriptionWithCustomerId = {
      ...subscription,
      stripeCustomerId: user?.stripeCustomerId ?? null,
    };

    return (
      <div className="container max-w-4xl py-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and subscription
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Subscription</h2>
              <p className="text-sm text-muted-foreground">
                Manage your subscription and billing
              </p>
              <Separator className="my-4" />
              <SubscriptionInfo subscription={subscriptionWithCustomerId} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">Usage</h2>
              <p className="text-sm text-muted-foreground">
                Monitor your quote analysis usage
              </p>
              <Separator className="my-4" />
              <UsageStats />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("[SETTINGS_PAGE]", error);
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Error Loading Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            There was an error loading your settings. Please try again later or
            contact support if the problem persists.
          </p>
        </CardContent>
      </Card>
    );
  }
}
