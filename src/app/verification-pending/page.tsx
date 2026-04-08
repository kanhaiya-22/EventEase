import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail, ArrowLeft } from "lucide-react";

export default function VerificationPendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Logo size="lg" />
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Verification Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your organizer account request has been submitted successfully and is currently under review by our admin team.
            </p>

            <div className="rounded-lg bg-muted p-4 text-left space-y-2">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">
                  You will receive an <strong>email notification</strong> once your account has been verified.
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Once verified, you can log in using the same credentials you used during sign-up and access all organizer features.
            </p>

            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
