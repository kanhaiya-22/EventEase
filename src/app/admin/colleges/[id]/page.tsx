import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteCollegeButton } from "@/components/admin/delete-college-button";
import {
  Users,
  Calendar,
  Ticket,
  Edit,
  Mail,
  Building2,
} from "lucide-react";
import Link from "next/link";

export default async function CollegeDetailPage({
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

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const organization = await db.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
        orderBy: { createdAt: "desc" },
      },
      events: {
        include: {
          _count: {
            select: { registrations: { where: { status: { not: "CANCELLED" } } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!organization) {
    redirect("/admin/colleges");
  }

  const totalRegistrations = organization.events.reduce(
    (sum, event) => sum + event._count.registrations,
    0
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "ORGANIZER":
        return "bg-purple-100 text-purple-800";
      case "STUDENT":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "ONGOING":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/colleges"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to Colleges
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {organization.name}
              </h1>
              <Badge variant="secondary" className="mt-1">
                {organization.slug}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/colleges/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <DeleteCollegeButton id={id} name={organization.name} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.users.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.events.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Total Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Users ({organization.users.length})
        </h2>
        {organization.users.length === 0 ? (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-muted-foreground">
                No users assigned to this college yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Department
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {organization.users.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-medium">
                        {u.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={`mailto:${u.email}`}
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          {u.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={getRoleColor(u.role)}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {u.department || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Events ({organization.events.length})
        </h2>
        {organization.events.length === 0 ? (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-muted-foreground">
                No events created by this college yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Registrations
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {organization.events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-t hover:bg-muted/50"
                    >
                      <td className="px-6 py-4 text-sm font-medium">
                        {event.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {event._count.registrations}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
