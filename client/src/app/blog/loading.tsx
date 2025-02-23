import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function BlogLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="mb-8 space-y-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            <Skeleton className="h-9 w-24" />
          </h1>
          <Skeleton className="mt-1 h-6 w-[560px] max-w-full" />
        </div>
        <form className="flex gap-2">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-28" />
        </form>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Blog posts grid skeleton */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="group overflow-hidden">
                <CardHeader className="p-0">
                  {/* Image skeleton */}
                  <div className="relative h-[240px] w-full overflow-hidden">
                    <Skeleton className="absolute inset-0" />
                  </div>
                </CardHeader>

                <CardContent className="grid gap-4 p-6">
                  {/* Author info skeleton */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="grid gap-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>

                  {/* Content skeleton */}
                  <div>
                    <Skeleton className="h-6 w-full" />
                    <div className="mt-2 space-y-2">
                      <Skeleton className="h-4 w-[95%]" />
                      <Skeleton className="h-4 w-[90%]" />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  {/* Categories skeleton */}
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <aside className="mt-8 lg:mt-0">
          <div className="space-y-6">
            {/* Categories card skeleton */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4">
                  <Skeleton className="h-6 w-24" />
                </h2>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular posts card skeleton */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4">
                  <Skeleton className="h-6 w-32" />
                </h2>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="block">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="mt-1 h-4 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </>
  );
} 