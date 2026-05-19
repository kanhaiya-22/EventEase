"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Send, ArrowLeft, Circle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { NewMessageDialog } from "@/components/messages/new-message-dialog";

interface ContactUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  org: { id: string; name: string } | null;
}

interface ConversationListItem {
  id: string;
  lastMessageAt: string;
  other: ContactUser;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isMine: boolean;
  } | null;
  unreadCount: number;
}

interface ConversationMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  isMine: boolean;
}

interface ConversationDetail {
  conversation: { id: string; other: ContactUser };
  messages: ConversationMessage[];
}

interface RealtimePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface MessagesShellProps {
  currentUser: {
    id: string;
    role: string;
    name: string;
    avatarUrl: string | null;
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString();
}

export function MessagesShell({ currentUser }: MessagesShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const selectedId = searchParams.get("c");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const conversationsQuery = useQuery<{ conversations: ConversationListItem[] }>({
    queryKey: ["messages", "conversations"],
    queryFn: () => fetch("/api/messages/conversations").then((r) => r.json()),
    refetchOnWindowFocus: false,
  });

  const detailQuery = useQuery<ConversationDetail>({
    queryKey: ["messages", "conversation", selectedId],
    queryFn: () =>
      fetch(`/api/messages/conversations/${selectedId}`).then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    enabled: !!selectedId,
    refetchOnWindowFocus: false,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [detailQuery.data?.messages.length, selectedId]);

  // Mark conversation read when selected/changed
  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/messages/conversations/${selectedId}`, { method: "PATCH" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .catch(() => {});
  }, [selectedId, detailQuery.data?.messages.length, queryClient]);

  // SSE real-time subscription
  useEffect(() => {
    const es = new EventSource("/api/messages/stream");

    const handleNew = (e: MessageEvent) => {
      let payload: RealtimePayload;
      try {
        payload = JSON.parse(e.data);
      } catch {
        return;
      }
      const isMine = payload.senderId === currentUser.id;

      // Append to current conversation's cache if open
      if (payload.conversationId === selectedId) {
        queryClient.setQueryData<ConversationDetail | undefined>(
          ["messages", "conversation", selectedId],
          (prev) => {
            if (!prev) return prev;
            if (prev.messages.some((m) => m.id === payload.id)) return prev;
            return {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: payload.id,
                  content: payload.content,
                  createdAt: payload.createdAt,
                  senderId: payload.senderId,
                  isMine,
                },
              ],
            };
          }
        );
      } else if (!isMine) {
        toast(`${payload.senderName}`, {
          description:
            payload.content.length > 80
              ? payload.content.slice(0, 77) + "..."
              : payload.content,
          action: {
            label: "Open",
            onClick: () => router.push(`/messages?c=${payload.conversationId}`),
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      if (!isMine) queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    es.addEventListener("message:new", handleNew as EventListener);
    es.addEventListener("message:read", () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    });
    es.onerror = () => {
      // browser will auto-retry; nothing to do here
    };

    return () => es.close();
  }, [currentUser.id, selectedId, queryClient, router]);

  const conversations = useMemo(
    () => conversationsQuery.data?.conversations ?? [],
    [conversationsQuery.data]
  );
  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );
  const otherUser = detailQuery.data?.conversation.other ?? selected?.other ?? null;

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send");
      }
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }, [draft, selectedId, sending]);

  const handleStartConversation = useCallback(
    async (recipientId: string, content: string) => {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      await queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      router.push(`/messages?c=${data.conversationId}`);
    },
    [queryClient, router]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      {/* Conversation list */}
      <aside
        className={cn(
          "w-full md:w-80 border-r bg-card flex flex-col",
          selectedId && "hidden md:flex"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Messages</h2>
            <p className="text-xs text-muted-foreground">
              {currentUser.role === "ADMIN" ? "Talk to organizers" : "Talk to admins"}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setPickerOpen(true)} title="New message">
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet.
              <br />
              <button
                onClick={() => setPickerOpen(true)}
                className="mt-2 text-primary hover:underline"
              >
                Start a new one
              </button>
            </div>
          ) : (
            <ul>
              {conversations.map((c) => {
                const isActive = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => router.push(`/messages?c=${c.id}`)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 hover:bg-accent text-left transition-colors border-b",
                        isActive && "bg-accent"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        {c.other.avatarUrl && <AvatarImage src={c.other.avatarUrl} />}
                        <AvatarFallback>{initials(c.other.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{c.other.name}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTime(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p
                            className={cn(
                              "text-xs truncate",
                              c.unreadCount > 0
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {c.lastMessage
                              ? `${c.lastMessage.isMine ? "You: " : ""}${c.lastMessage.content}`
                              : "No messages yet"}
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="shrink-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {c.unreadCount > 9 ? "9+" : c.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {c.other.role}
                          {c.other.org ? ` · ${c.other.org.name}` : ""}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat view */}
      <section className={cn("flex-1 flex flex-col", !selectedId && "hidden md:flex")}>
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <Circle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select a conversation</p>
              <Button
                variant="link"
                onClick={() => setPickerOpen(true)}
                className="mt-2"
              >
                or start a new message
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b p-4 bg-card">
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden"
                onClick={() => router.push("/messages")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {otherUser && (
                <>
                  <Avatar className="h-10 w-10">
                    {otherUser.avatarUrl && <AvatarImage src={otherUser.avatarUrl} />}
                    <AvatarFallback>{initials(otherUser.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{otherUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {otherUser.role}
                      {otherUser.org ? ` · ${otherUser.org.name}` : ""}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
              {detailQuery.isLoading ? (
                <p className="text-sm text-muted-foreground text-center">Loading...</p>
              ) : detailQuery.data?.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-8">
                  No messages yet. Say hi!
                </p>
              ) : (
                detailQuery.data?.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.isMine ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                        m.isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border rounded-bl-sm"
                      )}
                    >
                      <p>{m.content}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          m.isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t p-3 bg-card">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  className="resize-none min-h-[44px] max-h-32"
                  rows={1}
                />
                <Button onClick={handleSend} disabled={!draft.trim() || sending} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <NewMessageDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSend={handleStartConversation}
        currentUserRole={currentUser.role}
      />
    </div>
  );
}
