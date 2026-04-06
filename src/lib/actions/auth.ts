"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

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

  // If registering as ORGANIZER, assign to default organization
  let orgId: string | undefined = undefined;
  if (role === "ORGANIZER") {
    // Get or create default organization
    let org = await db.organization.findFirst({
      where: { name: "IET Lucknow" },
    });

    if (!org) {
      org = await db.organization.create({
        data: {
          name: "IET Lucknow",
          slug: "iet-lucknow",
        },
      });
    }
    orgId = org.id;
  }

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as "STUDENT" | "ORGANIZER",
      department,
      year,
      orgId,
    },
  });

  return { success: true };
}
