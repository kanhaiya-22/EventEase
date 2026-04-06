"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

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

    // Delete the registration (this will cascade delete attendance records)
    await db.registration.delete({
      where: { id: registrationId },
    });

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

    revalidatePath(`/organized-events/${eventId}/students`);

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
