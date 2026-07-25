"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { createRfqAction } from "@/app/actions/rfq";
import { X } from "lucide-react";

interface LineItemOption {
  description: string;
  quantity: number;
  unitPrice: number;
  suggestedSuppliers: string[];
}

interface SupplierRow {
  name: string;
  email: string;
}

export function CreateRfqForm({
  quoteId,
  quoteTitle,
  lineItems,
}: {
  quoteId: string;
  quoteTitle: string;
  lineItems: LineItemOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(`RFQ for ${quoteTitle}`);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Set<number>>(
    new Set(lineItems.map((_, i) => i))
  );
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([
    { name: "", email: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestedNames = Array.from(
    new Set(lineItems.flatMap((item) => item.suggestedSuppliers))
  ).slice(0, 6);

  const toggleItem = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateSupplier = (index: number, field: keyof SupplierRow, value: string) => {
    setSuppliers((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addSupplierRow = (prefillName?: string) => {
    setSuppliers((prev) => [...prev, { name: prefillName || "", email: "" }]);
  };

  const removeSupplierRow = (index: number) => {
    setSuppliers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedLineItems = lineItems
      .filter((_, i) => selected.has(i))
      .map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
    const validSuppliers = suppliers.filter((s) => s.name.trim() && s.email.trim());

    if (selectedLineItems.length === 0) {
      toast({ title: "Select at least one item", variant: "destructive" });
      return;
    }
    if (validSuppliers.length === 0) {
      toast({
        title: "Add at least one supplier",
        description: "Both a name and an email are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRfqAction(
        quoteId,
        title,
        message,
        selectedLineItems,
        validSuppliers
      );
      toast({ title: "RFQ created" });
      router.push(`/rfq/${result.rfqId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create RFQ",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message to suppliers (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Any context suppliers should know, e.g. delivery timeline"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lineItems.map((item, index) => (
            <label
              key={index}
              className="flex items-center gap-3 rounded-md border p-3 text-sm"
            >
              <Checkbox
                checked={selected.has(index)}
                onCheckedChange={() => toggleItem(index)}
              />
              <span className="flex-1">
                {item.description}{" "}
                <span className="text-muted-foreground">
                  (qty {item.quantity} @ {item.unitPrice})
                </span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suppliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedNames.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              Suggested from market data:
              {suggestedNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => addSupplierRow(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {suppliers.map((supplier, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Supplier name"
                value={supplier.name}
                onChange={(e) => updateSupplier(index, "name", e.target.value)}
              />
              <Input
                type="email"
                placeholder="supplier@company.com"
                value={supplier.email}
                onChange={(e) => updateSupplier(index, "email", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSupplierRow(index)}
                disabled={suppliers.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => addSupplierRow()}>
            Add another supplier
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create RFQ"}
        </Button>
      </div>
    </form>
  );
}
