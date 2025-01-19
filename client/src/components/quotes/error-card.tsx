import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ErrorCard() {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">
          Error Processing Quote
        </CardTitle>
        <CardDescription>
          There was an error processing your quote. Please try uploading again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end">
          <Link href="/quotes/new">
            <Button>Upload New Quote</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
