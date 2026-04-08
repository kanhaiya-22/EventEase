"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReactionButton } from "./reaction-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Reply, Pencil, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

interface Author {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface CommentData {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  reactionCounts: { emoji: string; count: number }[];
  userReactions: string[];
  replies?: CommentData[];
}

interface CommentSectionProps {
  announcementId: string;
  comments: CommentData[];
  currentUserId: string;
  currentUserRole: string;
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
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function SingleComment({
  comment,
  announcementId,
  currentUserId,
  currentUserRole,
  onRefresh,
  depth = 0,
}: {
  comment: CommentData;
  announcementId: string;
  currentUserId: string;
  currentUserRole: string;
  onRefresh: () => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = comment.author.id === currentUserId;
  const isAdmin = currentUserRole === "ADMIN";
  const canModify = isOwner || isAdmin;

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentId: comment.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to post reply");
        return;
      }

      toast.success("Reply posted");
      setReplyContent("");
      setReplying(false);
      onRefresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update comment");
        return;
      }

      toast.success("Comment updated");
      setEditing(false);
      onRefresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete comment");
        return;
      }
      toast.success("Comment deleted");
      onRefresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const roleBadge =
    comment.author.role === "ORGANIZER" ? (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        Organizer
      </Badge>
    ) : comment.author.role === "ADMIN" ? (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
        Admin
      </Badge>
    ) : null;

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}>
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8 shrink-0">
          {comment.author.avatarUrl && <AvatarImage src={comment.author.avatarUrl} />}
          <AvatarFallback className="text-xs">
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{comment.author.name}</span>
            {roleBadge}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.createdAt !== comment.updatedAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={submitting}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <ReactionButton
              targetType="comment"
              targetId={comment.id}
              reactionCounts={comment.reactionCounts}
              userReactions={comment.userReactions}
            />

            {depth === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => setReplying(!replying)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {canModify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      <Pencil className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {replying && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm flex-1"
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={handleReply} disabled={submitting}>
                  <Send className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <SingleComment
          key={reply.id}
          comment={reply}
          announcementId={announcementId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onRefresh={onRefresh}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function CommentSection({
  announcementId,
  comments,
  currentUserId,
  currentUserRole,
  onRefresh,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to post comment");
        return;
      }

      toast.success("Comment posted");
      setNewComment("");
      onRefresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">
        Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      {/* New comment input */}
      <div className="flex gap-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          rows={2}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSubmit();
            }
          }}
        />
        <Button
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Press Ctrl+Enter to submit</p>

      {/* Comments list */}
      <div className="divide-y">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <SingleComment
              key={comment.id}
              comment={comment}
              announcementId={announcementId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
}
