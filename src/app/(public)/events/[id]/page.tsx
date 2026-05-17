import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import EventRegisterButton from "@/components/events/event-register-button";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { OrgLogo } from "@/components/ui/org-logo";
import { cn } from "@/lib/utils";

const CATEGORY_ACCENT: Record<string, string> = {
  TECHNICAL: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  CULTURAL: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  WORKSHOP: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  SEMINAR: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  HACKATHON: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  SPORTS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  SOCIAL: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  OTHER: "bg-muted text-muted-foreground",
};

interface EventDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const session = await auth();
  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      registrations: {
        where: session?.user?.email
          ? {
              user: {
                email: session.user.email,
              },
              status: { not: "CANCELLED" },
            }
          : undefined,
        select: {
          id: true,
          status: true,
          qrCode: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          registrations: { where: { status: "CONFIRMED" } },
        },
      },
    },
  });

  const waitlistCount = await db.registration.count({
    where: { eventId: id, status: "WAITLISTED" },
  });

  if (!event) {
    notFound();
  }

  // Get current user ID for organizer check
  let currentUserId: string | null = null;
  if (session?.user?.email) {
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    currentUserId = currentUser?.id || null;
  }

  const userRegistration = event.registrations[0];
  const spotsAvailable = event.capacity - event._count.registrations;
  const isFull = spotsAvailable <= 0;
  const isOrganizer = currentUserId === event.organizer.id;

  // Parse documents from customFields
  let documents: Array<{ url: string; name: string }> = [];
  try {
    if (event.customFields && typeof event.customFields === 'string') {
      const customFields = JSON.parse(event.customFields);
      if (customFields.documents && Array.isArray(customFields.documents)) {
        documents = customFields.documents;
      }
    } else if (event.customFields && typeof event.customFields === 'object') {
      const customFieldsObj = event.customFields as any;
      if (customFieldsObj.documents && Array.isArray(customFieldsObj.documents)) {
        documents = customFieldsObj.documents;
      }
    }
  } catch (e) {
    // If parsing fails, documents remain empty
    console.error("Failed to parse customFields:", e);
  }

  const capacityPct = event.capacity
    ? Math.min(
        Math.round((event._count.registrations / event.capacity) * 100),
        100
      )
    : 0;
  const capacityTone = isFull
    ? "bg-destructive"
    : capacityPct >= 80
      ? "bg-amber-500"
      : "bg-emerald-500";
  const categoryAccent =
    CATEGORY_ACCENT[event.category] ?? CATEGORY_ACCENT.OTHER;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/events"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {event.posterUrl && (
              <div className="h-96 overflow-hidden rounded-xl border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="rounded-xl border bg-card p-6 sm:p-8 text-card-foreground shadow-sm">
              <div className="mb-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      categoryAccent
                    )}
                  >
                    {event.category}
                  </span>
                  <EventStatusBadge status={event.status} />
                  {event.org && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-0.5 pl-0.5 pr-3 text-xs font-medium text-primary">
                      <OrgLogo
                        src={event.org.logo}
                        name={event.org.name}
                        size="xs"
                        rounded="full"
                        className="border-0 bg-background"
                      />
                      {event.org.name}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {event.title}
                </h1>
              </div>

              <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                {event.description}
              </p>

              {event.tags && event.tags.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents / Rulebooks */}
              {documents && documents.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Documents & Rulebooks
                  </h3>
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <a
                        key={index}
                        href={`/api/documents/download?url=${encodeURIComponent(
                          doc.url
                        )}&name=${encodeURIComponent(doc.name)}`}
                        className="group flex items-center justify-between rounded-lg border bg-background p-3 transition-colors hover:bg-accent"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="h-5 w-5 shrink-0 text-primary" />
                          <span className="truncate font-medium text-foreground">
                            {doc.name}
                          </span>
                        </div>
                        <Download className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Organizer */}
            <div className="rounded-xl border bg-card p-6 sm:p-8 text-card-foreground shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Organizer
              </h3>
              <div className="flex items-center gap-4">
                {event.organizer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.organizer.avatarUrl}
                    alt={event.organizer.name}
                    className="h-14 w-14 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {event.organizer.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {event.organizer.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {event.organizer.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <h3 className="mb-6 text-lg font-semibold text-foreground">
                Event Details
              </h3>

              <div className="space-y-6">
                {/* Date */}
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </p>
                  <p className="font-semibold text-foreground">
                    {new Date(event.startDate).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(event.startDate).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(event.endDate).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Venue */}
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Venue
                  </p>
                  <p className="font-semibold text-foreground">{event.venue}</p>
                </div>

                {/* Capacity */}
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Capacity
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {event._count.registrations}/{event.capacity}
                      </span>
                      <span className="text-muted-foreground">
                        {capacityPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          capacityTone
                        )}
                        style={{ width: `${capacityPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Spots Available */}
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Ticket className="h-3.5 w-3.5" />
                    Spots Available
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      isFull ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {Math.max(0, spotsAvailable)}
                  </p>
                  {isFull && waitlistCount > 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {waitlistCount} on waitlist
                    </p>
                  )}
                </div>

                {/* Registration Status */}
                {session ? (
                  isOrganizer ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center">
                      <p className="font-semibold text-primary">
                        You&apos;re the Organizer
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Manage this event from your dashboard
                      </p>
                    </div>
                  ) : userRegistration ? (
                    userRegistration.status === "WAITLISTED" ? (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                        <p className="font-semibold text-amber-700 dark:text-amber-300">
                          ⏳ You&apos;re on the waitlist
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          We&apos;ll email you if a spot opens up.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                        <p className="flex items-center justify-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          You&apos;re Registered
                        </p>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          QR Code: {userRegistration.qrCode}
                        </p>
                      </div>
                    )
                  ) : (
                    <EventRegisterButton
                      eventId={event.id}
                      isFull={isFull}
                      waitlistEnabled={event.waitlistEnabled}
                      waitlistCount={waitlistCount}
                    />
                  )
                ) : (
                  <Link
                    href="/login"
                    className="block w-full rounded-lg bg-primary py-3 text-center font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Login to Register
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
