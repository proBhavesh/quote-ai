"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface QuoteStatusProps {
  quoteId: string;
  initialStatus: string;
}

export function QuoteStatus({ quoteId, initialStatus }: QuoteStatusProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const channel = supabase
      .channel(`quote-${quoteId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Quote",
          filter: `id=eq.${quoteId}`,
        },
        (payload) => {
          if (payload.new.status !== status) {
            setStatus(payload.new.status);
            // Reload the page if analysis is complete
            if (
              payload.new.status === "COMPLETED" ||
              payload.new.status === "ERROR"
            ) {
              window.location.reload();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quoteId, status]);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "COMPLETED"
          ? "bg-green-100 text-green-800"
          : status === "PROCESSING"
          ? "bg-blue-100 text-blue-800"
          : status === "ERROR"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
}
