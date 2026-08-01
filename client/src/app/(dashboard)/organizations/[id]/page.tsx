import { Metadata } from "next";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getOrganizationForMember,
  getMembership,
  OrganizationAccessError,
  type OrgRole,
} from "@/lib/organizations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InviteMemberForm } from "./invite-member-form";
import { MemberRoleControl } from "./member-role-control";
import { RemoveMemberButton } from "./remove-member-button";
import { RevokeInviteButton } from "./revoke-invite-button";

export const metadata: Metadata = {
  title: "Organization - Quote AI",
};

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id;

  let organization;
  try {
    organization = await getOrganizationForMember(id, userId);
  } catch (error) {
    if (error instanceof OrganizationAccessError) {
      notFound();
    }
    throw error;
  }

  if (!organization) {
    notFound();
  }

  const membership = await getMembership(id, userId);
  const myRole = membership?.role as OrgRole;
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            <p className="text-muted-foreground">
              Your role: <Badge variant="secondary">{myRole}</Badge>
            </p>
          </div>
          {canManage && (
            <Link
              href={`/organizations/${organization.id}/audit`}
              className="text-sm underline text-muted-foreground hover:text-foreground"
            >
              View audit log
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members</CardTitle>
            <CardDescription>
              Owners and admins can manage roles. Approvers can approve or
              reject quotes submitted in this organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {organization.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.user.name || "—"}</TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      {canManage && member.role !== "OWNER" ? (
                        <MemberRoleControl
                          organizationId={organization.id}
                          memberId={member.id}
                          currentRole={member.role as Exclude<OrgRole, "OWNER">}
                        />
                      ) : (
                        <Badge variant="secondary">{member.role}</Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        {member.role !== "OWNER" && member.userId !== userId && (
                          <RemoveMemberButton
                            organizationId={organization.id}
                            memberId={member.id}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invite a teammate</CardTitle>
              <CardDescription>
                They&apos;ll get an email with a link to join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InviteMemberForm organizationId={organization.id} />

              {organization.invites.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">Pending invites</p>
                  {organization.invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span>
                        {invite.email}{" "}
                        <Badge variant="outline" className="ml-2">
                          {invite.role}
                        </Badge>
                      </span>
                      <RevokeInviteButton
                        organizationId={organization.id}
                        inviteId={invite.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
