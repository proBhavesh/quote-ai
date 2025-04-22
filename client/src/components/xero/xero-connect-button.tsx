"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

interface XeroConnectButtonProps {
  onConnect: () => Promise<void>;
  variant?: "default" | "large";
  label: string;
}

export function XeroConnectButton({
  onConnect,
  variant = "default",
  label,
}: XeroConnectButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  // Combined loading state from useTransition and local state
  const loading = isPending || isLoading;

  const handleClick = () => {
    setIsLoading(true);

    startTransition(async () => {
      try {
        await onConnect();
      } catch (error) {
        console.error("Error connecting to Xero:", error);
        // We'll reset loading state in case of error
        setIsLoading(false);
      }
    });
  };

  return (
    <Button
      onClick={handleClick}
      className="w-full"
      size={variant === "large" ? "lg" : "default"}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        label
      )}
    </Button>
  );
}
