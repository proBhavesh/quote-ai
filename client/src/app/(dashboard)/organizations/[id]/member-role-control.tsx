"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { updateMemberRoleAction } from "@/app/actions/organizations";
import type { OrgRole } from "@/lib/organizations";

const ASSIGNABLE_ROLES: Exclude<OrgRole, "OWNER">[] = [
  "ADMIN",
  "APPROVER",
  "MEMBER",
];

export function MemberRoleControl({
  organizationId,
  memberId,
  currentRole,
}: {
  organizationId: string;
  memberId: string;
  currentRole: Exclude<OrgRole, "OWNER">;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (value: string) => {
    setIsUpdating(true);
    try {
      await updateMemberRoleAction(
        organizationId,
        memberId,
        value as Exclude<OrgRole, "OWNER">
      );
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={currentRole} onValueChange={handleChange} disabled={isUpdating}>
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNABLE_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
