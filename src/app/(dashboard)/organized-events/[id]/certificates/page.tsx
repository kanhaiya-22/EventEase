import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import IssueCertificatesForm from "@/components/certificates/issue-certificates-form";

interface CertificatesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventCertificatesPage({
  params,
}: CertificatesPageProps) {
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

  const { id } = await params;

  // Get event and verify ownership
  const event = await db.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: { id: true, email: true, name: true },
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
          attendance: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Verify user is the organizer
  if (event.organizer.id !== user.id && user.role !== "ADMIN") {
    redirect("/organized-events");
  }

  const presentStudents = event.registrations.filter(
    (reg) => reg.status === "CONFIRMED" && reg.attendance
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/organized-events/${event.id}/students`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to Students
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Issue Certificates</h1>
        <p className="text-muted-foreground mt-1">{event.title}</p>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {new Date(event.startDate).toLocaleDateString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Venue</p>
              <p className="font-medium">{event.venue}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Registrations</p>
              <p className="font-medium">{presentStudents.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">How to Issue Certificates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-1">
            <li>Select the students you want to issue certificates to</li>
            <li>Click "Issue Certificates" button</li>
            <li>Certificates will be generated and students will be notified</li>
          </ol>
        </CardContent>
      </Card>

      {/* Certificate Form */}
      {presentStudents.length > 0 ? (
        <IssueCertificatesForm
          eventId={event.id}
          eventTitle={event.title}
          registeredStudents={presentStudents}
        />
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">No students marked present for this event yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Mark attendance first, then issue certificates
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
