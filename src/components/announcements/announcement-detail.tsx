"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ReactionButton } from "./reaction-button";
import { CommentSection } from "./comment-section";
import { Pin, Calendar, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

interface AnnouncementDetailProps {
  announcementId: string;
  currentUserId: string;
  currentUserRole: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnnouncementDetail({
  announcementId,
  currentUserId,
  currentUserRole,
}: AnnouncementDetailProps) {
  const queryClient = useQueryClient();

  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement", announcementId],
    queryFn: async () => {
      const res = await fetch(`/api/announcements/${announcementId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 15_000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["announcement", announcementId] });
  }, [queryClient, announcementId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="text-center py-16">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Announcement not found</p>
      </div>
    );
  }

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
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {/* Author */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {announcement.author.avatarUrl && (
                <AvatarImage src={announcement.author.avatarUrl} />
              )}
              <AvatarFallback>
                {announcement.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{announcement.author.name}</span>
                {roleBadge}
                {announcement.isPinned && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300"
                  >
                    <Pin className="h-2.5 w-2.5 mr-0.5" />
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(announcement.createdAt)}
              </p>
            </div>
          </div>

          {/* Title & Content */}
          <div className="mt-5">
            <h1 className="text-xl font-bold">{announcement.title}</h1>
            <div className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">
              {announcement.content}
            </div>
          </div>

          {/* Linked event */}
          {announcement.event && (
            <Link
              href={`/events/${announcement.event.slug}`}
              className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-md bg-muted text-sm hover:bg-muted/80 transition-colors"
            >
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>{announcement.event.title}</span>
            </Link>
          )}

          {/* Reactions */}
          <div className="mt-5">
            <ReactionButton
              targetType="announcement"
              targetId={announcement.id}
              reactionCounts={announcement.reactionCounts}
              userReactions={announcement.userReactions}
              onReactionChange={refresh}
            />
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent className="pt-6">
          <Separator className="mb-4" />
          <CommentSection
            announcementId={announcement.id}
            comments={announcement.comments || []}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onRefresh={refresh}
          />
        </CardContent>
      </Card>
    </div>
  );
}
