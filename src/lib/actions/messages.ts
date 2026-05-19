"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishToUser } from "@/lib/messages/pubsub";
import { sendMessageSchema, startConversationSchema } from "@/lib/validators/messages";
import type { Role } from "@prisma/client";

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function isMessageablePair(current: Role, other: Role): boolean {
  return (
    (current === "ADMIN" && other === "ORGANIZER") ||
    (current === "ORGANIZER" && other === "ADMIN")
  );
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, role: true, orgId: true },
  });
}

export async function getOrCreateConversation(
  otherUserId: string
): Promise<ActionResult<{ conversationId: string }>> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Unauthorized" };
  if (current.id === otherUserId) {
    return { ok: false, error: "Cannot message yourself" };
  }

  const other = await db.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, role: true, isActive: true },
  });
  if (!other || !other.isActive) {
    return { ok: false, error: "Recipient not found" };
  }
  if (!isMessageablePair(current.role, other.role)) {
    return { ok: false, error: "You can only message between admin and organizer" };
  }

  const [userAId, userBId] = canonicalPair(current.id, other.id);

  const conversation = await db.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
    select: { id: true },
  });

  return { ok: true, data: { conversationId: conversation.id } };
}

export async function sendMessage(input: {
  conversationId: string;
  content: string;
}): Promise<ActionResult<{ messageId: string }>> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Unauthorized" };

  const conversation = await db.conversation.findUnique({
    where: { id: parsed.data.conversationId },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      userA: { select: { id: true, role: true, name: true } },
      userB: { select: { id: true, role: true, name: true } },
    },
  });
  if (!conversation) return { ok: false, error: "Conversation not found" };

  if (conversation.userAId !== current.id && conversation.userBId !== current.id) {
    return { ok: false, error: "Not a participant" };
  }

  const recipient =
    conversation.userAId === current.id ? conversation.userB : conversation.userA;

  if (!isMessageablePair(current.role, recipient.role)) {
    return { ok: false, error: "Messaging not allowed for this pair" };
  }

  const now = new Date();
  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId: current.id,
        content: parsed.data.content,
      },
    });
    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: now,
        // Sender's own read pointer advances automatically so they don't see their own message as unread.
        ...(conversation.userAId === current.id
          ? { lastReadAtA: now }
          : { lastReadAtB: now }),
      },
    });
    return created;
  });

  const notification = await db.notification.create({
    data: {
      userId: recipient.id,
      type: "MESSAGE_RECEIVED",
      title: `New message from ${current.name}`,
      message:
        parsed.data.content.length > 120
          ? parsed.data.content.slice(0, 117) + "..."
          : parsed.data.content,
      link: `/messages?c=${conversation.id}`,
    },
  });

  publishToUser(recipient.id, {
    type: "message:new",
    conversationId: conversation.id,
    payload: {
      id: message.id,
      conversationId: conversation.id,
      senderId: current.id,
      senderName: current.name,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      notificationId: notification.id,
    },
  });

  publishToUser(current.id, {
    type: "message:new",
    conversationId: conversation.id,
    payload: {
      id: message.id,
      conversationId: conversation.id,
      senderId: current.id,
      senderName: current.name,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    },
  });

  return { ok: true, data: { messageId: message.id } };
}

export async function startConversation(input: {
  recipientId: string;
  content: string;
}): Promise<ActionResult<{ conversationId: string; messageId: string }>> {
  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const conv = await getOrCreateConversation(parsed.data.recipientId);
  if (!conv.ok) return conv;

  const send = await sendMessage({
    conversationId: conv.data.conversationId,
    content: parsed.data.content,
  });
  if (!send.ok) return send;

  revalidatePath("/messages");
  return {
    ok: true,
    data: { conversationId: conv.data.conversationId, messageId: send.data.messageId },
  };
}

export async function markConversationRead(
  conversationId: string
): Promise<ActionResult<{ unreadCount: number }>> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Unauthorized" };

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!conversation) return { ok: false, error: "Conversation not found" };

  const isA = conversation.userAId === current.id;
  const isB = conversation.userBId === current.id;
  if (!isA && !isB) return { ok: false, error: "Not a participant" };

  const now = new Date();
  await db.conversation.update({
    where: { id: conversationId },
    data: isA ? { lastReadAtA: now } : { lastReadAtB: now },
  });

  await db.notification.updateMany({
    where: {
      userId: current.id,
      type: "MESSAGE_RECEIVED",
      link: `/messages?c=${conversationId}`,
      isRead: false,
    },
    data: { isRead: true },
  });

  publishToUser(current.id, {
    type: "message:read",
    conversationId,
    payload: { conversationId, at: now.toISOString() },
  });

  const unreadCount = await db.notification.count({
    where: { userId: current.id, type: "MESSAGE_RECEIVED", isRead: false },
  });

  return { ok: true, data: { unreadCount } };
}
