import Link from "next/link";
import { MapPin, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    venue: string;
    startDate: Date;
    capacity: number;
    posterUrl: string | null;
    org: { name: string; logo?: string | null } | null;
    _count: { registrations: number };
  };
}

const CATEGORY_STYLES: Record<
  string,
  { label: string; emoji: string; accent: string; ring: string }
> = {
  TECHNICAL: {
    label: "Technical",
    emoji: "💻",
    accent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    ring: "from-blue-500/15 to-blue-500/0",
  },
  CULTURAL: {
    label: "Cultural",
    emoji: "🎭",
    accent: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    ring: "from-pink-500/15 to-pink-500/0",
  },
  WORKSHOP: {
    label: "Workshop",
    emoji: "🔧",
    accent: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    ring: "from-amber-500/15 to-amber-500/0",
  },
  SEMINAR: {
    label: "Seminar",
    emoji: "🎤",
    accent: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    ring: "from-violet-500/15 to-violet-500/0",
  },
  HACKATHON: {
    label: "Hackathon",
    emoji: "🚀",
    accent: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    ring: "from-orange-500/15 to-orange-500/0",
  },
  SPORTS: {
    label: "Sports",
    emoji: "⚽",
    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    ring: "from-emerald-500/15 to-emerald-500/0",
  },
  SOCIAL: {
    label: "Social",
    emoji: "🎉",
    accent: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    ring: "from-rose-500/15 to-rose-500/0",
  },
  OTHER: {
    label: "Other",
    emoji: "📋",
    accent: "bg-muted text-muted-foreground",
    ring: "from-muted-foreground/10 to-muted-foreground/0",
  },
};

export function EventCard({ event }: EventCardProps) {
  const spotsLeft = event.capacity - event._count.registrations;
  const isFull = spotsLeft <= 0;
  const fillPct = Math.min(
    Math.round((event._count.registrations / event.capacity) * 100),
    100
  );
  const fillTone =
    fillPct >= 100
      ? "bg-destructive"
      : fillPct >= 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  const cat = CATEGORY_STYLES[event.category] ?? CATEGORY_STYLES.OTHER;
  const start = new Date(event.startDate);
  const day = start.toLocaleDateString("en-IN", { day: "2-digit" });
  const month = start
    .toLocaleDateString("en-IN", { month: "short" })
    .toUpperCase();

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-primary/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      )}
    >
      {/* Poster / fallback header */}
      <div className="relative h-44 overflow-hidden bg-muted">
        {event.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.posterUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              cat.ring,
              "to-card"
            )}
          >
            <span className="text-5xl opacity-70 transition-transform duration-500 group-hover:scale-110">
              {cat.emoji}
            </span>
          </div>
        )}

        {/* Date tile */}
        <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg border bg-background/95 px-2.5 py-1.5 shadow-sm backdrop-blur">
          <span className="text-lg font-bold leading-none text-foreground">
            {day}
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
            {month}
          </span>
        </div>

        {/* Category badge */}
        <span
          className={cn(
            "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
            cat.accent
          )}
        >
          <span className="text-xs leading-none">{cat.emoji}</span>
          {cat.label}
        </span>

        {/* Full overlay */}
        {isFull && (
          <div className="absolute bottom-3 right-3 rounded-md bg-destructive px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-destructive-foreground shadow">
            Full
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {event.org && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 py-0.5 pl-0.5 pr-2 text-[11px] font-medium text-primary">
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

        <h3 className="line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
          {event.title}
        </h3>

        {event.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {start.toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>

          {/* Capacity bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {event._count.registrations}/{event.capacity}
              </span>
              {isFull ? (
                <span className="font-medium text-destructive">
                  Waitlist only
                </span>
              ) : (
                <span className="font-medium text-foreground">
                  {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
                </span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", fillTone)}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
