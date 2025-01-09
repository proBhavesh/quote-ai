import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function QuoteNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Quote Not Found</h1>
        <p className="text-muted-foreground">
          The quote you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have permission to view it.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/quotes">
          <Button variant="outline">View All Quotes</Button>
        </Link>
        <Link href="/quotes/new">
          <Button>Upload New Quote</Button>
        </Link>
      </div>
    </div>
  );
}
