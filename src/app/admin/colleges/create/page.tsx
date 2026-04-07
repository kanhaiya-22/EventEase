import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CollegeForm } from "@/components/admin/college-form";
import Link from "next/link";

export default async function CreateCollegePage() {
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/colleges"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to Colleges
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">
          Add New College
        </h1>
        <p className="text-muted-foreground mt-1">
          Create a new college/organization on the platform
        </p>
      </div>

      <CollegeForm mode="create" />
    </div>
  );
}
