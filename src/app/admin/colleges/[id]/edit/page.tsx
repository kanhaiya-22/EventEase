import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CollegeForm } from "@/components/admin/college-form";
import Link from "next/link";

export default async function EditCollegePage({
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
  });

  if (!organization) {
    redirect("/admin/colleges");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/colleges/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to {organization.name}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">
          Edit College
        </h1>
        <p className="text-muted-foreground mt-1">
          Update details for {organization.name}
        </p>
      </div>

      <CollegeForm
        mode="edit"
        defaultValues={{
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
        }}
      />
    </div>
  );
}
