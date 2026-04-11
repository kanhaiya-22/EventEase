"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendEmail, sendRegistrationConfirmation } from "@/lib/email";
import { promoteFromWaitlist } from "@/lib/waitlist";

/**
 * Delete a registration from an event
 * Only event organizers can delete registrations
 */
export async function deleteRegistration(registrationId: string, eventId: string) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized. Please login first.",
      };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get the event and verify ownership
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Verify user is the organizer or admin
    if (event.organizerId !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "You are not authorized to delete registrations for this event",
      };
    }

    // Get registration to verify it belongs to this event
    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        eventId: true,
        userId: true,
        status: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!registration) {
      return {
        success: false,
        error: "Registration not found",
      };
    }

    if (registration.eventId !== eventId) {
      return {
        success: false,
        error: "Registration does not belong to this event",
      };
    }

    const wasConfirmed = registration.status === "CONFIRMED";

    // Delete the registration (this will cascade delete attendance records)
    await db.registration.delete({
      where: { id: registrationId },
    });

    // If a confirmed seat freed up, promote the next waitlisted user.
    let promoted: Awaited<ReturnType<typeof promoteFromWaitlist>> = null;
    if (wasConfirmed) {
      try {
        promoted = await promoteFromWaitlist(eventId);
      } catch (promoteErr) {
        console.error("Error promoting from waitlist:", promoteErr);
      }
    }

    if (promoted) {
      try {
        await db.notification.create({
          data: {
            type: "REGISTRATION_CONFIRMED",
            title: "You're off the waitlist!",
            message: `A spot opened up for "${promoted.event.title}" — your seat is now confirmed.`,
            userId: promoted.userId,
            link: "/my-registrations",
          },
        });

        await sendRegistrationConfirmation(
          promoted.user.email,
          promoted.user.name || "User",
          promoted.event.title,
          {
            startDate: promoted.event.startDate,
            endDate: promoted.event.endDate,
            venue: promoted.event.venue,
            category: promoted.event.category,
          },
          promoted.event.org?.name,
          { wasPromoted: true }
        );
      } catch (notifErr) {
        console.error("Error notifying promoted user:", notifErr);
      }
    }

    // Create notification for the student
    try {
      await db.notification.create({
        data: {
          type: "GENERAL",
          title: "Registration Cancelled",
          message: `Your registration for the event has been cancelled by the organizer`,
          userId: registration.userId,
          link: "/my-registrations",
        },
      });

      // Send email notification
      await sendEmail({
        to: registration.user.email,
        subject: "Event Registration Cancelled",
        html: `
          <h2>Registration Cancelled</h2>
          <p>Hello ${registration.user.name},</p>
          <p>Your registration for an event has been cancelled by the organizer.</p>
          <p>If you have any questions, please contact the event organizer.</p>
        `,
      });
    } catch (notifError) {
      console.error("Error creating notification or sending email:", notifError);
    }

    // Revalidate all pages that display registration counts
    revalidatePath(`/organized-events/${eventId}/students`);
    revalidatePath("/organized-events");
    revalidatePath("/my-registrations");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/events");

    return {
      success: true,
      message: `Registration for ${registration.user.name} has been deleted`,
    };
  } catch (error) {
    console.error("Error deleting registration:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete registration",
    };
  }
}
