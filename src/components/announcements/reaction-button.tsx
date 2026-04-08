"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🎉", label: "Celebrate" },
  { emoji: "👏", label: "Clap" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💡", label: "Insightful" },
];

interface ReactionCounts {
  emoji: string;
  count: number;
}

interface ReactionButtonProps {
  targetType: "announcement" | "comment";
  targetId: string;
  reactionCounts: ReactionCounts[];
  userReactions: string[];
  onReactionChange?: () => void;
}

export function ReactionButton({
  targetType,
  targetId,
  reactionCounts: initialCounts,
  userReactions: initialUserReactions,
  onReactionChange,
}: ReactionButtonProps) {
  const [reactionCounts, setReactionCounts] = useState(initialCounts);
  const [userReactions, setUserReactions] = useState(initialUserReactions);
  const [showPicker, setShowPicker] = useState(false);

  const toggleReaction = async (emoji: string) => {
    const url =
      targetType === "announcement"
        ? `/api/announcements/${targetId}/reactions`
        : `/api/comments/${targetId}/reactions`;

    const hasReaction = userReactions.includes(emoji);

    // Optimistic update
    if (hasReaction) {
      setUserReactions((prev) => prev.filter((e) => e !== emoji));
      setReactionCounts((prev) =>
        prev
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1 } : r))
          .filter((r) => r.count > 0)
      );
    } else {
      setUserReactions((prev) => [...prev, emoji]);
      const existing = reactionCounts.find((r) => r.emoji === emoji);
      if (existing) {
        setReactionCounts((prev) =>
          prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
        );
      } else {
        setReactionCounts((prev) => [...prev, { emoji, count: 1 }]);
      }
    }

    setShowPicker(false);

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      onReactionChange?.();
    } catch {
      // Revert on error
      if (hasReaction) {
        setUserReactions((prev) => [...prev, emoji]);
      } else {
        setUserReactions((prev) => prev.filter((e) => e !== emoji));
      }
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactionCounts.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors",
            userReactions.includes(r.emoji)
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 rounded-full p-0 text-muted-foreground"
          onClick={() => setShowPicker(!showPicker)}
        >
          +
        </Button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-full left-0 z-50 mb-1 flex gap-1 rounded-lg border bg-background p-1.5 shadow-lg">
              {EMOJI_OPTIONS.map((option) => (
                <button
                  key={option.emoji}
                  onClick={() => toggleReaction(option.emoji)}
                  title={option.label}
                  className={cn(
                    "rounded p-1 text-base transition-colors hover:bg-muted",
                    userReactions.includes(option.emoji) && "bg-blue-50"
                  )}
                >
                  {option.emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
