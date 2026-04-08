"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementForm } from "./announcement-form";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventOption {
  id: string;
  title: string;
}

interface AnnouncementListProps {
  currentUserId: string;
  currentUserRole: string;
  orgEvents: EventOption[];
}

export function AnnouncementList({ currentUserId, currentUserRole, orgEvents }: AnnouncementListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const canPost = currentUserRole === "ORGANIZER" || currentUserRole === "ADMIN";

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", page],
    queryFn: async () => {
      const res = await fetch(`/api/announcements?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 30_000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  }, [queryClient]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/announcements/${deletingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Announcement deleted");
      refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  const editingAnnouncement = editingId
    ? data?.announcements?.find((a: { id: string }) => a.id === editingId)
    : null;

  return (
    <div className="space-y-6">
      {/* Post button for organizers/admins */}
      {canPost && !showForm && !editingId && (
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      )}

      {/* Create form */}
      {showForm && (
        <AnnouncementForm
          events={orgEvents}
          onSuccess={() => {
            setShowForm(false);
            refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editingAnnouncement && (
        <AnnouncementForm
          events={orgEvents}
          initialData={{
            id: editingAnnouncement.id,
            title: editingAnnouncement.title,
            content: editingAnnouncement.content,
            eventId: editingAnnouncement.event?.id,
            isPinned: editingAnnouncement.isPinned,
          }}
          onSuccess={() => {
            setEditingId(null);
            refresh();
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Announcements list */}
      {!isLoading && data?.announcements?.length === 0 && (
        <div className="text-center py-16">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No announcements yet</h3>
          <p className="text-sm text-muted-foreground">
            {canPost
              ? "Post the first announcement for your organization!"
              : "Check back later for updates from organizers."}
          </p>
        </div>
      )}

      {!isLoading && data?.announcements && (
        <div className="space-y-4">
          {data.announcements.map((announcement: AnnouncementListProps & { id: string }) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement as never}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onEdit={(id) => setEditingId(id)}
              onDelete={(id) => setDeletingId(id)}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the announcement and all its comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
