import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { EventFilters } from "@/components/events/event-filters";
import { EventCard } from "@/components/events/event-card";
import { Suspense } from "react";
import { CalendarSearch, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { OrgLogo } from "@/components/ui/org-logo";

export const metadata = {
  title: "Events",
};

interface EventsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    college?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const { q, category, sort, college } = params;

  // Scope events to the logged-in user's college (admins see all colleges)
  const session = await auth();
  let userOrgId: string | null = null;
  let userOrgName: string | null = null;
  let userOrgLogo: string | null = null;
  let isAdmin = false;
  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, orgId: true, org: { select: { name: true, logo: true } } },
    });
    isAdmin = user?.role === "ADMIN";
    if (user?.orgId && !isAdmin) {
      userOrgId = user.orgId;
      userOrgName = user.org?.name ?? null;
      userOrgLogo = user.org?.logo ?? null;
    }
  }

  // Build dynamic where clause
  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    // Non-admin logged-in users see only their college's events
    ...(userOrgId && { orgId: userOrgId }),
    // Admins and logged-out users can filter to a specific college by slug
    ...(!userOrgId && college && college !== "ALL" && { org: { slug: college } }),
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

  // For logged-out visitors, list colleges that actually have published events
  // so the dropdown only offers useful choices.
  const colleges = userOrgId
    ? []
    : await db.organization.findMany({
        where: { events: { some: { status: "PUBLISHED" } } },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      });

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
        select: { id: true, name: true, slug: true, logo: true },
      },
      _count: {
        select: { registrations: { where: { status: { not: "CANCELLED" } } } },
      },
    },
    orderBy,
  });

  const hasFilters = Boolean(
    q || (category && category !== "ALL") || (college && college !== "ALL")
  );

  // For logged-out viewers who picked a college from the dropdown, show that
  // name in the hero heading instead of the generic "Discover events".
  const selectedCollegeName =
    !userOrgId && college && college !== "ALL"
      ? (colleges.find((c) => c.slug === college)?.name ?? null)
      : null;
  const heroOrgName = userOrgName ?? selectedCollegeName;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero strip — compact with animated gradient blobs */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-blob"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-3xl animate-blob"
          style={{ animationDelay: "2s" }}
        />
        <div className="container relative mx-auto px-4 py-5 sm:py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="animate-fade-up space-y-1.5">
              {heroOrgName && (
                <span className="group inline-flex items-center gap-1.5 rounded-full border bg-card/80 py-0.5 pl-0.5 pr-3 text-xs font-medium text-muted-foreground backdrop-blur transition-all hover:bg-card hover:text-foreground hover:shadow-sm">
                  <OrgLogo
                    src={userOrgLogo}
                    name={heroOrgName}
                    size="xs"
                    rounded="full"
                    className="border-0 bg-background"
                  />
                  <span className="transition-transform group-hover:translate-x-0.5">
                    {heroOrgName}
                  </span>
                </span>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {heroOrgName ? (
                  <>
                    What&apos;s on at{" "}
                    <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-primary bg-clip-text text-transparent animate-shimmer">
                      {heroOrgName}
                    </span>
                  </>
                ) : (
                  "Discover events"
                )}
              </h1>
            </div>

            <div
              className="animate-fade-up flex items-center gap-2"
              style={{ animationDelay: "120ms" }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card/80 px-3 py-1.5 text-sm shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md">
                <TrendingUp className="h-4 w-4 text-emerald-500 animate-float-slow" />
                <span className="font-semibold text-foreground">
                  {events.length}
                </span>
                <span className="text-muted-foreground">
                  {hasFilters ? "matching" : "live"}
                </span>
              </span>
              {hasFilters && (
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1 rounded-lg border bg-card/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-md"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Clear
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Listing */}
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <Suspense fallback={null}>
          <EventFilters colleges={colleges} />
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
            {events.map((event, idx) => (
              <div
                key={event.id}
                className="animate-fade-up"
                style={{
                  animationDelay: `${Math.min(idx * 40, 400)}ms`,
                }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
