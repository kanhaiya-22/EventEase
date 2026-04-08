import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrganizerRequestActions } from "@/components/admin/organizer-request-actions";

export default async function OrganizerRequestsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") redirect("/");

  const requests = await db.organizerRequest.findMany({
    include: {
      user: {
        select: { name: true, email: true, department: true, createdAt: true },
      },
      reviewer: { select: { name: true } },
    },
    orderBy: [
      { status: "asc" }, // PENDING first
      { createdAt: "desc" },
    ],
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizer Requests</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage organizer verification requests
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">No organizer requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className={request.status === "PENDING" ? "border-amber-200" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{request.user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{request.user.email}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">College / Organization</p>
                    <p className="text-sm font-medium">{request.collegeName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Designation</p>
                    <p className="text-sm font-medium">{request.designation}</p>
                  </div>
                  {request.user.department && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Department</p>
                      <p className="text-sm">{request.user.department}</p>
                    </div>
                  )}
                  {request.organizationWeb && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Website</p>
                      <a
                        href={request.organizationWeb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {request.organizationWeb}
                      </a>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Reason</p>
                    <p className="text-sm mt-1">{request.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Applied on</p>
                    <p className="text-sm">
                      {new Date(request.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  {request.reviewer && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Reviewed by</p>
                      <p className="text-sm">{request.reviewer.name}</p>
                    </div>
                  )}
                  {request.rejectionReason && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Rejection Reason</p>
                      <p className="text-sm text-red-600">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {request.status === "PENDING" && (
                  <div className="mt-4 pt-4 border-t">
                    <OrganizerRequestActions requestId={request.id} userName={request.user.name} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
