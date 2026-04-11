import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import EventRegisterButton from "@/components/events/event-register-button";
import { Download, FileText } from "lucide-react";
import { EventStatusBadge } from "@/components/events/event-status-badge";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <a
          href="/events"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors"
        >
          ← Back to Events
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {event.posterUrl && (
              <div className="mb-8 rounded-lg overflow-hidden h-96 bg-slate-700">
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="bg-slate-800 rounded-lg p-8 mb-8">
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="bg-blue-900 text-blue-400 px-4 py-2 rounded-full text-sm font-semibold">
                    {event.category}
                  </span>
                  <EventStatusBadge status={event.status} />
                  {event.org && (
                    <span className="bg-purple-900 text-purple-300 px-4 py-2 rounded-full text-sm font-semibold">
                      📚 {event.org.name}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  {event.title}
                </h1>
              </div>

              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-slate-300 leading-relaxed">
                  {event.description}
                </p>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents/Rulebook Section */}
              {documents && documents.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents & Rulebooks
                  </h3>
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <a
                        key={index}
                        href={`/api/documents/download?url=${encodeURIComponent(doc.url)}&name=${encodeURIComponent(doc.name)}`}
                        className="block bg-slate-700 hover:bg-slate-600 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
                            <span className="text-slate-200 font-medium truncate">
                              {doc.name}
                            </span>
                          </div>
                          <Download className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Organizer */}
            <div className="bg-slate-800 rounded-lg p-8">
              <h3 className="text-xl font-bold text-white mb-4">Organizer</h3>
              <div className="flex items-center space-x-4">
                {event.organizer.avatarUrl && (
                  <img
                    src={event.organizer.avatarUrl}
                    alt={event.organizer.name}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <p className="text-white font-semibold">
                    {event.organizer.name}
                  </p>
                  <p className="text-slate-400">{event.organizer.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Event Details Card */}
            <div className="bg-slate-800 rounded-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold text-white mb-6">
                Event Details
              </h3>

              <div className="space-y-6">
                {/* Date */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">📅 Date</p>
                  <p className="text-white font-semibold">
                    {new Date(event.startDate).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {new Date(event.startDate).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(event.endDate).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Venue */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">📍 Venue</p>
                  <p className="text-white font-semibold">{event.venue}</p>
                </div>

                {/* Capacity */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">👥 Capacity</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">
                        {event._count.registrations}/{event.capacity}
                      </span>
                      <span className="text-slate-400">
                        {Math.round(
                          (event._count.registrations / event.capacity) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isFull ? "bg-red-500" : "bg-blue-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (event._count.registrations / event.capacity) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Spots Available */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">🎟️ Spots Available</p>
                  <p
                    className={`text-2xl font-bold ${
                      isFull ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {Math.max(0, spotsAvailable)}
                  </p>
                  {isFull && waitlistCount > 0 && (
                    <p className="text-xs text-amber-300 mt-1">
                      {waitlistCount} on waitlist
                    </p>
                  )}
                </div>

                {/* Registration Status */}
                {session ? (
                  isOrganizer ? (
                    <div className="bg-blue-900 text-blue-400 p-4 rounded-lg text-center">
                      <p className="font-semibold">📋 You're the Organizer</p>
                      <p className="text-xs mt-1">Check event details in your dashboard</p>
                    </div>
                  ) : userRegistration ? (
                    userRegistration.status === "WAITLISTED" ? (
                      <div className="bg-amber-900/40 text-amber-300 p-4 rounded-lg text-center border border-amber-700/50">
                        <p className="font-semibold">⏳ You&apos;re on the waitlist</p>
                        <p className="text-xs mt-1">We&apos;ll email you if a spot opens up.</p>
                      </div>
                    ) : (
                      <div className="bg-green-900 text-green-400 p-4 rounded-lg text-center">
                        <p className="font-semibold">✓ You&apos;re Registered</p>
                        <p className="text-xs mt-1">QR Code: {userRegistration.qrCode}</p>
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
                  <a
                    href="/login"
                    className="block w-full py-3 rounded-lg font-semibold bg-blue-600 text-white text-center hover:bg-blue-700 transition-colors"
                  >
                    Login to Register
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
