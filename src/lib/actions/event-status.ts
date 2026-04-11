"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { EventStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<string, EventStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PENDING: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["ONGOING", "CANCELLED"],
  ONGOING: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["DRAFT"],
  ARCHIVED: ["PUBLISHED"],
};

export async function updateEventStatus(eventId: string, newStatus: EventStatus) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: "CONFIRMED" },
          select: { userId: true },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.organizerId !== user.id && user.role !== "ADMIN") {
      return { success: false, error: "Not authorized to modify this event" };
    }

    const allowed = VALID_TRANSITIONS[event.status] || [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${event.status} to ${newStatus}`,
      };
    }

    await db.event.update({
      where: { id: eventId },
      data: { status: newStatus },
    });

    // Notify registered students on cancellation or completion
    if (newStatus === "CANCELLED" || newStatus === "COMPLETED") {
      const notifType = newStatus === "CANCELLED" ? "EVENT_CANCELLED" as const : "GENERAL" as const;
      const title = newStatus === "CANCELLED" ? "Event Cancelled" : "Event Completed";
      const message =
        newStatus === "CANCELLED"
          ? `"${event.title}" has been cancelled by the organizer.`
          : `"${event.title}" has been marked as completed.`;

      const notifications = event.registrations.map((reg) => ({
        type: notifType,
        title,
        message,
        userId: reg.userId,
        link: `/events/${eventId}`,
      }));

      if (notifications.length > 0) {
        await db.notification.createMany({ data: notifications });
      }
    }

    revalidatePath("/organized-events");

    return { success: true, message: `Event status updated to ${newStatus}` };
  } catch (error) {
    console.error("Error updating event status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

