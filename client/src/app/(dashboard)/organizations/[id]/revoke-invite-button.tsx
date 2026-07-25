"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { revokeInviteAction } from "@/app/actions/organizations";

export function RevokeInviteButton({
  organizationId,
  inviteId,
}: {
  organizationId: string;
  inviteId: string;
}) {
  const router = useRouter();
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await revokeInviteAction(organizationId, inviteId);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke invite",
        variant: "destructive",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleRevoke} disabled={isRevoking}>
      Revoke
    </Button>
  );
}
