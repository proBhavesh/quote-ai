import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function PricingLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        <div className="bg-white py-6 px-4 shadow-sm sm:rounded-lg sm:px-6">
          <div className="w-full">
            <div className="mb-8 text-center">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="relative rounded-lg p-6">
                  {i === 1 && (
                    <Skeleton className="absolute -top-3 left-0 right-0 mx-auto w-32 h-7" />
                  )}
                  <div className="flex flex-col h-full">
                    <div>
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="mt-2 h-4 w-36" />
                      <Skeleton className="mt-4 h-8 w-20" />
                    </div>

                    <div className="mt-6 space-y-2 flex-grow">
                      {Array.from({
                        length: i === 0 ? 4 : i === 1 ? 6 : 8,
                      }).map((_, j) => (
                        <div key={j} className="flex gap-x-2">
                          <Skeleton className="h-5 w-4 flex-none" />
                          <Skeleton className="h-5 flex-grow" />
                        </div>
                      ))}
                    </div>

                    <Skeleton className="mt-6 h-10 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
