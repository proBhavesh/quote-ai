"use client";

import { useState, useEffect } from "react";
import { getImportSessionStatus } from "@/app/actions/xero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface XeroImportProgressProps {
  importSessionId: string;
  onComplete: () => void;
}

export function XeroImportProgress({
  importSessionId,
  onComplete,
}: XeroImportProgressProps) {
  const [status, setStatus] = useState<{
    status: string;
    processed: number;
    total: number;
    progress: number;
  }>({
    status: "PROCESSING",
    processed: 0,
    total: 1,
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await getImportSessionStatus(importSessionId);
        setStatus(result);

        if (result.status === "COMPLETED") {
          // Wait a moment to show the completion before redirecting
          setTimeout(onComplete, 2000);
        } else if (result.status === "FAILED") {
          setError("Import failed. Please try again.");
        } else {
          // Keep checking if still processing
          setTimeout(checkStatus, 1000);
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to check import status"
        );
      }
    };

    checkStatus();
  }, [importSessionId, onComplete]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {status.status === "PROCESSING" ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
              Importing Documents...
            </>
          ) : status.status === "COMPLETED" ? (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              Import Complete
            </>
          ) : (
            <>
              <XCircle className="mr-2 h-5 w-5 text-destructive" />
              Import Failed
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={status.progress} className="h-2" />

          <div className="flex justify-between text-sm">
            <span>
              {status.processed} of {status.total} document(s) processed
            </span>
            <span>{status.progress}%</span>
          </div>

          {error && (
            <div className="mt-2 text-sm text-destructive">Error: {error}</div>
          )}

          {status.status === "COMPLETED" && (
            <div className="mt-2 flex justify-center">
              <Button onClick={onComplete}>View Quotes</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
