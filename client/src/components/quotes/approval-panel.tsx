"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  decideQuoteApprovalAction,
  submitQuoteForApprovalAction,
} from "@/app/actions/approvals";
import { assignQuoteToOrganizationAction } from "@/app/actions/organizations";

type ApprovalStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

const STATUS_VARIANT: Record<ApprovalStatus, "secondary" | "default" | "destructive"> = {
  NONE: "secondary",
  PENDING: "default",
  APPROVED: "default",
  REJECTED: "destructive",
};

interface ApprovalPanelProps {
  quoteId: string;
  isOwner: boolean;
  approvalStatus: ApprovalStatus;
  organization: { id: string; name: string } | null;
  canDecide: boolean;
  userOrganizations: { id: string; name: string }[];
  latestApproval: {
    requestedByName: string | null;
    approverName: string | null;
    note: string | null;
    decidedAt: string | null;
  } | null;
}

export function ApprovalPanel({
  quoteId,
  isOwner,
  approvalStatus,
  organization,
  canDecide,
  userOrganizations,
  latestApproval,
}: ApprovalPanelProps) {
  const router = useRouter();
  const [selectedOrgId, setSelectedOrgId] = useState(userOrganizations[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOwner && !organization) {
    return null;
  }

  const handleAssign = async () => {
    if (!selectedOrgId) return;
    setIsSubmitting(true);
    try {
      await assignQuoteToOrganizationAction(quoteId, selectedOrgId);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign quote",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    try {
      await submitQuoteForApprovalAction(quoteId);
      toast({ title: "Submitted for approval" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit for approval",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecide = async (decision: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    try {
      await decideQuoteApprovalAction(quoteId, decision, note);
      toast({ title: decision === "APPROVED" ? "Quote approved" : "Quote rejected" });
      setNote("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record decision",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Approval</CardTitle>
        <Badge variant={STATUS_VARIANT[approvalStatus]}>{approvalStatus}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {!organization && isOwner && userOrganizations.length > 0 && (
          <div className="flex gap-2">
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Assign to an organization" />
              </SelectTrigger>
              <SelectContent>
                {userOrganizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAssign} disabled={isSubmitting || !selectedOrgId}>
              Assign
            </Button>
          </div>
        )}

        {organization && (
          <p className="text-sm text-muted-foreground">
            Organization: <span className="font-medium">{organization.name}</span>
          </p>
        )}

        {organization && isOwner && (approvalStatus === "NONE" || approvalStatus === "REJECTED") && (
          <Button onClick={handleSubmitForApproval} disabled={isSubmitting}>
            Submit for approval
          </Button>
        )}

        {approvalStatus === "PENDING" && canDecide && (
          <div className="space-y-2">
            <Textarea
              placeholder="Optional note for the requester"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={() => handleDecide("APPROVED")} disabled={isSubmitting}>
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDecide("REJECTED")}
                disabled={isSubmitting}
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        {latestApproval && approvalStatus !== "NONE" && (
          <div className="space-y-1 rounded-md border p-3 text-sm text-muted-foreground">
            <p>Requested by {latestApproval.requestedByName || "—"}</p>
            {latestApproval.approverName && (
              <p>
                {approvalStatus === "REJECTED" ? "Rejected" : "Decided"} by{" "}
                {latestApproval.approverName}
                {latestApproval.decidedAt &&
                  ` on ${new Date(latestApproval.decidedAt).toLocaleDateString()}`}
              </p>
            )}
            {latestApproval.note && <p>Note: {latestApproval.note}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
