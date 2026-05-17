import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrgLogo } from "@/components/ui/org-logo";
import { Building2, Users, Calendar, Plus } from "lucide-react";
import Link from "next/link";

export default async function CollegesPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const organizations = await db.organization.findMany({
    include: {
      _count: {
        select: { users: true, events: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get registration counts per org
  const registrationCounts = await db.registration.groupBy({
    by: ["eventId"],
    _count: true,
  });

  // Map event IDs to org IDs for registration counting
  const events = await db.event.findMany({
    select: { id: true, orgId: true },
  });

  const eventOrgMap = new Map(events.map((e) => [e.id, e.orgId]));
  const orgRegistrations = new Map<string, number>();

  for (const reg of registrationCounts) {
    const orgId = eventOrgMap.get(reg.eventId);
    if (orgId) {
      orgRegistrations.set(
        orgId,
        (orgRegistrations.get(orgId) || 0) + reg._count
      );
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Colleges</h1>
          <p className="text-muted-foreground mt-1">
            Manage all colleges and their records
          </p>
        </div>
        <Link href="/admin/colleges/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add College
          </Button>
        </Link>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No colleges yet. Add your first college to get started.
            </p>
            <Link href="/admin/colleges/create" className="mt-4 inline-block">
              <Button>Add College</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link key={org.id} href={`/admin/colleges/${org.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <OrgLogo src={org.logo} name={org.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {org.name}
                      </h3>
                      <Badge variant="secondary" className="mt-1">
                        {org.slug}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-xl font-bold">
                        {org._count.users}
                      </div>
                      <p className="text-xs text-muted-foreground">Users</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-xl font-bold">
                        {org._count.events}
                      </div>
                      <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-xl font-bold">
                        {orgRegistrations.get(org.id) || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Registrations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
