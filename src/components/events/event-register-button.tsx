"use client";

import { useState } from "react";
import { toast } from "sonner";

interface EventRegisterButtonProps {
  eventId: string;
  isFull: boolean;
  waitlistEnabled?: boolean;
  waitlistCount?: number;
}

export default function EventRegisterButton({
  eventId,
  isFull,
  waitlistEnabled = true,
  waitlistCount = 0,
}: EventRegisterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmWaitlist, setConfirmWaitlist] = useState(false);

  const submit = async (joinWaitlist: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinWaitlist }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.status === "WAITLISTED") {
          toast.success(
            `You're #${data.waitlistPosition ?? 1} on the waitlist. We'll email you if a spot opens.`
          );
        } else {
          toast.success("Registration confirmed!");
        }
        window.location.reload();
        return;
      }

      // 409 with full + canWaitlist → show inline confirm
      if (res.status === 409 && data?.full && data?.canWaitlist) {
        setConfirmWaitlist(true);
        return;
      }

      toast.error(data.error || "Failed to register for event");
    } catch {
      toast.error("Error registering for event");
    } finally {
      setLoading(false);
    }
  };

  if (confirmWaitlist) {
    return (
      <div className="space-y-2">
        <div className="bg-amber-900/30 border border-amber-700/50 text-amber-200 p-3 rounded-lg text-sm">
          This event is full. Join the waitlist? You&apos;ll be notified by email if a
          spot opens up.
          {waitlistCount > 0 && (
            <span className="block mt-1 text-amber-300/80">
              {waitlistCount} {waitlistCount === 1 ? "person is" : "people are"} ahead
              of you.
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={() => submit(true)}
            className="flex-1 py-3 rounded-lg font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? "Joining..." : "Join Waitlist"}
          </button>
          <button
            disabled={loading}
            onClick={() => setConfirmWaitlist(false)}
            className="flex-1 py-3 rounded-lg font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const fullAndNoWaitlist = isFull && !waitlistEnabled;
  const label = loading
    ? isFull
      ? "Joining..."
      : "Registering..."
    : fullAndNoWaitlist
    ? "Event Full"
    : isFull
    ? "Join Waitlist"
    : "Register Now";

  return (
    <button
      disabled={fullAndNoWaitlist || loading}
      className={`w-full py-3 rounded-lg font-semibold transition-all ${
        fullAndNoWaitlist
          ? "bg-slate-700 text-slate-500 cursor-not-allowed"
          : isFull
          ? "bg-amber-600 text-white hover:bg-amber-700"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
      onClick={() => submit(isFull)}
    >
      {label}
    </button>
  );
}
