import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QRScannerComponent from "@/components/events/qr-scanner";
import { CheckCircle2, Clock, Users } from "lucide-react";
import Link from "next/link";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const event = await db.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
        },
      },
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
          attendance: true,
        },
        orderBy: { registeredAt: "desc" },
      },
    },
  });

  if (!event) {
    redirect("/admin/events");
  }

  if (user.role !== "ADMIN" && event.organizerId !== user.id) {
    redirect("/admin/events");
  }

  const totalRegistered = event.registrations.filter(
    (reg) => reg.status !== "CANCELLED"
  ).length;

  const totalAttended = event.registrations.filter(
    (reg) => reg.attendance
  ).length;

  const attendanceRate = totalRegistered > 0
    ? Math.round((totalAttended / totalRegistered) * 100)
    : 0;

  const notAttended = event.registrations.filter(
    (reg) => reg.status !== "CANCELLED" && !reg.attendance
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/events" className="text-sm text-muted-foreground hover:underline">
            ← Back to Events
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{event.title}</h1>
          <p className="text-muted-foreground mt-1">
            Mark and manage attendance
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Registered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Attended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalAttended}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner */}
      <QRScannerComponent eventId={event.id} />

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Check-in Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {event.registrations
                    .filter((reg) => reg.status !== "CANCELLED")
                    .map((reg) => (
                      <tr key={reg.id} className="border-t hover:bg-muted/50">
                        <td className="px-6 py-4 text-sm font-medium">
                          {reg.user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {reg.user.department || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {reg.user.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {reg.attendance ? (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              Attended
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {reg.attendance ? (
                            <span>
                              {new Date(reg.attendance.checkedInAt).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Not Attended List */}
      {notAttended.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Not Attended ({notAttended.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notAttended.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{reg.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {reg.user.email}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>📝 How it works:</strong>
        </p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
          <li>• Each registered student has a unique QR code</li>
          <li>• Scan QR codes to mark attendance in real-time</li>
          <li>• Attendance records are linked to student registrations</li>
          <li>• Certificates can be issued to all attendees after the event</li>
        </ul>
      </div>
    </div>
  );
}
