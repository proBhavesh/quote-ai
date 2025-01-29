import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorCardProps {
  title?: string;
  description?: string;
  errors?: string[];
  showUploadButton?: boolean;
}

export function ErrorCard({
  title = "Error Processing Quote",
  description = "There was an error processing your quote. Please try uploading again.",
  errors,
  showUploadButton = true,
}: ErrorCardProps) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {errors && errors.length > 0 && (
          <div className="mb-4 space-y-2">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                • {error}
              </p>
            ))}
          </div>
        )}
        {showUploadButton && (
          <div className="flex justify-end">
            <Link href="/quotes/new">
              <Button>Upload New Quote</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
