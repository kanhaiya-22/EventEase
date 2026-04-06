import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
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

  // Get statistics
  const totalEvents = await db.event.count({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            organizerId: user.id,
          },
  });

  const totalRegistrations = await db.registration.count({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            event: {
              organizerId: user.id,
            },
          },
  });

  const totalCertificates = await db.certificate.count({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            event: {
              organizerId: user.id,
            },
          },
  });

  const upcomingEvents = await db.event.count({
    where: {
      ...(user.role === "ADMIN"
        ? {}
        : {
            organizerId: user.id,
          }),
      startDate: {
        gte: new Date(),
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage events, registrations, and certificates
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificates Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalCertificates}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {upcomingEvents}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="/admin/events" className="block">
            <Button className="w-full">Manage Events</Button>
          </a>
          <p className="text-sm text-muted-foreground">
            View and manage all your events, registrations, and certificates.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-sm mb-2">Certificate Management</h3>
            <p className="text-sm text-muted-foreground">
              Certificates are automatically created when students register for events. Once an event is completed, you can view and manage certificates in the event's certificate management section.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2">Registration Status</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>CONFIRMED</strong> - Student has registered for the event</li>
              <li>• <strong>WAITLISTED</strong> - Event is full, student is on waitlist</li>
              <li>• <strong>CANCELLED</strong> - Registration has been cancelled</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
