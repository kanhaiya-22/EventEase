import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Logo } from "@/components/logo";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function CompleteProfilePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      email: true,
      role: true,
      department: true,
      year: true,
      phone: true,
      interests: true,
      profileCompleted: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.profileCompleted) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Logo size="lg" />
          <h1 className="text-2xl font-semibold">Complete your profile</h1>
          <p className="text-sm text-muted-foreground">
            Welcome! Just a few more details so we can personalize your EventEase experience.
          </p>
        </div>

        <ProfileForm user={user} redirectTo="/dashboard" submitLabel="Finish & continue" />
      </div>
    </div>
  );
}
