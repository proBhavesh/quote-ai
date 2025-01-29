"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function QuoteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Something went wrong</CardTitle>
        </div>
        <CardDescription>
          There was an error loading the quote details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Error: {error.message}</p>
          {error.digest && (
            <p className="mt-2">
              Error ID: <code className="text-xs">{error.digest}</code>
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => reset()}>Try again</Button>
      </CardFooter>
    </Card>
  );
}
