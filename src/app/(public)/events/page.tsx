import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function EventsPage() {
  const session = await auth();
  
  // Get all organizations for display
  const organizations = await db.organization.findMany({
    include: {
      _count: {
        select: {
          events: {
            where: { status: "PUBLISHED" }
          }
        }
      }
    }
  });

  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Events</h1>
          <p className="text-slate-300">
            {events.length} published events available
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No events published yet.</p>
            <p className="text-slate-500 mt-2">
              Check back soon for upcoming events!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <a
                key={event.id}
                href={`/events/${event.id}`}
                className="group bg-slate-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1"
              >
                {event.posterUrl && (
                  <div className="relative h-48 overflow-hidden bg-slate-700">
                    <img
                      src={event.posterUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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
                  
                  {/* College/Organization Badge */}
                  {event.org && (
                    <div className="mb-2 text-xs font-semibold text-purple-300 bg-purple-900/30 px-2 py-1 rounded inline-block">
                      📚 {event.org.name}
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>📍 {event.venue}</p>
                    <p>
                      📅{" "}
                      {new Date(event.startDate).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p>👥 Capacity: {event.capacity}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
