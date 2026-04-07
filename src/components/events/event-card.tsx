import { Badge } from "@/components/ui/badge";

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
    org: { name: string } | null;
    _count: { registrations: number };
  };
}

export function EventCard({ event }: EventCardProps) {
  const spotsLeft = event.capacity - event._count.registrations;
  const isFull = spotsLeft <= 0;

  return (
    <a
      href={`/events/${event.id}`}
      className="group bg-slate-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1"
    >
      {event.posterUrl ? (
        <div className="relative h-48 overflow-hidden bg-slate-700">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isFull && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              FULL
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-blue-900 to-slate-800 flex items-center justify-center">
          <span className="text-4xl opacity-50">
            {event.category === "TECHNICAL" ? "💻" :
             event.category === "CULTURAL" ? "🎭" :
             event.category === "WORKSHOP" ? "🔧" :
             event.category === "SEMINAR" ? "🎤" :
             event.category === "HACKATHON" ? "🚀" :
             event.category === "SPORTS" ? "⚽" :
             event.category === "SOCIAL" ? "🎉" : "📋"}
          </span>
          {isFull && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              FULL
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-blue-400 bg-blue-900 px-3 py-1 rounded-full">
            {event.category}
          </span>
          <span className="text-xs text-slate-400">
            {event._count.registrations} registered
          </span>
        </div>

        {event.org && (
          <div className="mb-2 text-xs font-semibold text-purple-300 bg-purple-900/30 px-2 py-1 rounded inline-block">
            {event.org.name}
          </div>
        )}

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {event.title}
        </h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>
        <div className="space-y-2 text-sm text-slate-300">
          <p className="flex items-center gap-2">
            <span className="text-slate-500">Venue:</span> {event.venue}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-slate-500">Date:</span>{" "}
            {new Date(event.startDate).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2">
              <span className="text-slate-500">Capacity:</span> {event.capacity}
            </p>
            {!isFull && (
              <span className="text-xs text-green-400">{spotsLeft} spots left</span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
