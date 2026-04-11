"use client";

import { useState } from "react";
import { updateEventStatus } from "@/lib/actions/event-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { EventStatus } from "@prisma/client";
import { EventStatusBadge, STATUS_CONFIG } from "./event-status-badge";

const VALID_TRANSITIONS: Record<string, EventStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PENDING: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["ONGOING", "CANCELLED"],
  ONGOING: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["DRAFT"],
  ARCHIVED: ["PUBLISHED"],
};

function transitionLabel(from: string, to: EventStatus): string {
  if (from === "ARCHIVED" && to === "PUBLISHED") return "Restore & Publish";
  if (from === "CANCELLED" && to === "DRAFT") return "Restore as Draft";
  const map: Record<string, string> = {
    PUBLISHED: "Publish",
    ONGOING: "Start Event",
    COMPLETED: "Mark Completed",
    CANCELLED: "Cancel Event",
    ARCHIVED: "Archive",
    DRAFT: "Move to Draft",
  };
  return map[to] || to;
}

interface EventStatusDropdownProps {
  eventId: string;
  currentStatus: string;
}

export function EventStatusDropdown({ eventId, currentStatus }: EventStatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const transitions = VALID_TRANSITIONS[status] || [];

  const handleStatusChange = async (newStatus: EventStatus) => {
    const isDestructive = newStatus === "CANCELLED";
    if (
      isDestructive &&
      !confirm(
        "Are you sure you want to cancel this event? All registered students will be notified."
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await updateEventStatus(eventId, newStatus);
    setLoading(false);

    if (result.success) {
      setStatus(newStatus);
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  if (transitions.length === 0) {
    return <EventStatusBadge status={status as EventStatus} />;
  }

  const config = STATUS_CONFIG[status as EventStatus] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${config.className} border gap-1.5`}
          disabled={loading}
        >
          <Icon className="h-3.5 w-3.5" />
          {loading ? "Updating..." : config.label}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {transitions.map((newStatus) => {
          const targetConfig = STATUS_CONFIG[newStatus];
          const TargetIcon = targetConfig.icon;
          const isDestructive = newStatus === "CANCELLED";

          return (
            <DropdownMenuItem
              key={newStatus}
              onClick={() => handleStatusChange(newStatus)}
              className={isDestructive ? "text-red-600 focus:text-red-600" : ""}
            >
              <TargetIcon className="h-4 w-4 mr-2" />
              {transitionLabel(status, newStatus)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
