import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Award, TrendingUp, BarChart3, CheckCircle2, Building2, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  // Admin gets a completely different dashboard
  if (user.role === "ADMIN") {
    const [totalColleges, totalUsers, totalEvents, totalRegistrations, totalCertificates] =
      await Promise.all([
        db.organization.count(),
        db.user.count(),
        db.event.count(),
        db.registration.count(),
        db.certificate.count(),
      ]);

    const recentColleges = await db.organization.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, events: true } },
      },
    });

    const usersByRole = await db.user.groupBy({
      by: ["role"],
      _count: true,
    });

    const eventsByStatus = await db.event.groupBy({
      by: ["status"],
      _count: true,
    });

    const recentEvents = await db.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        org: { select: { name: true } },
        _count: { select: { registrations: { where: { status: { not: "CANCELLED" } } } } },
      },
    });

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide analytics and management
          </p>
        </div>

        {/* Platform Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Colleges
              </CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalColleges}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
            </CardContent>
          </Card>
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
              <div className="text-2xl font-bold text-green-600">{totalCertificates}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users by Role + Events by Status */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usersByRole.map((item) => (
                  <div key={item.role} className="flex items-center justify-between">
                    <Badge
                      className={
                        item.role === "ADMIN"
                          ? "bg-red-100 text-red-800"
                          : item.role === "ORGANIZER"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }
                    >
                      {item.role}
                    </Badge>
                    <span className="text-lg font-semibold">{item._count}</span>
                  </div>
                ))}
                {usersByRole.length === 0 && (
                  <p className="text-sm text-muted-foreground">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Events by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <Badge variant="secondary">{item.status}</Badge>
                    <span className="text-lg font-semibold">{item._count}</span>
                  </div>
                ))}
                {eventsByStatus.length === 0 && (
                  <p className="text-sm text-muted-foreground">No events yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colleges Overview */}
        {recentColleges.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Colleges</CardTitle>
              <Link
                href="/admin/colleges"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage all &rarr;
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentColleges.map((org) => (
                  <Link
                    key={org.id}
                    href={`/admin/colleges/${org.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{org.name}</p>
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          {org.slug}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {org._count.users}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {org._count.events}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Events across all colleges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Events</CardTitle>
            <Link
              href="/admin"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events on the platform yet.</p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {event.org && (
                          <Badge variant="outline" className="text-xs">
                            {event.org.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{event._count.registrations}</div>
                      <p className="text-xs text-muted-foreground">registrations</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is an organizer
  const isOrganizer = user.role === "ORGANIZER";

  // Get user registrations count
  const registrationsCount = await db.registration.count({
    where: { userId: user.id },
  });

  // Get upcoming events (user registered for)
  const upcomingEvents = await db.event.count({
    where: {
      registrations: {
        some: {
          userId: user.id,
          status: { not: "CANCELLED" },
        },
      },
      startDate: {
        gte: new Date(),
      },
    },
  });

  // Get certificates count
  const certificatesCount = await db.certificate.count({
    where: { userId: user.id },
  });

  // Get attended events for attendance rate
  const attendedEventsCount = await db.registration.count({
    where: {
      userId: user.id,
      status: "CONFIRMED",
    },
  });

  const attendanceRate = registrationsCount > 0 
    ? Math.round((attendedEventsCount / registrationsCount) * 100)
    : 0;

  const stats = [
    { label: "Upcoming Events", value: upcomingEvents, icon: Calendar },
    { label: "Registrations", value: registrationsCount, icon: Users },
    { label: "Certificates", value: certificatesCount, icon: Award },
    { label: "Attendance Rate", value: `${attendanceRate}%`, icon: TrendingUp },
  ];

  // Get recent registrations
  const recentRegistrations = await db.registration.findMany({
    where: { userId: user.id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
        },
      },
    },
    orderBy: { registeredAt: "desc" },
    take: 5,
  });

  // Get organizer's org events (if organizer)
  let organizedEvents = null;
  let organizerStats = null;
  if (isOrganizer) {
    const orgEventFilter = user.orgId
      ? { orgId: user.orgId }
      : { organizerId: user.id };

    organizedEvents = await db.event.findMany({
      where: orgEventFilter,
      include: {
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
        startDate: "desc",
      },
      take: 5,
    });

    // Calculate organizer statistics
    const totalOrganizedEvents = await db.event.count({
      where: orgEventFilter,
    });

    const allOrganizedEvents = await db.event.findMany({
      where: orgEventFilter,
      include: {
        registrations: {
          where: { status: { not: "CANCELLED" } },
          include: {
            attendance: {
              select: { id: true },
            },
          },
        },
      },
    });

    const totalRegistrations = allOrganizedEvents.reduce(
      (sum, event) => sum + event.registrations.length,
      0
    );

    const totalAttended = allOrganizedEvents.reduce(
      (sum, event) =>
        sum + event.registrations.filter((reg) => reg.attendance).length,
      0
    );

    organizerStats = {
      totalEvents: totalOrganizedEvents,
      totalRegistrations,
      totalAttended,
      attendanceRate: totalRegistrations > 0 
        ? Math.round((totalAttended / totalRegistrations) * 100)
        : 0,
    };
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here&apos;s what&apos;s happening with your events.
        </p>
      </div>

      {/* ORGANIZER SECTION */}
      {isOrganizer && organizerStats && (
        <>
          {/* Organizer Overview Stats */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Your Events Analytics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Events Organized
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organizerStats.totalEvents}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Registrations
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organizerStats.totalRegistrations}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Attended
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {organizerStats.totalAttended}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Attendance Rate
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organizerStats.attendanceRate}%</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Organized Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Events</h2>
              <Link
                href="/organized-events"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {organizedEvents && organizedEvents.length > 0 ? (
                organizedEvents.map((event) => {
                  const attendedCount = event.registrations.filter(
                    (reg) => reg.attendance
                  ).length;
                  const attendanceRate =
                    event._count.registrations > 0
                      ? Math.round((attendedCount / event._count.registrations) * 100)
                      : 0;

                  return (
                    <Card key={event.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(event.startDate).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {event._count.registrations}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {attendedCount} attended
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Link
                            href={`/organized-events/${event.id}/students`}
                            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 text-center font-medium"
                          >
                            View Students
                          </Link>
                          <Link
                            href={`/organized-events/${event.id}/certificates`}
                            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 text-center font-medium"
                          >
                            Issue Certificates
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No events organized yet.</p>
                    <Link
                      href="/events/create"
                      className="inline-block mt-3 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first event →
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* STUDENT SECTION */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {isOrganizer ? "Your Registrations" : "Your Events"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent {isOrganizer ? "Registrations for Your Events" : "Registrations"}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRegistrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isOrganizer 
                ? "No registrations yet. Check your organized events."
                : "No registrations yet. Register for an event to get started."}
            </p>
          ) : (
            <div className="space-y-4">
              {recentRegistrations.map((reg) => (
                <div key={reg.id} className="flex items-start justify-between pb-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-sm">{reg.event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(reg.event.startDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    reg.status === "CONFIRMED" ? "bg-blue-100 text-blue-700" :
                    reg.status === "WAITLISTED" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {reg.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
