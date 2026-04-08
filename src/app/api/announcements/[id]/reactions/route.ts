import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true },
    });

    if (!user || !user.orgId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: announcementId } = await params;

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
      select: { orgId: true },
    });

    if (!announcement || announcement.orgId !== user.orgId) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const { emoji } = await req.json();
    if (!emoji) {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    // Toggle reaction (add if not exists, remove if exists)
    const existing = await db.announcementReaction.findUnique({
      where: { userId_announcementId_emoji: { userId: user.id, announcementId, emoji } },
    });

    if (existing) {
      await db.announcementReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed", emoji });
    }

    await db.announcementReaction.create({
      data: { emoji, userId: user.id, announcementId },
    });

    return NextResponse.json({ action: "added", emoji });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
