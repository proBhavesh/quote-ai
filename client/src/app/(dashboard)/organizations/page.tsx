import { Metadata } from "next";
import { auth } from "@/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { CreateOrganizationForm } from "./create-organization-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Organizations - Quote AI",
  description: "Manage your teams and organizations",
};

export default async function OrganizationsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const memberships = await getUserOrganizations(userId);

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Create a team to share quotes and route them through approval
          </p>
        </div>

        <CreateOrganizationForm />

        <div className="space-y-3">
          {memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You are not part of any organization yet.
            </p>
          ) : (
            memberships.map(({ organization, role }) => (
              <Link key={organization.id} href={`/organizations/${organization.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg">{organization.name}</CardTitle>
                    <Badge variant="secondary">{role}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {organization._count.members} member
                      {organization._count.members === 1 ? "" : "s"} ·{" "}
                      {organization._count.quotes} quote
                      {organization._count.quotes === 1 ? "" : "s"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
