import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart3, CheckCircle2, Calendar, Copy } from "lucide-react";
import { EventStatusDropdown } from "@/components/events/event-status-dropdown";
import { DuplicateEventButton } from "@/components/events/duplicate-event-button";

export default async function OrganizedEventsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, orgId: true, org: { select: { name: true } } },
  });

  if (!user) {
    redirect("/login");
  }

  // Show events from the organizer's entire organization (not just their own)
  const events = await db.event.findMany({
    where: user.orgId
      ? { orgId: user.orgId }
      : { organizer: { email: session.user.email } },
    include: {
      organizer: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          registrations: { where: { status: { not: "CANCELLED" } } },
        },
      },
      registrations: {
        where: { status: { not: "CANCELLED" } },
        include: {
          attendance: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate overall statistics
  const totalEvents = events.length;
  const totalRegistrations = events.reduce(
    (sum, event) => sum + event._count.registrations,
    0
  );
  const totalAttended = events.reduce(
    (sum, event) =>
      sum + event.registrations.filter((reg) => reg.attendance).length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {user.org?.name ? `${user.org.name} Events` : "Your Events"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user.org?.name
            ? `All events organized by ${user.org.name}`
            : "Manage and view all events you've organized"}
        </p>
      </div>

      {/* Overview Stats */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Events organized
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Students registered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Attended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalAttended}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRegistrations > 0
                  ? Math.round((totalAttended / totalRegistrations) * 100)
                  : 0}
                % attendance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(
                  (event) => new Date(event.startDate) > new Date()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Events coming up
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-300 text-lg">No events organized yet.</p>
          <Link
            href="/events/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Events</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => {
              const attendedCount = event.registrations.filter(
                (reg) => reg.attendance
              ).length;
              const attendanceRate =
                event._count.registrations > 0
                  ? Math.round(
                      (attendedCount / event._count.registrations) * 100
                    )
                  : 0;
              const isUpcoming = new Date(event.startDate) > new Date();

              return (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">
                          {event.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          {new Date(event.startDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                      <EventStatusDropdown
                        eventId={event.id}
                        currentStatus={event.status}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {event._count.registrations}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Users className="inline h-3 w-3 mr-1" />
                            Registrations
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {attendedCount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <CheckCircle2 className="inline h-3 w-3 mr-1" />
                            Attended
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{attendanceRate}%</p>
                          <p className="text-xs text-muted-foreground">
                            <BarChart3 className="inline h-3 w-3 mr-1" />
                            Attendance
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Capacity</span>
                          <span className="font-medium">
                            {event._count.registrations}/{event.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 bg-blue-600 rounded-full"
                            style={{
                              width: `${Math.min(
                                (event._count.registrations / event.capacity) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Link
                          href={`/organized-events/${event.id}/students`}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 text-center font-medium"
                        >
                          View Students
                        </Link>
                        <Link
                          href={`/organized-events/${event.id}/edit`}
                          className="flex-1 bg-slate-200 text-slate-900 px-3 py-2 rounded text-sm hover:bg-slate-300 text-center font-medium"
                        >
                          Edit
                        </Link>
                        <DuplicateEventButton eventId={event.id} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
