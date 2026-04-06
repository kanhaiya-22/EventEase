import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * POST /api/attendance/self-checkin
 * Allow students to mark themselves as present using their QR code
 * Body: { qrCode: string }
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

    const body = await request.json();
    const { qrCode } = body;

    if (!qrCode || typeof qrCode !== "string") {
      return NextResponse.json(
        { error: "QR code is required and must be a string" },
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
            startDate: true,
            endDate: true,
          },
        },
        attendance: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Invalid QR code. Registration not found." },
        { status: 404 }
      );
    }

    // Verify the QR code belongs to the current user
    if (registration.userId !== user.id) {
      return NextResponse.json(
        {
          error: "This QR code does not belong to you. You can only check in with your own QR code.",
        },
        { status: 403 }
      );
    }

    // Check if registration status is valid
    if (registration.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This registration has been cancelled." },
        { status: 400 }
      );
    }

    // Check if already attended
    if (registration.attendance) {
      return NextResponse.json(
        {
          error: "You have already checked in for this event",
          attendance: registration.attendance,
          checkedInAt: registration.attendance.checkedInAt.toISOString(),
        },
        { status: 409 }
      );
    }

    // Check if event has started (optional: allow check-in only if event has started)
    const now = new Date();
    const eventStart = new Date(registration.event.startDate);
    const eventEnd = new Date(registration.event.endDate);

    // Allow check-in 15 minutes before event start
    const checkInStartTime = new Date(eventStart.getTime() - 15 * 60 * 1000);

    if (now < checkInStartTime) {
      return NextResponse.json(
        {
          error: `Event check-in not yet available. Check-in opens at ${checkInStartTime.toLocaleTimeString()}`,
          eventStartsAt: eventStart.toISOString(),
          checkInOpensAt: checkInStartTime.toISOString(),
        },
        { status: 400 }
      );
    }

    // Create attendance record
    const attendance = await db.attendance.create({
      data: {
        registrationId: registration.id,
        method: "QR",
        checkedInAt: now,
      },
    });

    return NextResponse.json(
      {
        message: "Check-in successful! You are marked as present.",
        attendance: {
          id: attendance.id,
          checkedInAt: attendance.checkedInAt.toISOString(),
          method: attendance.method,
        },
        event: {
          title: registration.event.title,
          startDate: registration.event.startDate.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during self check-in:", error);
    return NextResponse.json(
      { error: "Failed to process check-in. Please try again." },
      { status: 500 }
    );
  }
}
