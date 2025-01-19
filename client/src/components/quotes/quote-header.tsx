import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuoteStatus } from "@/components/quote-status";

interface QuoteHeaderProps {
  title: string;
  createdAt: Date;
  status: string;
  quoteId: string;
  fileUrl: string;
}

export function QuoteHeader({
  title,
  createdAt,
  status,
  quoteId,
  fileUrl,
}: QuoteHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">
          Uploaded on {createdAt.toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <QuoteStatus quoteId={quoteId} initialStatus={status} />
        <Link href={fileUrl} target="_blank">
          <Button variant="outline">View Original PDF</Button>
        </Link>
      </div>
    </div>
  );
}
