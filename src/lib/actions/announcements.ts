"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function togglePin(announcementId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, orgId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return { success: false, error: "Only organizers and admins can pin announcements" };
    }

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    if (announcement.orgId !== user.orgId) {
      return { success: false, error: "Forbidden" };
    }

    await db.announcement.update({
      where: { id: announcementId },
      data: { isPinned: !announcement.isPinned },
    });

    revalidatePath("/announcements");
    revalidatePath(`/announcements/${announcementId}`);
    return { success: true, isPinned: !announcement.isPinned };
  } catch (error) {
    console.error("Error toggling pin:", error);
    return { success: false, error: "Failed to toggle pin" };
  }
}
