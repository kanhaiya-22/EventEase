import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessagesShell } from "@/components/messages/messages-shell";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, name: true, avatarUrl: true },
  });
  if (!user) redirect("/login");

  if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
    redirect("/dashboard");
  }

  return (
    <div className="-m-6">
      <MessagesShell currentUser={user} />
    </div>
  );
}
