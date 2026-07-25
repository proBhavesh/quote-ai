"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { removeMemberAction } from "@/app/actions/organizations";

export function RemoveMemberButton({
  organizationId,
  memberId,
}: {
  organizationId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeMemberAction(organizationId, memberId);
      toast({ title: "Member removed" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
      onClick={handleRemove}
      disabled={isRemoving}
    >
      Remove
    </Button>
  );
}
