import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import DeleteRegistrationButton from "@/components/registrations/delete-registration-button";
import IssueCertificatesForm from "@/components/certificates/issue-certificates-form";
import { ExportCSVButton } from "@/components/events/export-csv-button";

interface StudentsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentsPage({
  params,
}: StudentsPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  // Get event and verify ownership
  const event = await db.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: { id: true, email: true },
      },
      registrations: {
        where: { status: { not: "CANCELLED" } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              year: true,
              phone: true,
            },
          },
          attendance: {
            select: {
              checkedInAt: true,
              method: true,
            },
          },
        },
        orderBy: {
          registeredAt: "desc",
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Verify user is the organizer
  if (event.organizer.email !== session.user.email) {
    redirect("/organized-events");
  }

  const totalRegistrations = event.registrations.length;
  const attendedCount = event.registrations.filter(
    (reg) => reg.attendance
  ).length;
  const absentCount = totalRegistrations - attendedCount;
  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((attendedCount / totalRegistrations) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/organized-events/${event.id}/edit`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
        >
          ← Back to Event
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Registered Students</h1>
        <p className="text-muted-foreground mt-1">{event.title}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              out of {event.capacity} capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {attendanceRate}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {100 - attendanceRate}% no-show rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capacity Filled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((totalRegistrations / event.capacity) * 100)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{
                  width: `${Math.min(
                    (totalRegistrations / event.capacity) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student List</CardTitle>
            <ExportCSVButton eventId={id} />
          </div>
        </CardHeader>
        <CardContent>
          {totalRegistrations === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No students registered yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Department
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Year</th>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Attendance
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Check-in Time
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {event.registrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium">
                        {registration.user.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {registration.user.email}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {registration.user.department || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {registration.user.year || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {registration.user.phone || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {registration.attendance ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">Present</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="font-medium">Absent</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {registration.attendance ? (
                          <span className="text-xs">
                            {new Date(
                              registration.attendance.checkedInAt
                            ).toLocaleTimeString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <DeleteRegistrationButton
                          registrationId={registration.id}
                          eventId={event.id}
                          studentName={registration.user.name}
                          studentEmail={registration.user.email}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Certificates Section */}
      {attendedCount > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Issue Certificates</h2>
          <p className="text-muted-foreground">
            Select present students to issue them certificates
          </p>
          <IssueCertificatesForm
            eventId={event.id}
            eventTitle={event.title}
            registeredStudents={event.registrations.filter((reg) => reg.status === "CONFIRMED" && reg.attendance)}
          />
        </div>
      )}
    </div>
  );
}
