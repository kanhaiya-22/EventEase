import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { EventFilters } from "@/components/events/event-filters";
import { EventCard } from "@/components/events/event-card";
import { Suspense } from "react";

export const metadata = {
  title: "Events",
};

interface EventsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const { q, category, sort } = params;

  // Scope events to the logged-in user's college
  const session = await auth();
  let userOrgId: string | null = null;
  let userOrgName: string | null = null;
  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, orgId: true, org: { select: { name: true } } },
    });
    if (user?.orgId) {
      userOrgId = user.orgId;
      userOrgName = user.org?.name ?? null;
    }
  }

  // Build dynamic where clause
  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    // Logged-in users see only their college's events
    ...(userOrgId && { orgId: userOrgId }),
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { venue: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category && category !== "ALL") {
    where.category = category as Prisma.EnumEventCategoryFilter;
  }

  // Build orderBy
  let orderBy: Prisma.EventOrderByWithRelationInput;
  switch (sort) {
    case "date-desc":
      orderBy = { startDate: "desc" };
      break;
    case "registrations":
      orderBy = { registrations: { _count: "desc" } };
      break;
    case "title":
      orderBy = { title: "asc" };
      break;
    default:
      orderBy = { startDate: "asc" };
  }

  const events = await db.event.findMany({
    where,
    include: {
      organizer: {
        select: { id: true, name: true, email: true },
      },
      org: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: { registrations: { where: { status: { not: "CANCELLED" } } } },
      },
    },
    orderBy,
  });

  const resultText = q || category
    ? `${events.length} event${events.length !== 1 ? "s" : ""} found`
    : `${events.length} published events`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {userOrgName ? `${userOrgName} Events` : "Events"}
          </h1>
          <p className="text-slate-300">{resultText}</p>
        </div>

        <Suspense fallback={null}>
          <EventFilters />
        </Suspense>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {q || category ? "No events match your filters." : "No events published yet."}
            </p>
            <p className="text-slate-500 mt-2">
              {q || category
                ? "Try adjusting your search or filters."
                : "Check back soon for upcoming events!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
