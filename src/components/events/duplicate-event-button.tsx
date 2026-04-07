"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { duplicateEvent } from "@/lib/actions/duplicate-event";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface DuplicateEventButtonProps {
  eventId: string;
}

export function DuplicateEventButton({ eventId }: DuplicateEventButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDuplicate = async () => {
    setLoading(true);
    const result = await duplicateEvent(eventId);
    setLoading(false);

    if (result.success && result.eventId) {
      toast.success(result.message);
      router.push(`/organized-events/${result.eventId}/edit`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDuplicate}
      disabled={loading}
      title="Duplicate Event"
      className="px-3"
    >
      <Copy className="h-4 w-4" />
    </Button>
  );
}
