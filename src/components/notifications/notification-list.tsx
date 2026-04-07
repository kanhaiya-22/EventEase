"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCheck, Calendar, Award, UserCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  EVENT_CREATED: Calendar,
  EVENT_APPROVED: CheckCheck,
  EVENT_REJECTED: AlertCircle,
  EVENT_UPDATED: Calendar,
  EVENT_CANCELLED: AlertCircle,
  EVENT_REMINDER: Bell,
  REGISTRATION_CONFIRMED: UserCheck,
  REGISTRATION_WAITLISTED: Bell,
  CERTIFICATE_READY: Award,
  GENERAL: Bell,
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [loading, setLoading] = useState(false);

  const unread = notifications.filter((n) => !n.isRead);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = async () => {
    setLoading(true);
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setLoading(false);
    toast.success("All notifications marked as read");
  };

  const renderNotification = (n: Notification) => {
    const Icon = typeIcons[n.type] || Bell;
    const content = (
      <Card
        key={n.id}
        className={`transition-colors ${!n.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/5" : ""}`}
      >
        <CardContent className="flex items-start gap-4 py-4">
          <div className={`mt-0.5 rounded-full p-2 ${!n.isRead ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>
                {n.title}
              </p>
              {!n.isRead && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  New
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
            <p className="text-xs text-muted-foreground mt-2">{formatDate(n.createdAt)}</p>
          </div>
          {!n.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                markRead(n.id);
              }}
              className="shrink-0 text-xs"
            >
              Mark read
            </Button>
          )}
        </CardContent>
      </Card>
    );

    return n.link ? (
      <Link key={n.id} href={n.link} className="block">
        {content}
      </Link>
    ) : (
      <div key={n.id}>{content}</div>
    );
  };

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
        </TabsList>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={loading}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <TabsContent value="all" className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map(renderNotification)
        )}
      </TabsContent>

      <TabsContent value="unread" className="space-y-3">
        {unread.length === 0 ? (
          <div className="text-center py-12">
            <CheckCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          unread.map(renderNotification)
        )}
      </TabsContent>
    </Tabs>
  );
}
