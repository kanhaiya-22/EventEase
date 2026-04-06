"use client";

import { useState } from "react";

interface EventRegisterButtonProps {
  eventId: string;
  isFull: boolean;
}

export default function EventRegisterButton({
  eventId,
  isFull,
}: EventRegisterButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to register for event");
      }
    } catch (error) {
      alert("Error registering for event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      disabled={isFull || loading}
      className={`w-full py-3 rounded-lg font-semibold transition-all ${
        isFull
          ? "bg-slate-700 text-slate-500 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
      onClick={handleRegister}
    >
      {loading ? "Registering..." : isFull ? "Event Full" : "Register Now"}
    </button>
  );
}
