"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { acceptInviteAction } from "@/app/actions/organizations";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptInviteAction(token);
      toast({ title: "You've joined the organization" });
      router.push(`/organizations/${result.organizationId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invite",
        variant: "destructive",
      });
      setIsAccepting(false);
    }
  };

  return (
    <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
      {isAccepting ? "Joining..." : "Accept invite"}
    </Button>
  );
}
