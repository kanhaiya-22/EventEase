import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, Mail, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default async function EventCertificatesPage({
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
        },
      },
    },
  });

  if (!event) {
    redirect("/admin/events");
  }

  if (user.role !== "ADMIN" && event.organizerId !== user.id) {
    redirect("/admin/events");
  }

  // Get certificates for this event
  const certificates = await db.certificate.findMany({
    where: {
      eventId: event.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { issuedAt: "desc" },
  });

  const registeredUsers = event.registrations.filter(
    (reg) => reg.status === "CONFIRMED" || reg.status === "WAITLISTED"
  );

  const certificatesIssued = certificates.length;
  const pendingCertificates = registeredUsers.length - certificatesIssued;

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-yellow-100 text-yellow-800";
    switch (status.toUpperCase()) {
      case "ISSUED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/events" className="text-sm text-muted-foreground hover:underline">
            ← Back to Events
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            {event.title} - Certificates
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage certificates for registered attendees
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registered Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registeredUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificates Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{certificatesIssued}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCertificates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Distribution */}
      {registeredUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">
              No registered students for this event yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Students & Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Certificate Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">
                          Issued Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredUsers.map((reg) => {
                        const cert = certificates.find(
                          (c) => c.userId === reg.userId
                        );
                        return (
                          <tr key={reg.id} className="border-t hover:bg-muted/50">
                            <td className="px-6 py-4 text-sm font-medium">
                              {reg.user.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {reg.user.department || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              <a
                                href={`mailto:${reg.user.email}`}
                                className="text-blue-600 hover:underline flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                {reg.user.email}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {cert ? (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Issued
                                  </Badge>
                                  {cert.certificateUrl && (
                                    <a
                                      href={cert.certificateUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {cert
                                ? new Date(cert.issuedAt).toLocaleDateString(
                                    "en-IN"
                                  )
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {pendingCertificates > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900 mb-3">
                ⚠️ {pendingCertificates} certificate{pendingCertificates !== 1 ? "s" : ""} pending issuance
              </p>
              <p className="text-xs text-yellow-800">
                Certificates are automatically issued after event completion. You can manually issue certificates through the batch operations.
              </p>
            </div>
          )}

          {certificatesIssued > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                ✅ {certificatesIssued} certificate{certificatesIssued !== 1 ? "s" : ""} successfully issued
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
