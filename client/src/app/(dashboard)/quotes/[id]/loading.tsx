import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function QuoteDetailsLoading() {
  return (
    <div className="space-y-6">
      {/* Quote Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
        <Skeleton className="h-10 w-[100px]" />
      </div>

      {/* Original Quote Data Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Original Quote</CardTitle>
          <CardDescription>
            Details extracted from your uploaded quote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Key information from the quote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>

      {/* Line Items Analysis Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items Analysis</CardTitle>
          <CardDescription>
            Detailed analysis of each item with market comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Summary</CardTitle>
          <CardDescription>
            Overview of costs and potential savings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
