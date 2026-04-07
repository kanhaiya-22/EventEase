import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, CheckCircle } from "lucide-react";

export default async function CertificatesPage() {
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

  // Only show certificates that were actually issued by the organizer
  const certificates = await db.certificate.findMany({
    where: { userId: user.id, certificateUrl: { not: null } },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          org: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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

  if (certificates.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="text-muted-foreground mt-1">
            View and download your event attendance certificates.
          </p>
        </div>

        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">
              No certificates yet. Complete event attendance to earn certificates.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
        <p className="text-muted-foreground mt-1">
          {certificates.length} certificate{certificates.length !== 1 ? "s" : ""} earned
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((cert) => (
          <Card key={cert.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {cert.event.title}
                  </CardTitle>
                  {cert.event.org && (
                    <p className="text-sm text-muted-foreground mt-1">
                      📚 {cert.event.org.name}
                    </p>
                  )}
                </div>
                <Badge variant="default" className="bg-green-600 flex-shrink-0 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Issued
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(cert.issuedAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Code: {cert.verificationCode.slice(0, 8)}...
                </div>
              </div>

              {cert.issuedAt ? (
                <a
                  href={`/api/certificates/${cert.id}/download?code=${cert.verificationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  View Certificate
                </a>
              ) : (
                <Badge variant="secondary" className="w-fit">
                  Processing
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
