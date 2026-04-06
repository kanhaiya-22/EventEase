import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/events
 * Retrieve all events with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "asc" },
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
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      db.event.count({ where }),
    ]);

    return NextResponse.json(
      {
        events,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { org: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has ORGANIZER or ADMIN role
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only organizers and admins can create events" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      tags,
      startDate,
      endDate,
      venue,
      capacity,
      posterUrl,
      documents,
    } = body;

    // Validation
    if (
      !title ||
      !description ||
      !category ||
      !startDate ||
      !endDate ||
      !venue ||
      !capacity
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, description, category, startDate, endDate, venue, capacity",
        },
        { status: 400 }
      );
    }

    // Validate capacity is a number
    const parsedCapacity = parseInt(String(capacity));
    if (isNaN(parsedCapacity) || parsedCapacity < 1) {
      return NextResponse.json(
        { error: "Capacity must be a valid number greater than 0" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format for startDate or endDate" },
        { status: 400 }
      );
    }

    if (endDateObj <= startDateObj) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .substring(0, 50);

    // Check if slug already exists
    const existingEvent = await db.event.findUnique({
      where: { slug },
    });

    if (existingEvent) {
      return NextResponse.json(
        {
          error:
            "An event with this title already exists. Please use a different title.",
        },
        { status: 409 }
      );
    }

    const event = await db.event.create({
      data: {
        title,
        slug,
        description,
        category: category as any,
        tags: tags || [],
        startDate: startDateObj,
        endDate: endDateObj,
        venue,
        capacity: parsedCapacity,
        posterUrl,
        customFields: JSON.stringify({ documents: documents || [] }),
        organizerId: user.id,
        orgId: user.orgId || undefined,
        status: "PUBLISHED",
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

    return NextResponse.json(
      { event, message: "Event created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to create event",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
