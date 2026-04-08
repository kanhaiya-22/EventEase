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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: commentId } = await params;

    const comment = await db.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const { emoji } = await req.json();
    if (!emoji) {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    const existing = await db.commentReaction.findUnique({
      where: { userId_commentId_emoji: { userId: user.id, commentId, emoji } },
    });

    if (existing) {
      await db.commentReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed", emoji });
    }

    await db.commentReaction.create({
      data: { emoji, userId: user.id, commentId },
    });

    return NextResponse.json({ action: "added", emoji });
  } catch (error) {
    console.error("Error toggling comment reaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
