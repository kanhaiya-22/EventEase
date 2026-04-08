import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnouncementDetail } from "@/components/announcements/announcement-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Announcement",
};

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, orgId: true, role: true },
  });

  if (!user) redirect("/login");

  const { id } = await params;

  // Verify announcement exists and belongs to user's org
  const announcement = await db.announcement.findUnique({
    where: { id },
    select: { orgId: true },
  });

  if (!announcement || announcement.orgId !== user.orgId) {
    redirect("/announcements");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/announcements">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Announcement</h1>
      </div>

      <AnnouncementDetail
        announcementId={id}
        currentUserId={user.id}
        currentUserRole={user.role}
      />
    </div>
  );
}
