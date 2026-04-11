import { Badge } from "@/components/ui/badge";
import {
  FileEdit,
  Clock,
  Send,
  Play,
  CheckCircle2,
  XCircle,
  Archive,
} from "lucide-react";
import type { EventStatus } from "@prisma/client";

export const STATUS_CONFIG: Record<
  EventStatus,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 border-gray-300",
    icon: FileEdit,
    description: "Not yet published. Only organizers can see it.",
  },
  PENDING: {
    label: "Pending Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: Clock,
    description: "Awaiting admin approval.",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Send,
    description: "Live and accepting registrations.",
  },
  ONGOING: {
    label: "Ongoing",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: Play,
    description: "Event is currently in progress.",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: CheckCircle2,
    description: "Event has ended.",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: XCircle,
    description: "Event was cancelled.",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-slate-200 text-slate-700 border-slate-400",
    icon: Archive,
    description: "Archived for historical reference. Can be restored.",
  },
};

interface EventStatusBadgeProps {
  status: EventStatus | string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function EventStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: EventStatusBadgeProps) {
  const config = STATUS_CONFIG[status as EventStatus] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <Badge
      className={`${config.className} ${sizeClasses} border inline-flex items-center font-medium ${className}`}
      title={config.description}
    >
      {showIcon && <Icon className={iconSize} />}
      {config.label}
    </Badge>
  );
}
