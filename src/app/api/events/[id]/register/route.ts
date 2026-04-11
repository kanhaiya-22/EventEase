import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  sendRegistrationConfirmation,
  sendWaitlistJoinedEmail,
} from "@/lib/email";
import { Prisma } from "@prisma/client";

/**
 * POST /api/events/[id]/register
 * Register a user for an event. If the event is full and waitlist is enabled,
 * the client may pass { joinWaitlist: true } to be added to the waitlist.
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
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const formData = body?.formData ?? {};
    const joinWaitlist: boolean = body?.joinWaitlist === true;

    // Pre-flight (read-only) checks outside the tx so we can return clean errors.
    const event = await db.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        capacity: true,
        waitlistEnabled: true,
        startDate: true,
        endDate: true,
        venue: true,
        category: true,
        organizerId: true,
        org: { select: { name: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizerId === user.id) {
      return NextResponse.json(
        { error: "Organizers cannot register for their own events" },
        { status: 403 }
      );
    }

    // Atomic capacity check + create / reactivate. Serializable isolation
    // prevents two concurrent registrations from both passing the count
    // check and exceeding capacity.
    type TxResult =
      | { kind: "duplicate" }
      | { kind: "needsWaitlistConfirm"; canWaitlist: boolean }
      | {
          kind: "ok";
          status: "CONFIRMED" | "WAITLISTED";
          registration: {
            id: string;
            qrCode: string;
            status: "CONFIRMED" | "WAITLISTED";
          };
          waitlistPosition?: number;
        };

    const result = await db.$transaction<TxResult>(
      async (tx) => {
        const existing = await tx.registration.findUnique({
          where: { userId_eventId: { userId: user.id, eventId: id } },
        });

        if (existing && existing.status !== "CANCELLED") {
          return { kind: "duplicate" };
        }

        const confirmedCount = await tx.registration.count({
          where: { eventId: id, status: "CONFIRMED" },
        });
        const isFull = confirmedCount >= event.capacity;

        if (isFull && !joinWaitlist) {
          return {
            kind: "needsWaitlistConfirm",
            canWaitlist: event.waitlistEnabled,
          };
        }

        if (isFull && joinWaitlist && !event.waitlistEnabled) {
          return {
            kind: "needsWaitlistConfirm",
            canWaitlist: false,
          };
        }

        const targetStatus: "CONFIRMED" | "WAITLISTED" = isFull
          ? "WAITLISTED"
          : "CONFIRMED";

        const saved = existing
          ? await tx.registration.update({
              where: { id: existing.id },
              data: {
                status: targetStatus,
                formData: formData || existing.formData || {},
                registeredAt: new Date(),
                cancelledAt: null,
              },
              select: { id: true, qrCode: true, status: true },
            })
          : await tx.registration.create({
              data: {
                userId: user.id,
                eventId: id,
                formData: formData || {},
                status: targetStatus,
              },
              select: { id: true, qrCode: true, status: true },
            });

        let waitlistPosition: number | undefined;
        if (targetStatus === "WAITLISTED") {
          const ahead = await tx.registration.count({
            where: {
              eventId: id,
              status: "WAITLISTED",
              id: { not: saved.id },
            },
          });
          waitlistPosition = ahead + 1;
        }

        return {
          kind: "ok",
          status: targetStatus,
          registration: {
            id: saved.id,
            qrCode: saved.qrCode,
            status: saved.status as "CONFIRMED" | "WAITLISTED",
          },
          waitlistPosition,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (result.kind === "duplicate") {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 }
      );
    }

    if (result.kind === "needsWaitlistConfirm") {
      return NextResponse.json(
        {
          error: result.canWaitlist
            ? "Event is full. You can join the waitlist."
            : "Event is full and the waitlist is closed.",
          full: true,
          canWaitlist: result.canWaitlist,
        },
        { status: 409 }
      );
    }

    // Side effects (email + notification) happen outside the transaction.
    if (result.status === "CONFIRMED") {
      try {
        await sendRegistrationConfirmation(
          user.email,
          user.name || "User",
          event.title,
          {
            startDate: event.startDate,
            endDate: event.endDate,
            venue: event.venue,
            category: event.category,
          },
          event.org?.name
        );
      } catch (err) {
        console.error("Error sending registration email:", err);
      }

      try {
        await db.notification.create({
          data: {
            type: "REGISTRATION_CONFIRMED",
            title: "Registration confirmed",
            message: `You're confirmed for "${event.title}".`,
            userId: user.id,
            link: "/my-registrations",
          },
        });
      } catch (err) {
        console.error("Error creating notification:", err);
      }

      return NextResponse.json(
        {
          registration: result.registration,
          status: "CONFIRMED",
          message: "Successfully registered for the event",
          qrCode: result.registration.qrCode,
        },
        { status: 201 }
      );
    }

    // WAITLISTED branch
    try {
      await sendWaitlistJoinedEmail(
        user.email,
        user.name || "User",
        event.title,
        result.waitlistPosition ?? 1,
        event.org?.name
      );
    } catch (err) {
      console.error("Error sending waitlist email:", err);
    }

    try {
      await db.notification.create({
        data: {
          type: "REGISTRATION_WAITLISTED",
          title: "Added to waitlist",
          message: `You're #${result.waitlistPosition ?? 1} on the waitlist for "${event.title}". We'll email you if a spot opens.`,
          userId: user.id,
          link: "/my-registrations",
        },
      });
    } catch (err) {
      console.error("Error creating notification:", err);
    }

    return NextResponse.json(
      {
        registration: result.registration,
        status: "WAITLISTED",
        waitlistPosition: result.waitlistPosition ?? 1,
        message: "You've been added to the waitlist",
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
