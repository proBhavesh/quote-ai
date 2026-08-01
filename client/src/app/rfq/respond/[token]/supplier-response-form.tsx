"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { submitSupplierResponseAction } from "@/app/actions/rfq";

export function SupplierResponseForm({ token }: { token: string }) {
  const router = useRouter();
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quotedTotal = parseFloat(total);
    if (Number.isNaN(quotedTotal)) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSupplierResponseAction(token, quotedTotal, notes);
      toast({ title: "Quote submitted, thank you!" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit your quote",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="total">Your total quote</Label>
        <Input
          id="total"
          type="number"
          step="0.01"
          min="0"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Lead time, terms, substitutions, etc."
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit quote"}
      </Button>
    </form>
  );
}
