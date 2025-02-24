"use client";

import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface UsageLimitToastProps {
  message: string;
}

export function showUsageLimitToast({ message }: UsageLimitToastProps) {
  const { dismiss } = toast({
    title: "Usage Limit Reached",
    description: (
      <div className="mt-2 flex flex-col gap-4">
        <p>{message}</p>
        <Button 
          asChild 
          variant="secondary"
          className="mt-2 w-full text-foreground hover:text-foreground"
          onClick={() => dismiss()}
        >
          <Link href="/pricing" className="flex items-center justify-center">
            View Pricing Plans
          </Link>
        </Button>
      </div>
    ),
    variant: "destructive",
    duration: 10000, // Show for 10 seconds
  });
} 