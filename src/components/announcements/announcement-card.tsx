"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrgLogo } from "@/components/ui/org-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactionButton } from "./reaction-button";
import {
  Pin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  PinOff,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { togglePin } from "@/lib/actions/announcements";

interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatarUrl: string | null;
      role: string;
    };
    org?: {
      id: string;
      name: string;
      logo: string | null;
    } | null;
    event?: {
      id: string;
      title: string;
      slug: string;
    } | null;
    _count: {
      comments: number;
      reactions: number;
    };
    reactionCounts: { emoji: string; count: number }[];
    userReactions: string[];
  };
  currentUserId: string;
  currentUserRole: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh: () => void;
}

function formatRelativeTime(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function AnnouncementCard({
  announcement,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
  onRefresh,
}: AnnouncementCardProps) {
  const isOwner = announcement.author.id === currentUserId;
  const isOrganizerOrAdmin = currentUserRole === "ORGANIZER" || currentUserRole === "ADMIN";
  const canModify = isOwner || currentUserRole === "ADMIN";

  const handlePin = async () => {
    const result = await togglePin(announcement.id);
    if (result.success) {
      toast.success(result.isPinned ? "Announcement pinned" : "Announcement unpinned");
      onRefresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    onDelete(announcement.id);
  };

  const roleBadge =
    announcement.author.role === "ORGANIZER" ? (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        Organizer
      </Badge>
    ) : announcement.author.role === "ADMIN" ? (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
        Admin
      </Badge>
    ) : null;

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        announcement.isPinned ? "border-l-4 border-l-amber-400 bg-amber-50/5" : ""
      }`}
    >
      <CardContent className="pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                {announcement.author.avatarUrl && (
                  <AvatarImage src={announcement.author.avatarUrl} />
                )}
                <AvatarFallback>
                  {announcement.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {announcement.org && (
                <span
                  className="absolute -bottom-1 -right-1 ring-2 ring-card rounded-md"
                  title={announcement.org.name}
                >
                  <OrgLogo
                    src={announcement.org.logo}
                    name={announcement.org.name}
                    size="xs"
                    rounded="md"
                  />
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{announcement.author.name}</span>
                {roleBadge}
                {announcement.isPinned && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                    <Pin className="h-2.5 w-2.5 mr-0.5" />
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {announcement.org && (
                  <span className="text-foreground/70">{announcement.org.name} · </span>
                )}
                {formatRelativeTime(announcement.createdAt)}
              </p>
            </div>
          </div>

          {(canModify || isOrganizerOrAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOrganizerOrAdmin && (
                  <DropdownMenuItem onClick={handlePin}>
                    {announcement.isPinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin to Top
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {canModify && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(announcement.id)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canModify && (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div className="mt-3">
          <Link href={`/announcements/${announcement.id}`} className="block group">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
              {announcement.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
              {announcement.content}
            </p>
          </Link>

          {announcement.event && (
            <Link
              href={`/events/${announcement.event.slug}`}
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              <Calendar className="h-3 w-3" />
              {announcement.event.title}
            </Link>
          )}
        </div>

        {/* Footer: reactions + comments */}
        <div className="mt-4 flex items-center justify-between">
          <ReactionButton
            targetType="announcement"
            targetId={announcement.id}
            reactionCounts={announcement.reactionCounts}
            userReactions={announcement.userReactions}
          />

          <Link
            href={`/announcements/${announcement.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{announcement._count.comments}</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
