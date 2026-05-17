import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { EventFilters } from "@/components/events/event-filters";
import { EventCard } from "@/components/events/event-card";
import { Suspense } from "react";
import { CalendarSearch, Sparkles } from "lucide-react";
import Link from "next/link";

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

  const hasFilters = Boolean(q || (category && category !== "ALL"));
  const resultText = hasFilters
    ? `${events.length} event${events.length !== 1 ? "s" : ""} match your filters`
    : `${events.length} event${events.length !== 1 ? "s" : ""} happening`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero strip — soft tinted gradient behind the title only */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/15),transparent_60%)]"
        />
        <div className="container relative mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col items-start gap-3">
            {userOrgName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {userOrgName}
              </span>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {userOrgName ? `What's on at ${userOrgName}` : "Discover events"}
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Browse upcoming workshops, hackathons, cultural fests and more.{" "}
              <span className="font-medium text-foreground">{resultText}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Listing */}
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <Suspense fallback={null}>
          <EventFilters />
        </Suspense>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CalendarSearch className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {hasFilters ? "No events match your filters" : "No events yet"}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              {hasFilters
                ? "Try clearing a filter, broadening your search, or picking a different category."
                : "Check back soon — new events are added regularly."}
            </p>
            {hasFilters && (
              <Link
                href="/events"
                className="mt-5 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Clear all filters
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
