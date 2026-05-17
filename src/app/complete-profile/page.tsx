import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Logo } from "@/components/logo";
import { ProfileForm } from "@/components/profile/profile-form";
import { getAllMappedColleges } from "@/lib/college-domain-map";

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
      orgId: true,
      org: { select: { slug: true, name: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // A profile is fully complete only when an org is attached.
  if (user.profileCompleted && user.orgId) {
    redirect("/dashboard");
  }

  const needsOrgSelection = !user.orgId;
  const colleges = needsOrgSelection ? getAllMappedColleges() : [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Logo size="lg" />
          <h1 className="text-2xl font-semibold">Complete your profile</h1>
          <p className="text-sm text-muted-foreground">
            {needsOrgSelection
              ? "Pick your college and add a few details so we can personalize your EventEase experience."
              : "Just a few more details so we can personalize your EventEase experience."}
          </p>
        </div>

        <ProfileForm
          user={{
            ...user,
            organizationSlug: user.org?.slug ?? null,
            organizationName: user.org?.name ?? null,
          }}
          colleges={colleges}
          redirectTo="/dashboard"
          submitLabel="Finish & continue"
        />
      </div>
    </div>
  );
}
