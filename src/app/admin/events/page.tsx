import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Users, Edit, QrCode } from "lucide-react";
import Link from "next/link";

export default async function AdminEventsPage() {
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

  // Admin sees all; organizers see their org's events
  const events = await db.event.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : user.orgId
          ? { orgId: user.orgId }
          : { organizerId: user.id },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          registrations: { where: { status: { not: "CANCELLED" } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your events and view registrations
          </p>
        </div>
        <Link href="/dashboard/events/create">
          <Button>Create Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">
              No events yet. Create your first event to get started.
            </p>
            <Link href="/dashboard/events/create" className="mt-4 inline-block">
              <Button>Create Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {event.title}
                      </h3>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
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
                  <Link href={`/dashboard/organized-events/${event.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
