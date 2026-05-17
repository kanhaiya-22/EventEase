import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: "User not found or no organization" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where: { orgId: user.orgId },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true, role: true } },
          org: { select: { id: true, name: true, logo: true } },
          event: { select: { id: true, title: true, slug: true } },
          _count: { select: { comments: true, reactions: true } },
          reactions: {
            where: { userId: user.id },
            select: { emoji: true },
          },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      db.announcement.count({ where: { orgId: user.orgId } }),
    ]);

    // Get aggregated reaction counts per announcement
    const announcementsWithReactions = await Promise.all(
      announcements.map(async (a) => {
        const reactionCounts = await db.announcementReaction.groupBy({
          by: ["emoji"],
          where: { announcementId: a.id },
          _count: { emoji: true },
        });
        return {
          ...a,
          reactionCounts: reactionCounts.map((r) => ({ emoji: r.emoji, count: r._count.emoji })),
          userReactions: a.reactions.map((r) => r.emoji),
        };
      })
    );

    return NextResponse.json({
      announcements: announcementsWithReactions,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true, role: true, name: true },
    });

    if (!user || !user.orgId) {
      return NextResponse.json({ error: "User not found or no organization" }, { status: 404 });
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only organizers and admins can post announcements" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, eventId, isPinned } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Validate eventId if provided
    if (eventId) {
      const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, orgId: true } });
      if (!event || event.orgId !== user.orgId) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
    }

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isPinned: isPinned || false,
        authorId: user.id,
        orgId: user.orgId,
        eventId: eventId || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        org: { select: { id: true, name: true, logo: true } },
        event: { select: { id: true, title: true, slug: true } },
      },
    });

    // Notify all org members (except author)
    const orgMembers = await db.user.findMany({
      where: { orgId: user.orgId, id: { not: user.id } },
      select: { id: true },
    });

    if (orgMembers.length > 0) {
      await db.notification.createMany({
        data: orgMembers.map((member) => ({
          type: "ANNOUNCEMENT_POSTED" as const,
          title: "New Announcement",
          message: `${user.name} posted: ${title.trim()}`,
          link: `/announcements/${announcement.id}`,
          userId: member.id,
        })),
      });
    }

    return NextResponse.json({ announcement, message: "Announcement posted" }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
