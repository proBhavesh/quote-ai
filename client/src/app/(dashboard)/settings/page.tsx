import { auth } from "@/auth";
import { checkSubscription } from "@/lib/stripe";
import { SubscriptionInfo } from "./subscription-info";
import { UsageStats } from "./usage-stats";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const subscription = await checkSubscription(session.user.id);

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
            <SubscriptionInfo subscription={subscription} />
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
}
