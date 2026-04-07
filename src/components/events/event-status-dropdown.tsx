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
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Play, CheckCircle2, XCircle, Archive } from "lucide-react";
import { toast } from "sonner";
import type { EventStatus } from "@prisma/client";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Archive },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Archive },
  PUBLISHED: { label: "Published", color: "bg-blue-100 text-blue-800", icon: Play },
  ONGOING: { label: "Ongoing", color: "bg-green-100 text-green-800", icon: Play },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
  ARCHIVED: { label: "Archived", color: "bg-slate-100 text-slate-800", icon: Archive },
};

const VALID_TRANSITIONS: Record<string, EventStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PENDING: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["ONGOING", "CANCELLED"],
  ONGOING: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: [],
  ARCHIVED: [],
};

const TRANSITION_LABELS: Record<string, string> = {
  PUBLISHED: "Publish",
  ONGOING: "Start Event",
  COMPLETED: "Mark Completed",
  CANCELLED: "Cancel Event",
  ARCHIVED: "Archive",
};

interface EventStatusDropdownProps {
  eventId: string;
  currentStatus: string;
}

export function EventStatusDropdown({ eventId, currentStatus }: EventStatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const transitions = VALID_TRANSITIONS[status] || [];

  const handleStatusChange = async (newStatus: EventStatus) => {
    const isDestructive = newStatus === "CANCELLED";
    if (isDestructive && !confirm("Are you sure you want to cancel this event? All registered students will be notified.")) {
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
    return <Badge className={config.color}>{config.label}</Badge>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${config.color} border-0 gap-1`}
          disabled={loading}
        >
          {loading ? "Updating..." : config.label}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {transitions.map((newStatus) => {
          const targetConfig = STATUS_CONFIG[newStatus];
          const Icon = targetConfig.icon;
          const isDestructive = newStatus === "CANCELLED";

          return (
            <DropdownMenuItem
              key={newStatus}
              onClick={() => handleStatusChange(newStatus)}
              className={isDestructive ? "text-red-600 focus:text-red-600" : ""}
            >
              <Icon className="h-4 w-4 mr-2" />
              {TRANSITION_LABELS[newStatus] || newStatus}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
