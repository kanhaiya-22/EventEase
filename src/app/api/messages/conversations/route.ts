import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startConversation } from "@/lib/actions/messages";
import { startConversationSchema } from "@/lib/validators/messages";

export const runtime = "nodejs";

export async function GET() {
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
  if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
    return NextResponse.json({ conversations: [] });
  }

  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ userAId: user.id }, { userBId: user.id }],
    },
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      lastMessageAt: true,
      userAId: true,
      userBId: true,
      lastReadAtA: true,
      lastReadAtB: true,
      userA: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          org: { select: { id: true, name: true } },
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          org: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
    },
  });

  const shaped = await Promise.all(
    conversations.map(async (c) => {
      const isA = c.userAId === user.id;
      const other = isA ? c.userB : c.userA;
      const lastReadAt = isA ? c.lastReadAtA : c.lastReadAtB;

      const unreadCount = await db.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: user.id },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });

      return {
        id: c.id,
        lastMessageAt: c.lastMessageAt.toISOString(),
        other,
        lastMessage: c.messages[0]
          ? {
              id: c.messages[0].id,
              content: c.messages[0].content,
              createdAt: c.messages[0].createdAt.toISOString(),
              senderId: c.messages[0].senderId,
              isMine: c.messages[0].senderId === user.id,
            }
          : null,
        unreadCount,
      };
    })
  );

  return NextResponse.json({ conversations: shaped });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const result = await startConversation(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data, { status: 201 });
}
