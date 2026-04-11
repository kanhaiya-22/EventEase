import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type PromotedRegistration = {
  id: string;
  userId: string;
  eventId: string;
  user: { id: string; name: string; email: string };
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    venue: string;
    category: string;
    org: { name: string } | null;
  };
};

/**
 * Atomically promote the longest-waiting WAITLISTED registration for an event
 * if there is now free capacity. Caller is responsible for sending notification
 * and email *outside* the transaction.
 *
 * Returns the promoted registration, or null if nothing was promoted.
 */
export async function promoteFromWaitlist(
  eventId: string,
  tx?: Prisma.TransactionClient
): Promise<PromotedRegistration | null> {
  const run = async (client: Prisma.TransactionClient) => {
    const event = await client.event.findUnique({
      where: { id: eventId },
      select: { id: true, capacity: true, status: true },
    });

    if (!event) return null;
    if (event.status === "CANCELLED" || event.status === "ARCHIVED") return null;

    const confirmedCount = await client.registration.count({
      where: { eventId, status: "CONFIRMED" },
    });

    if (confirmedCount >= event.capacity) return null;

    const next = await client.registration.findFirst({
      where: { eventId, status: "WAITLISTED" },
      orderBy: { registeredAt: "asc" },
      select: { id: true },
    });

    if (!next) return null;

    const promoted = await client.registration.update({
      where: { id: next.id },
      data: { status: "CONFIRMED", registeredAt: new Date() },
      select: {
        id: true,
        userId: true,
        eventId: true,
        user: { select: { id: true, name: true, email: true } },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            venue: true,
            category: true,
            org: { select: { name: true } },
          },
        },
      },
    });

    return promoted as PromotedRegistration;
  };

  if (tx) return run(tx);
  return db.$transaction(run, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

/**
 * Compute a waitlisted registration's position (1-indexed) within its event.
 * Position is the count of WAITLISTED rows with an earlier registeredAt + 1.
 */
export async function getWaitlistPosition(
  registrationId: string
): Promise<number | null> {
  const reg = await db.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, status: true, eventId: true, registeredAt: true },
  });
  if (!reg || reg.status !== "WAITLISTED") return null;

  const ahead = await db.registration.count({
    where: {
      eventId: reg.eventId,
      status: "WAITLISTED",
      registeredAt: { lt: reg.registeredAt },
    },
  });
  return ahead + 1;
}
