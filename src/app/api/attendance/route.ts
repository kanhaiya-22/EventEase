import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * POST /api/attendance/mark
 * Mark attendance for an event registration using QR code
 * Body: { qrCode: string, method?: "QR" | "MANUAL" }
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only organizers and admins can mark attendance
    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Only organizers can mark attendance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { qrCode, method = "QR" } = body;

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR code is required" },
        { status: 400 }
      );
    }

    // Find registration by QR code
    const registration = await db.registration.findUnique({
      where: { qrCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
        attendance: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Invalid QR code or registration not found" },
        { status: 404 }
      );
    }

    // Check if user is the organizer of this event
    if (user.role !== "ADMIN" && registration.event.organizerId !== user.id) {
      return NextResponse.json(
        { error: "You can only mark attendance for your own events" },
        { status: 403 }
      );
    }

    // Check if already marked
    if (registration.attendance) {
      return NextResponse.json(
        {
          error: "Attendance already marked for this registration",
          attendance: registration.attendance,
        },
        { status: 409 }
      );
    }

    // Create attendance record
    const attendance = await db.attendance.create({
      data: {
        registrationId: registration.id,
        method: method as "QR" | "MANUAL",
        checkedInAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Attendance marked successfully",
        attendance,
        registration: {
          id: registration.id,
          student: registration.user.name,
          email: registration.user.email,
          event: registration.event.title,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/verify?qrCode=xxx
 * Verify if a QR code exists and get registration details
 */
export async function GET(request: NextRequest) {
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Only organizers can verify attendance" },
        { status: 403 }
      );
    }

    const qrCode = request.nextUrl.searchParams.get("qrCode");

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR code is required" },
        { status: 400 }
      );
    }

    const registration = await db.registration.findUnique({
      where: { qrCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
        attendance: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Invalid QR code" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && registration.event.organizerId !== user.id) {
      return NextResponse.json(
        { error: "You can only view attendance for your own events" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        registration: {
          id: registration.id,
          qrCode: registration.qrCode,
          student: {
            id: registration.user.id,
            name: registration.user.name,
            email: registration.user.email,
            department: registration.user.department,
          },
          event: {
            id: registration.event.id,
            title: registration.event.title,
          },
          status: registration.status,
          registeredAt: registration.registeredAt,
          attended: !!registration.attendance,
          attendanceDetails: registration.attendance
            ? {
                checkedInAt: registration.attendance.checkedInAt,
                method: registration.attendance.method,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying attendance:", error);
    return NextResponse.json(
      { error: "Failed to verify attendance" },
      { status: 500 }
    );
  }
}
