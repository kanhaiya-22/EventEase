import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ietLucknowEvents } from "@/lib/data/iet-events";

/**
 * POST /api/seed
 * Seed the database with IET Lucknow events
 * WARNING: This should only be used in development!
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Seeding is not allowed in production" },
        { status: 403 }
      );
    }

    // Get or create organization
    let organization = await db.organization.findUnique({
      where: { slug: "iet-lucknow" },
    });

    if (!organization) {
      organization = await db.organization.create({
        data: {
          name: "IET Lucknow",
          slug: "iet-lucknow",
        },
      });
    }

    // Get or create default organizer
    let organizer = await db.user.findFirst({
      where: {
        role: "ORGANIZER",
        email: "admin@ietlucknow.ac.in",
      },
    });

    if (!organizer) {
      organizer = await db.user.create({
        data: {
          name: "IET Lucknow",
          email: "admin@ietlucknow.ac.in",
          role: "ORGANIZER",
          department: "Administration",
          orgId: organization.id,
        },
      });
    }

    const results = [];
    let createdCount = 0;
    let skippedCount = 0;

    for (const eventData of ietLucknowEvents) {
      try {
        // Generate slug
        const slug = eventData.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "")
          .substring(0, 50);

        // Check if slug exists
        const existingEvent = await db.event.findUnique({
          where: { slug },
        });

        if (existingEvent) {
          skippedCount++;
          results.push({
            title: eventData.title,
            status: "skipped",
            reason: "Event with similar slug already exists",
          });
          continue;
        }

        const event = await db.event.create({
          data: {
            title: eventData.title,
            slug,
            description: eventData.description,
            category: eventData.category as any,
            tags: eventData.tags || [],
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            venue: eventData.venue,
            capacity: eventData.capacity,
            posterUrl: eventData.posterUrl,
            organizerId: organizer.id,
            orgId: organization.id,
            status: "PUBLISHED",
          },
        });

        createdCount++;
        results.push({
          title: eventData.title,
          status: "created",
          id: event.id,
          organization: organization.name,
        });
      } catch (error) {
        results.push({
          title: eventData.title,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        totalEvents: ietLucknowEvents.length,
        created: createdCount,
        skipped: skippedCount,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        organizer: {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email,
        },
        results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      {
        error: "Failed to seed database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed
 * Get seeding status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Seeding info is not available in production" },
        { status: 403 }
      );
    }

    const totalEvents = await db.event.count();
    const organizerCount = await db.user.count({
      where: { role: "ORGANIZER" },
    });
    const organizationCount = await db.organization.count();
    const eventsByOrg = await db.event.groupBy({
      by: ["orgId"],
      _count: true,
    });
    const categoryStats = await db.event.groupBy({
      by: ["category"],
      _count: true,
    });

    return NextResponse.json(
      {
        status: "Database seeding status",
        totalEventsInDB: totalEvents,
        totalEventsToImport: ietLucknowEvents.length,
        organizationCount,
        organizerCount,
        eventsByOrganization: eventsByOrg.length,
        categoryStats: categoryStats.map((stat) => ({
          category: stat.category,
          count: stat._count,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting seed status:", error);
    return NextResponse.json(
      { error: "Failed to get seed status" },
      { status: 500 }
    );
  }
}
