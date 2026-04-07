import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Award, Calendar, User, Building } from "lucide-react";

export const metadata = {
  title: "Verify Certificate",
};

interface VerifyPageProps {
  params: Promise<{ code: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { code } = await params;

  const certificate = await db.certificate.findUnique({
    where: { verificationCode: code },
    include: {
      user: {
        select: { name: true, email: true, department: true },
      },
      event: {
        select: {
          title: true,
          startDate: true,
          endDate: true,
          venue: true,
          category: true,
          org: { select: { name: true } },
        },
      },
    },
  });

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Certificate Not Found</h2>
            <p className="text-muted-foreground">
              The verification code <code className="bg-muted px-2 py-1 rounded text-sm">{code}</code> does not match any issued certificate.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Please check the code and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Certificate Verified</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            This certificate is authentic and has been issued by EventEase.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Issued to</p>
                <p className="font-semibold">{certificate.user.name}</p>
                {certificate.user.department && (
                  <p className="text-sm text-muted-foreground">{certificate.user.department}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Event</p>
                <p className="font-semibold">{certificate.event.title}</p>
                <Badge variant="outline" className="mt-1">{certificate.event.category}</Badge>
              </div>
            </div>

            {certificate.event.org && (
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-semibold">{certificate.event.org.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Event Date</p>
                <p className="font-semibold">
                  {new Date(certificate.event.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Issued on</span>
              <span>
                {new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">Verification Code</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">{certificate.verificationCode}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
