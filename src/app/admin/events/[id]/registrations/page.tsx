import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import Link from "next/link";

export default async function EventRegistrationsPage({
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "WAITLISTED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Clock className="h-4 w-4" />;
      case "WAITLISTED":
        return <Clock className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/events" className="text-sm text-muted-foreground hover:underline">
            ← Back to Events
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{event.title}</h1>
          <p className="text-muted-foreground mt-1">
            {event.registrations.length} total registrations
          </p>
        </div>
      </div>

      {event.registrations.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">
              No registrations yet for this event.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Registered On
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {event.registrations.map((reg) => (
                    <tr key={reg.id} className="border-t hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">{reg.user.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {reg.user.department || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={`mailto:${reg.user.email}`}
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          {reg.user.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(reg.status)}`}>
                          {getStatusIcon(reg.status)}
                          {reg.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(reg.registeredAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 Tip: To manage certificates for this event, go to the certificates tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
