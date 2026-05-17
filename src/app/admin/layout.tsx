import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { org: { select: { name: true, logo: true } } },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar org={user.org ?? null} />
      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
