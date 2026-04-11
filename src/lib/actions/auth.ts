"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { resolveOrgFromEmail } from "@/lib/resolve-org";

export async function checkOrganizerVerification(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { role: true, isVerified: true },
  });
  if (user?.role === "ORGANIZER" && !user.isVerified) {
    return { pending: true };
  }
  return { pending: false };
}

export async function registerUser(data: RegisterInput) {
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password, role, department, year } = parsed.data;

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Resolve organization from email domain (works for ALL roles)
  let orgId: string | undefined = undefined;
  const resolved = await resolveOrgFromEmail(email);
  if (resolved) {
    orgId = resolved.orgId;
  }

  const isOrganizer = role === "ORGANIZER";

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as "STUDENT" | "ORGANIZER",
      department,
      year,
      orgId,
      // Organizers start unverified until admin approves
      isVerified: !isOrganizer,
      profileCompleted: true,
    },
  });

  // Create organizer verification request and notify admins
  if (isOrganizer) {
    const { collegeName, designation, organizationWeb, reason } = parsed.data;

    await db.organizerRequest.create({
      data: {
        userId: user.id,
        collegeName: collegeName!,
        designation: designation!,
        organizationWeb: organizationWeb || null,
        reason: reason!,
      },
    });

    // Notify all admins about the new organizer request
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "ORGANIZER_REQUEST" as const,
          title: "New Organizer Request",
          message: `${name} has requested organizer access for ${collegeName}.`,
          link: "/admin/organizer-requests",
        })),
      });
    }
  }

  return { success: true };
}
