import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrgLogo } from "@/components/ui/org-logo";
import { Megaphone, Pin, MessageCircle, Calendar } from "lucide-react";

export const metadata = {
  title: "All Announcements — Admin",
};

function formatDate(date: Date) {
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminAnnouncementsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const announcements = await db.announcement.findMany({
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
      org: {
        select: { id: true, name: true, slug: true, logo: true },
      },
      event: {
        select: { id: true, title: true, slug: true },
      },
      _count: {
        select: { comments: true, reactions: true },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  // Group by org for cleaner display, but keep flat array for the overall view.
  const byOrg = new Map<string, { name: string; logo: string | null; count: number }>();
  for (const a of announcements) {
    const key = a.org?.id || "unaffiliated";
    const existing = byOrg.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byOrg.set(key, {
        name: a.org?.name || "Unaffiliated",
        logo: a.org?.logo ?? null,
        count: 1,
      });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Megaphone className="h-7 w-7" />
            <h1 className="text-3xl font-bold tracking-tight">All Announcements</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Platform-wide view of announcements across all colleges (read-only).
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {announcements.length} total
        </Badge>
      </div>

      {byOrg.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(byOrg.entries()).map(([key, info]) => (
            <Badge key={key} variant="outline" className="gap-1.5 py-1 pl-1 pr-2">
              <OrgLogo
                src={info.logo}
                name={info.name}
                size="xs"
                rounded="md"
                className="border-0"
              />
              {info.name}
              <span className="text-muted-foreground ml-1">({info.count})</span>
            </Badge>
          ))}
        </div>
      )}

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <Megaphone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No announcements have been posted on the platform yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => {
            const orgName = a.org?.name || "Unaffiliated";
            return (
              <Card key={a.id} className={a.isPinned ? "border-yellow-400" : ""}>
                <CardContent className="pt-6 space-y-4">
                  {/* College name banner */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b">
                    <div className="flex items-center gap-2 min-w-0">
                      <OrgLogo
                        src={a.org?.logo}
                        name={orgName}
                        size="sm"
                        rounded="md"
                      />
                      <span className="text-sm font-semibold text-blue-900 truncate">
                        {orgName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {a.isPinned && (
                        <Badge className="bg-yellow-100 text-yellow-800 gap-1">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        View only
                      </Badge>
                    </div>
                  </div>

                  {/* Author + metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{a.author.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {a.author.role.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        · {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mt-2">{a.title}</h3>
                  </div>

                  {/* Content */}
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {a.content}
                  </p>

                  {/* Linked event */}
                  {a.event && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-md px-3 py-2 w-fit">
                      <Calendar className="h-3 w-3" />
                      Linked to event: <span className="font-medium">{a.event.title}</span>
                    </div>
                  )}

                  {/* Read-only engagement counts */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {a._count.comments} comment{a._count.comments === 1 ? "" : "s"}
                    </span>
                    <span>
                      {a._count.reactions} reaction{a._count.reactions === 1 ? "" : "s"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
