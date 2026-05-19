import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
    return NextResponse.json({ contacts: [] });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim() ?? "";

  // Admins see all organizers (across colleges); organizers see all admins.
  const targetRole = user.role === "ADMIN" ? "ORGANIZER" : "ADMIN";

  const contacts = await db.user.findMany({
    where: {
      role: targetRole,
      isActive: true,
      isVerified: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ org: { name: "asc" } }, { name: "asc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      org: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ contacts });
}
