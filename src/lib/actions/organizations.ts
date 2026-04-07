"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from "@/lib/validators/organization";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Not authenticated" };
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }
  return { user };
}

export async function createOrganization(data: CreateOrganizationInput) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult;

  const parsed = createOrganizationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await db.organization.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { error: "An organization with this slug already exists" };
  }

  const organization = await db.organization.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      logo: parsed.data.logo || null,
    },
  });

  return { success: true, organization };
}

export async function updateOrganization(
  id: string,
  data: UpdateOrganizationInput
) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult;

  const parsed = updateOrganizationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const org = await db.organization.findUnique({ where: { id } });
  if (!org) {
    return { error: "Organization not found" };
  }

  if (parsed.data.slug && parsed.data.slug !== org.slug) {
    const existing = await db.organization.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return { error: "An organization with this slug already exists" };
    }
  }

  const updated = await db.organization.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.slug && { slug: parsed.data.slug }),
      ...(parsed.data.logo !== undefined && {
        logo: parsed.data.logo || null,
      }),
    },
  });

  return { success: true, organization: updated };
}

export async function deleteOrganization(id: string) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult;

  const org = await db.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true, events: true },
      },
    },
  });

  if (!org) {
    return { error: "Organization not found" };
  }

  if (org._count.users > 0 || org._count.events > 0) {
    return {
      error: `Cannot delete: this college has ${org._count.users} user(s) and ${org._count.events} event(s). Reassign them first.`,
    };
  }

  await db.organization.delete({ where: { id } });

  return { success: true };
}
