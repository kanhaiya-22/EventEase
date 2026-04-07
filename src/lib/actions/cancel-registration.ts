"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendRegistrationCancellation } from "@/lib/email";

export async function cancelRegistration(registrationId: string) {
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

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
            org: { select: { name: true } },
          },
        },
      },
    });

    if (!registration) {
      return { success: false, error: "Registration not found" };
    }

    if (registration.userId !== user.id) {
      return { success: false, error: "Not authorized to cancel this registration" };
    }

    if (registration.status === "CANCELLED") {
      return { success: false, error: "Registration is already cancelled" };
    }

    // Soft cancel — preserve the record
    await db.registration.update({
      where: { id: registrationId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Delete attendance record if exists
    await db.attendance.deleteMany({
      where: { registrationId },
    });

    // Notify the event organizer
    try {
      await db.notification.create({
        data: {
          type: "GENERAL",
          title: "Registration Cancelled",
          message: `${user.name} cancelled their registration for "${registration.event.title}"`,
          userId: registration.event.organizerId,
          link: `/organized-events/${registration.event.id}/students`,
        },
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    // Send cancellation confirmation email
    try {
      await sendRegistrationCancellation(
        user.email,
        user.name || "User",
        registration.event.title,
        registration.event.org?.name
      );
    } catch (emailError) {
      console.error("Error sending cancellation email:", emailError);
    }

    // Revalidate all pages that display registration counts
    revalidatePath("/my-registrations");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/events");
    revalidatePath(`/events/${registration.event.id}`);
    revalidatePath("/organized-events");
    revalidatePath(`/organized-events/${registration.event.id}/students`);
    revalidatePath("/admin");
    revalidatePath("/admin/events");

    return { success: true, message: "Registration cancelled successfully" };
  } catch (error) {
    console.error("Error cancelling registration:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel registration",
    };
  }
}
