import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const announcement = await db.announcement.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        org: { select: { id: true, name: true, logo: true } },
        event: { select: { id: true, title: true, slug: true } },
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true } },
            reactions: true,
            replies: {
              include: {
                author: { select: { id: true, name: true, avatarUrl: true, role: true } },
                reactions: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    if (announcement.orgId !== user.orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get reaction counts
    const reactionCounts = await db.announcementReaction.groupBy({
      by: ["emoji"],
      where: { announcementId: id },
      _count: { emoji: true },
    });

    const userReactions = await db.announcementReaction.findMany({
      where: { announcementId: id, userId: user.id },
      select: { emoji: true },
    });

    // Process comment reactions
    const processComments = async (comments: typeof announcement.comments) => {
      return Promise.all(
        comments.map(async (comment) => {
          const commentReactionCounts = await db.commentReaction.groupBy({
            by: ["emoji"],
            where: { commentId: comment.id },
            _count: { emoji: true },
          });
          const userCommentReactions = await db.commentReaction.findMany({
            where: { commentId: comment.id, userId: user.id },
            select: { emoji: true },
          });

          const processedReplies = await Promise.all(
            comment.replies.map(async (reply) => {
              const replyReactionCounts = await db.commentReaction.groupBy({
                by: ["emoji"],
                where: { commentId: reply.id },
                _count: { emoji: true },
              });
              const userReplyReactions = await db.commentReaction.findMany({
                where: { commentId: reply.id, userId: user.id },
                select: { emoji: true },
              });
              return {
                ...reply,
                reactionCounts: replyReactionCounts.map((r) => ({ emoji: r.emoji, count: r._count.emoji })),
                userReactions: userReplyReactions.map((r) => r.emoji),
              };
            })
          );

          return {
            ...comment,
            reactionCounts: commentReactionCounts.map((r) => ({ emoji: r.emoji, count: r._count.emoji })),
            userReactions: userCommentReactions.map((r) => r.emoji),
            replies: processedReplies,
          };
        })
      );
    };

    const processedComments = await processComments(announcement.comments);

    return NextResponse.json({
      ...announcement,
      comments: processedComments,
      reactionCounts: reactionCounts.map((r) => ({ emoji: r.emoji, count: r._count.emoji })),
      userReactions: userReactions.map((r) => r.emoji),
    });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const announcement = await db.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    if (announcement.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, isPinned, eventId } = body;

    const updated = await db.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(isPinned !== undefined && { isPinned }),
        ...(eventId !== undefined && { eventId: eventId || null }),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        org: { select: { id: true, name: true, logo: true } },
        event: { select: { id: true, title: true, slug: true } },
      },
    });

    return NextResponse.json({ announcement: updated, message: "Announcement updated" });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const announcement = await db.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    if (announcement.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.announcement.delete({ where: { id } });

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
