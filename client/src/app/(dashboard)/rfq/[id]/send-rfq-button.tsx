"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { sendRfqAction } from "@/app/actions/rfq";

export function SendRfqButton({ rfqId }: { rfqId: string }) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await sendRfqAction(rfqId);
      toast({ title: "RFQ sent to suppliers" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send RFQ",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button onClick={handleSend} disabled={isSending}>
      {isSending ? "Sending..." : "Send to suppliers"}
    </Button>
  );
}
