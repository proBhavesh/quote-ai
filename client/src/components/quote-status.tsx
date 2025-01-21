"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface QuoteStatusProps {
  quoteId: string;
  initialStatus: string;
}

interface QuoteUpdate {
  id: string;
  status: string;
}

export function QuoteStatus({ quoteId, initialStatus }: QuoteStatusProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const channel = supabase
      .channel(`quote-status-${quoteId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Quote",
          filter: `id=eq.${quoteId}`,
        },
        (payload: RealtimePostgresChangesPayload<QuoteUpdate>) => {
          const newQuote = payload.new as QuoteUpdate;
          if (newQuote && newQuote.status) {
            setStatus(newQuote.status);
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Failed to subscribe to quote status updates");
        }
      });

    return () => {
      supabase.removeChannel(channel).catch((error) => {
        console.error("Failed to remove quote status channel:", error);
      });
    };
  }, [quoteId, initialStatus]); // Include initialStatus in dependencies

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-2 w-2 rounded-full ${getStatusColor(status)}`}
      />
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-400";
    case "processing":
      return "bg-blue-400 animate-pulse";
    case "completed":
      return "bg-green-400";
    case "error":
      return "bg-red-400";
    default:
      return "bg-gray-400";
  }
}
