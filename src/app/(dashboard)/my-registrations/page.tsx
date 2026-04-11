import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StudentQRDisplay from "@/components/events/student-qr-display";
import { CancelRegistrationButton } from "@/components/registrations/cancel-registration-button";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { QrCode, CheckCircle2, LogIn, Hourglass } from "lucide-react";

export default async function MyRegistrationsPage() {
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

  const allRegistrations = await db.registration.findMany({
    where: {
      userId: user.id,
      status: { in: ["CONFIRMED", "WAITLISTED"] },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          venue: true,
          status: true,
        },
      },
      attendance: true,
    },
    orderBy: { registeredAt: "desc" },
  });

  const registrations = allRegistrations.filter((r) => r.status === "CONFIRMED");
  const waitlisted = allRegistrations.filter((r) => r.status === "WAITLISTED");

  // Compute waitlist position for each waitlisted registration in a single query.
  const waitlistedWithPosition = await Promise.all(
    waitlisted.map(async (reg) => {
      const ahead = await db.registration.count({
        where: {
          eventId: reg.eventId,
          status: "WAITLISTED",
          registeredAt: { lt: reg.registeredAt },
        },
      });
      return { ...reg, position: ahead + 1 };
    })
  );

  if (registrations.length === 0 && waitlistedWithPosition.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Event QR Codes</h1>
          <p className="text-muted-foreground mt-1">
            View QR codes for events you&apos;ve registered for
          </p>
        </div>

        <Card>
          <CardContent className="pt-8 text-center">
            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              You haven&apos;t registered for any events yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Register for an event to see your QR code here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separate upcoming and past events
  const now = new Date();
  const upcomingRegistrations = registrations.filter(
    (reg) => new Date(reg.event.startDate) >= now
  );
  const pastRegistrations = registrations.filter(
    (reg) => new Date(reg.event.startDate) < now
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Event QR Codes</h1>
        <p className="text-muted-foreground mt-1">
          Use these QR codes to check in at events
        </p>
      </div>

      {/* Quick Check-In Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogIn className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Ready to check in?</p>
                <p className="text-sm text-blue-800">
                  Use your QR code to mark yourself present at an event
                </p>
              </div>
            </div>
            <Link href="/check-in">
              <Button variant="default" className="gap-2">
                <QrCode className="h-4 w-4" />
                Check In Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      {upcomingRegistrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <div className="space-y-6">
            {upcomingRegistrations.map((reg) => (
              <div key={reg.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Event status:</span>
                  <EventStatusBadge status={reg.event.status} size="sm" />
                </div>
                <StudentQRDisplay
                  eventTitle={reg.event.title}
                  studentName={user.name}
                  qrCode={reg.qrCode}
                  registrationId={reg.id}
                  attended={!!reg.attendance}
                  attendanceTime={
                    reg.attendance
                      ? reg.attendance.checkedInAt.toISOString()
                      : undefined
                  }
                />
                {!reg.attendance && (
                  <div className="flex justify-end">
                    <CancelRegistrationButton
                      registrationId={reg.id}
                      eventTitle={reg.event.title}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waitlisted Events */}
      {waitlistedWithPosition.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-amber-600" />
            On the Waitlist
          </h2>
          <div className="space-y-3">
            {waitlistedWithPosition.map((reg) => (
              <Card key={reg.id} className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{reg.event.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        📅{" "}
                        {new Date(reg.event.startDate).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        📍 {reg.event.venue}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Waitlist · #{reg.position}
                      </span>
                      <EventStatusBadge status={reg.event.status} size="sm" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-amber-800 mb-3">
                    We&apos;ll email you the moment a spot opens up. You can leave the
                    waitlist any time.
                  </p>
                  <div className="flex justify-end">
                    <CancelRegistrationButton
                      registrationId={reg.id}
                      eventTitle={reg.event.title}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastRegistrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Events</h2>
          <div className="space-y-6">
            {pastRegistrations.map((reg) => (
              <Card key={reg.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{reg.event.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(reg.event.startDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <EventStatusBadge status={reg.event.status} size="sm" />
                      {reg.attendance ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Attended
                        </div>
                      ) : (
                        <div className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          Not Attended
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      📍 {reg.event.venue}
                    </p>
                    {reg.attendance && (
                      <p className="text-sm text-green-700">
                        ✓ Checked in at{" "}
                        {new Date(
                          reg.attendance.checkedInAt
                        ).toLocaleTimeString("en-IN")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
