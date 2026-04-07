import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { VerifyForm } from "@/components/certificates/verify-form";

export const metadata = {
  title: "Verify Certificate",
};

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Certificate</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Enter the verification code found on any EventEase certificate to confirm its authenticity.
          </p>
        </CardHeader>
        <CardContent>
          <VerifyForm />
        </CardContent>
      </Card>
    </div>
  );
}
