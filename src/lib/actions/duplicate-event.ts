"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export async function duplicateEvent(eventId: string) {
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

    const original = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!original) {
      return { success: false, error: "Event not found" };
    }

    if (original.organizerId !== user.id && user.role !== "ADMIN") {
      return { success: false, error: "Not authorized to duplicate this event" };
    }

    const timestamp = Date.now();
    const newSlug = `${original.slug}-copy-${timestamp}`;

    const newEvent = await db.event.create({
      data: {
        title: `Copy of ${original.title}`,
        slug: newSlug,
        description: original.description,
        category: original.category,
        tags: original.tags,
        startDate: original.startDate,
        endDate: original.endDate,
        venue: original.venue,
        capacity: original.capacity,
        posterUrl: original.posterUrl,
        documents: original.documents as Prisma.InputJsonValue,
        status: "DRAFT",
        customFields: original.customFields as Prisma.InputJsonValue,
        organizerId: user.id,
        orgId: original.orgId,
      },
    });

    revalidatePath("/organized-events");

    return {
      success: true,
      message: "Event duplicated as draft",
      eventId: newEvent.id,
    };
  } catch (error) {
    console.error("Error duplicating event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to duplicate event",
    };
  }
}
