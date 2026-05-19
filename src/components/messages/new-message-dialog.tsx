"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  org: { id: string; name: string } | null;
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (recipientId: string, content: string) => Promise<void>;
  currentUserRole: string;
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

export function NewMessageDialog({
  open,
  onOpenChange,
  onSend,
  currentUserRole,
}: NewMessageDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(null);
      setContent("");
      setSending(false);
    }
  }, [open]);

  const { data, isLoading } = useQuery<{ contacts: Contact[] }>({
    queryKey: ["messages", "contacts", search],
    queryFn: () =>
      fetch(`/api/messages/contacts?q=${encodeURIComponent(search)}`).then((r) =>
        r.json()
      ),
    enabled: open,
  });

  const contacts = data?.contacts ?? [];

  const handleSubmit = async () => {
    if (!selected || !content.trim()) return;
    setSending(true);
    try {
      await onSend(selected.id, content.trim());
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-lg bg-background shadow-xl border max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">New message</h2>
            <p className="text-xs text-muted-foreground">
              {currentUserRole === "ADMIN"
                ? "Pick an organizer (any college) to message"
                : "Pick an admin to message"}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!selected ? (
          <>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Searching...</p>
              ) : contacts.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  No {currentUserRole === "ADMIN" ? "organizers" : "admins"} found
                </p>
              ) : (
                <ul>
                  {contacts.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelected(c)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 hover:bg-accent text-left border-b last:border-b-0"
                        )}
                      >
                        <Avatar className="h-9 w-9">
                          {c.avatarUrl && <AvatarImage src={c.avatarUrl} />}
                          <AvatarFallback>{initials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.email}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {c.role}
                            {c.org ? ` · ${c.org.name}` : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col flex-1">
            <div className="p-4 border-b bg-accent/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {selected.avatarUrl && <AvatarImage src={selected.avatarUrl} />}
                  <AvatarFallback>{initials(selected.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selected.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selected.role}
                    {selected.org ? ` · ${selected.org.name}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(null)}
                  disabled={sending}
                >
                  Change
                </Button>
              </div>
            </div>
            <div className="p-4 flex-1">
              <Textarea
                placeholder={`Write a message to ${selected.name}...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                autoFocus
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Tip: Ctrl/Cmd + Enter to send
              </p>
            </div>
            <div className="border-t p-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!content.trim() || sending}>
                {sending ? "Sending..." : "Send message"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
