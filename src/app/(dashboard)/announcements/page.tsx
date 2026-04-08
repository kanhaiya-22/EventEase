import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnouncementList } from "@/components/announcements/announcement-list";
import { Megaphone } from "lucide-react";

export const metadata = {
  title: "Announcements",
};

export default async function AnnouncementsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, orgId: true, role: true },
  });

  if (!user) redirect("/login");

  if (!user.orgId) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Megaphone className="h-7 w-7" />
          <h1 className="text-2xl font-bold">Announcements</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            You need to be part of an organization to view announcements.
          </p>
        </div>
      </div>
    );
  }

  // Fetch org events for the form (only for organizers/admins)
  const orgEvents =
    user.role === "ORGANIZER" || user.role === "ADMIN"
      ? await db.event.findMany({
          where: { orgId: user.orgId },
          select: { id: true, title: true },
          orderBy: { startDate: "desc" },
          take: 50,
        })
      : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-7 w-7" />
        <h1 className="text-2xl font-bold">Announcements</h1>
      </div>

      <AnnouncementList
        currentUserId={user.id}
        currentUserRole={user.role}
        orgEvents={orgEvents}
      />
    </div>
  );
}
