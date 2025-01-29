import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function QuoteNotFound() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Quote Not Found</CardTitle>
        </div>
        <CardDescription>
          We couldn&apos;t find the quote you&apos;re looking for. It may have
          been deleted or doesn&apos;t exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end">
          <Link href="/quotes">
            <Button>View All Quotes</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
