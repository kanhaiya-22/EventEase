import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { markConversationRead } from "@/lib/actions/messages";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const conversation = await db.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      userAId: true,
      userBId: true,
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
    },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  if (conversation.userAId !== user.id && conversation.userBId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
    },
  });

  const other =
    conversation.userAId === user.id ? conversation.userB : conversation.userA;

  return NextResponse.json({
    conversation: { id: conversation.id, other },
    messages: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      isMine: m.senderId === user.id,
    })),
  });
}

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const result = await markConversationRead(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data);
}
