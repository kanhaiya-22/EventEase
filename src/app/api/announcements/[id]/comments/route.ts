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
      select: { id: true, orgId: true, name: true },
    });

    if (!user || !user.orgId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: announcementId } = await params;

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
      select: { id: true, orgId: true, authorId: true, title: true },
    });

    if (!announcement || announcement.orgId !== user.orgId) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content, parentId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    // Validate parentId if provided (must belong to same announcement)
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { announcementId: true },
      });
      if (!parentComment || parentComment.announcementId !== announcementId) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        announcementId,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    // Notify announcement author if someone else commented
    if (announcement.authorId !== user.id) {
      await db.notification.create({
        data: {
          type: "ANNOUNCEMENT_COMMENT",
          title: "New Comment",
          message: `${user.name} commented on: ${announcement.title}`,
          link: `/announcements/${announcementId}`,
          userId: announcement.authorId,
        },
      });
    }

    // Notify parent comment author if this is a reply
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (parentComment && parentComment.authorId !== user.id && parentComment.authorId !== announcement.authorId) {
        await db.notification.create({
          data: {
            type: "ANNOUNCEMENT_COMMENT",
            title: "New Reply",
            message: `${user.name} replied to your comment`,
            link: `/announcements/${announcementId}`,
            userId: parentComment.authorId,
          },
        });
      }
    }

    return NextResponse.json({ comment, message: "Comment posted" }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
