import { Metadata } from "next";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgRole, OrganizationAccessError } from "@/lib/organizations";
import { getOrganizationAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
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

export const metadata: Metadata = {
  title: "Audit Log - Quote AI",
};

const ACTION_LABEL: Record<string, string> = {
  ORGANIZATION_CREATED: "Organization created",
  MEMBER_INVITED: "Member invited",
  INVITE_REVOKED: "Invite revoked",
  INVITE_ACCEPTED: "Invite accepted",
  MEMBER_ROLE_CHANGED: "Member role changed",
  MEMBER_REMOVED: "Member removed",
  QUOTE_ASSIGNED_TO_ORGANIZATION: "Quote assigned to organization",
  QUOTE_SUBMITTED_FOR_APPROVAL: "Quote submitted for approval",
  QUOTE_APPROVED: "Quote approved",
  QUOTE_REJECTED: "Quote rejected",
  RFQ_CREATED: "RFQ created",
  RFQ_SENT: "RFQ sent to suppliers",
};

export default async function OrganizationAuditLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id;

  try {
    await requireOrgRole(id, userId, ["OWNER", "ADMIN"]);
  } catch (error) {
    if (error instanceof OrganizationAccessError) {
      notFound();
    }
    throw error;
  }

  const [organization, events] = await Promise.all([
    prisma.organization.findUnique({ where: { id }, select: { name: true } }),
    getOrganizationAuditLog(id),
  ]);

  if (!organization) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          {organization.name} ·{" "}
          <Link href={`/organizations/${id}`} className="underline">
            Back to organization
          </Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity</CardTitle>
          <CardDescription>
            Most recent {events.length} event{events.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {ACTION_LABEL[event.action] || event.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.actor?.name || event.actor?.email || "System"}
                    </TableCell>
                    <TableCell>
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
