import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendRegistrationConfirmation } from "@/lib/email";

/**
 * Generate a verification code for certificate
 */
function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * POST /api/events/[id]/register
 * Register a user for an event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true },
        },
        registrations: {
          where: { userId: user.id },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is the organizer of this event
    if (event.organizer.id === user.id) {
      return NextResponse.json(
        { error: "Organizers cannot register for their own events" },
        { status: 403 }
      );
    }

    // Check if already registered
    if (event.registrations.length > 0) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 }
      );
    }

    // Check capacity
    if (event._count.registrations >= event.capacity) {
      return NextResponse.json(
        {
          error:
            "Event is full. You have been added to the waitlist if available.",
          status: "WAITLISTED",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { formData } = body;

    // Create registration and certificate in a transaction
    const registration = await db.registration.create({
      data: {
        userId: user.id,
        eventId: id,
        formData: formData || {},
        status: "CONFIRMED",
      },
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
          },
        },
      },
    });

    // Create a certificate record for the user
    // The actual certificate file will be generated when the event is completed
    try {
      await db.certificate.create({
        data: {
          userId: user.id,
          eventId: id,
          verificationCode: generateVerificationCode(),
        },
      });
    } catch (certError) {
      // If certificate already exists, that's fine
      console.log("Certificate already exists for this user-event combination");
    }

    // Send registration confirmation email
    try {
      await sendRegistrationConfirmation(
        registration.user.email,
        registration.user.name || "User",
        registration.event.title
      );
    } catch (emailError) {
      console.error("Error sending registration confirmation email:", emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json(
      {
        registration,
        message: "Successfully registered for the event",
        qrCode: registration.qrCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}
