import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Users, Edit, QrCode } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { EventStatusDropdown } from "@/components/events/event-status-dropdown";

type ViewFilter = "active" | "archived" | "all";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    redirect("/");
  }

  const { view } = await searchParams;
  const currentView: ViewFilter =
    view === "archived" || view === "all" ? view : "active";

  // Admin sees all; organizers see their org's events
  const scopeWhere: Prisma.EventWhereInput =
    user.role === "ADMIN"
      ? {}
      : user.orgId
        ? { orgId: user.orgId }
        : { organizerId: user.id };

  const statusWhere: Prisma.EventWhereInput =
    currentView === "active"
      ? { status: { notIn: ["ARCHIVED", "CANCELLED"] } }
      : currentView === "archived"
        ? { status: { in: ["ARCHIVED", "CANCELLED"] } }
        : {};

  const where: Prisma.EventWhereInput = { AND: [scopeWhere, statusWhere] };

  const [events, activeCount, archivedCount, allCount] = await Promise.all([
    db.event.findMany({
      where,
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            registrations: { where: { status: { not: "CANCELLED" } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.event.count({
      where: { AND: [scopeWhere, { status: { notIn: ["ARCHIVED", "CANCELLED"] } }] },
    }),
    db.event.count({
      where: { AND: [scopeWhere, { status: { in: ["ARCHIVED", "CANCELLED"] } }] },
    }),
    db.event.count({ where: scopeWhere }),
  ]);

  const tabs: { key: ViewFilter; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeCount },
    { key: "archived", label: "Archived & Cancelled", count: archivedCount },
    { key: "all", label: "All", count: allCount },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your events and view registrations
          </p>
        </div>
        <Link href="/events/create">
          <Button>Create Event</Button>
        </Link>
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {tabs.map((tab) => {
          const isActive = tab.key === currentView;
          return (
            <Link
              key={tab.key}
              href={`/admin/events?view=${tab.key}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs bg-muted rounded-full px-2 py-0.5">
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">
              No events yet. Create your first event to get started.
            </p>
            <Link href="/events/create" className="mt-4 inline-block">
              <Button>Create Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isInactive = event.status === "ARCHIVED" || event.status === "CANCELLED";
            return (
            <Card
              key={event.id}
              className={`hover:shadow-lg transition-shadow ${isInactive ? "opacity-70" : ""}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold truncate">
                        {event.title}
                      </h3>
                      <EventStatusDropdown
                        eventId={event.id}
                        currentStatus={event.status}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                      <span>📅 {new Date(event.startDate).toLocaleDateString("en-IN")}</span>
                      <span>📍 {event.venue}</span>
                      <span>🏷️ {event.category}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold">
                        {event._count.registrations}
                      </div>
                      <p className="text-xs text-muted-foreground">Registrations</p>
                      <p className="text-xs text-muted-foreground">
                        Capacity: {event.capacity}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t flex-wrap">
                  <Link href={`/admin/events/${event.id}/attendance`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <QrCode className="h-4 w-4" />
                      Attendance
                    </Button>
                  </Link>
                  <Link href={`/admin/events/${event.id}/registrations`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Users className="h-4 w-4" />
                      Registrations
                    </Button>
                  </Link>
                  <Link href={`/admin/events/${event.id}/certificates`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Award className="h-4 w-4" />
                      Certificates
                    </Button>
                  </Link>
                  <Link href={`/organized-events/${event.id}/edit?from=admin`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
