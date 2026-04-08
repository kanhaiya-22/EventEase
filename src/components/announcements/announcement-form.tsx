"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

interface EventOption {
  id: string;
  title: string;
}

interface AnnouncementFormProps {
  events: EventOption[];
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: {
    id: string;
    title: string;
    content: string;
    eventId?: string | null;
    isPinned: boolean;
  };
}

export function AnnouncementForm({ events, onSuccess, onCancel, initialData }: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [eventId, setEventId] = useState(initialData?.eventId || "");
  const [isPinned, setIsPinned] = useState(initialData?.isPinned || false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setSubmitting(true);

    try {
      const url = isEditing ? `/api/announcements/${initialData.id}` : "/api/announcements";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          eventId: eventId || null,
          isPinned,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save announcement");
        return;
      }

      toast.success(isEditing ? "Announcement updated" : "Announcement posted");
      setTitle("");
      setContent("");
      setEventId("");
      setIsPinned(false);
      onSuccess();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isEditing ? "Edit Announcement" : "Post an Announcement"}
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>Link to Event (optional)</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Pin to top</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Posting..." : isEditing ? "Update" : "Post Announcement"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
