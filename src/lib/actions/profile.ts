"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { profileSchema, type ProfileInput } from "@/lib/validators/profile";

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

    const { name, department, year, phone, interests } = validated.data;

    await db.user.update({
      where: { email: session.user.email },
      data: {
        name,
        department: department || null,
        year: year || null,
        phone: phone || null,
        interests,
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
