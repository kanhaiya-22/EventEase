"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { profileSchema, type ProfileInput } from "@/lib/validators/profile";
import { getAllMappedColleges } from "@/lib/college-domain-map";

export async function updateProfile(data: ProfileInput) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized. Please login first." };
    }

    const validated = profileSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, department, year, phone, interests, organizationSlug } = validated.data;

    const existing = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true },
    });
    if (!existing) {
      return { success: false, error: "User not found." };
    }

    // Resolve org: existing user.orgId wins; otherwise honor a freshly-picked slug.
    let resolvedOrgId: string | null = existing.orgId;
    if (!resolvedOrgId && organizationSlug) {
      const college = getAllMappedColleges().find((c) => c.slug === organizationSlug);
      if (!college) {
        return { success: false, error: "Unknown college selection." };
      }
      const org = await db.organization.upsert({
        where: { slug: college.slug },
        create: {
          name: college.name,
          slug: college.slug,
          settings: JSON.stringify({ city: college.city, type: college.type }),
        },
        update: {},
      });
      resolvedOrgId = org.id;
    }

    // Profile is only complete once an organization is attached.
    if (!resolvedOrgId) {
      return {
        success: false,
        error: "Please select your college to complete your profile.",
      };
    }

    await db.user.update({
      where: { email: session.user.email },
      data: {
        name,
        department: department || null,
        year: year || null,
        phone: phone || null,
        interests,
        orgId: resolvedOrgId,
        profileCompleted: true,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}
