import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Award, Ticket } from "lucide-react";
import Link from "next/link";
import { EventStatusBadge } from "@/components/events/event-status-badge";

export default async function AdminPanel() {
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

  const isAdmin = user.role === "ADMIN";
  const eventWhere = isAdmin
    ? {}
    : user.orgId
      ? { orgId: user.orgId }
      : { organizerId: user.id };
  const regWhere = isAdmin
    ? {}
    : user.orgId
      ? { event: { orgId: user.orgId } }
      : { event: { organizerId: user.id } };

  const [totalEvents, totalRegistrations, totalCertificates, upcomingEvents] =
    await Promise.all([
      db.event.count({ where: eventWhere }),
      db.registration.count({ where: regWhere }),
      db.certificate.count({ where: regWhere }),
      db.event.count({
        where: { ...eventWhere, startDate: { gte: new Date() } },
      }),
    ]);

  // Recent events with registration counts
  const recentEvents = await db.event.findMany({
    where: eventWhere,
    include: {
      organizer: { select: { name: true } },
      org: { select: { name: true } },
      _count: { select: { registrations: { where: { status: { not: "CANCELLED" } } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? "All Events" : "Events Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Platform-wide event oversight and management"
              : "Manage your events, registrations, and certificates"}
          </p>
        </div>
        {!isAdmin && (
          <Link href="/events/create">
            <Button>Create Event</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registrations
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificates
            </CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalCertificates}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {upcomingEvents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      {recentEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">No events yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Event
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      College
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Registrations
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr key={event.id} className="border-t hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          by {event.organizer.name}
                        </p>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {event.org?.name || "—"}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <EventStatusBadge status={event.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold">
                        {event._count.registrations}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Link href={`/admin/events/${event.id}/registrations`}>
                          <Button variant="ghost" size="sm" title="Registrations">
                            <Users className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/certificates`}>
                          <Button variant="ghost" size="sm" title="Certificates">
                            <Award className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentEvents.length >= 10 && (
        <div className="text-center">
          <Link href="/admin/events">
            <Button variant="outline">View All Events</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
