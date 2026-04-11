"use server";

import { db } from "@/lib/db";

export interface ImportEventInput {
  title: string;
  description: string;
  category: "TECHNICAL" | "CULTURAL" | "WORKSHOP" | "SEMINAR" | "HACKATHON" | "SPORTS" | "SOCIAL" | "OTHER";
  tags?: string[];
  startDate: Date | string;
  endDate: Date | string;
  venue: string;
  capacity: number;
  posterUrl?: string;
  organizerId: string;
  orgId?: string;
}

/**
 * Bulk import events from data array
 */
export async function bulkImportEvents(events: ImportEventInput[]) {
  try {
    const results = [];

    for (const eventData of events) {
      try {
        // Generate unique slug
        const baseSlug = eventData.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "")
          .substring(0, 50);

        let slug = baseSlug;
        let suffix = 1;
        while (await db.event.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${suffix}`;
          suffix++;
        }

        // Resolve orgId from organizer if not provided
        let orgId = eventData.orgId;
        if (!orgId) {
          const organizer = await db.user.findUnique({
            where: { id: eventData.organizerId },
            select: { orgId: true },
          });
          orgId = organizer?.orgId ?? undefined;
        }

        const event = await db.event.create({
          data: {
            title: eventData.title,
            slug,
            description: eventData.description,
            category: eventData.category,
            tags: eventData.tags || [],
            startDate: new Date(eventData.startDate),
            endDate: new Date(eventData.endDate),
            venue: eventData.venue,
            capacity: eventData.capacity,
            posterUrl: eventData.posterUrl,
            organizerId: eventData.organizerId,
            orgId: orgId || undefined,
            status: "PUBLISHED",
          },
        });

        results.push({
          title: eventData.title,
          status: "created",
          id: event.id,
        });
      } catch (error) {
        results.push({
          title: eventData.title,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      totalProcessed: events.length,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import events",
    };
  }
}

/**
 * Get or create default admin user
 */
export async function getOrCreateDefaultOrganizer() {
  try {
    let user = await db.user.findFirst({
      where: {
        role: "ORGANIZER",
      },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          name: "IET Lucknow",
          email: "admin@ietlucknow.ac.in",
          role: "ORGANIZER",
          department: "Administration",
        },
      });
    }

    return user;
  } catch (error) {
    throw new Error(`Failed to get or create organizer: ${error}`);
  }
}

/**
 * Create an event from the organizer dashboard
 */
export async function createEvent(formData: {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  venue: string;
  capacity: number;
  posterUrl?: string;
  documents?: Array<{ url: string; name: string }>;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED";
  waitlistEnabled?: boolean;
}) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized. Please login first.",
      };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { org: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only organizers and admins can create events",
      };
    }

    // Validate capacity
    const parsedCapacity = parseInt(String(formData.capacity));
    if (isNaN(parsedCapacity) || parsedCapacity < 1) {
      return {
        success: false,
        error: "Capacity must be a valid number greater than 0",
      };
    }

    // Validate dates
    const startDateObj = new Date(formData.startDate);
    const endDateObj = new Date(formData.endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return {
        success: false,
        error: "Invalid date format for startDate or endDate",
      };
    }

    if (endDateObj <= startDateObj) {
      return {
        success: false,
        error: "End date must be after start date",
      };
    }

    // Generate unique slug
    const baseSlug = formData.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .substring(0, 50);

    let slug = baseSlug;
    let suffix = 1;
    while (await db.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const initialStatus = formData.status === "DRAFT" ? "DRAFT" : "PUBLISHED";

    const event = await db.event.create({
      data: {
        title: formData.title,
        slug,
        description: formData.description,
        category: formData.category as any,
        tags: formData.tags || [],
        startDate: startDateObj,
        endDate: endDateObj,
        venue: formData.venue,
        capacity: parsedCapacity,
        waitlistEnabled: formData.waitlistEnabled !== false,
        posterUrl: formData.posterUrl,
        customFields: JSON.stringify({ documents: formData.documents || [] }),
        organizerId: user.id,
        orgId: user.orgId || undefined,
        status: initialStatus,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return {
      success: true,
      event,
      message: "Event created successfully",
    };
  } catch (error) {
    console.error("Error creating event:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: "Failed to create event",
      details: errorMessage,
    };
  }
}
