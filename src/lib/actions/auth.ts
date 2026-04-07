"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { resolveOrgFromEmail } from "@/lib/resolve-org";

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
