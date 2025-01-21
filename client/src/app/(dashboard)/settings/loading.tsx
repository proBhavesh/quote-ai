import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-8">
        <div>
          <Skeleton className="h-10 w-[150px] mb-2" />
          <Skeleton className="h-5 w-[300px]" />
        </div>

        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-[150px]" />
            <Skeleton className="h-4 w-[250px] mt-1" />
            <Separator className="my-4" />

            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-[100px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-10 w-[120px]" />
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-4 w-[200px] mt-1" />
            <Separator className="my-4" />

            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-[150px]" />
                    <Skeleton className="h-6 w-[100px]" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-5 w-[120px]" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
