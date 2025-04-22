import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function IntegrationsLoading() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Skeleton className="h-8 w-8 mr-2 rounded-full" />
              <Skeleton className="h-6 w-24" />
            </div>
            <CardDescription>
              <Skeleton className="h-4 w-full max-w-md" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Connection items skeletons */}
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border rounded-md p-4"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}

              <Skeleton className="h-10 w-full mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
