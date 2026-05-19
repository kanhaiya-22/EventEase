"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Award,
  Shield,
  LogOut,
  Menu,
  X,
  Ticket,
  QrCode,
  ListTodo,
  User,
  Bell,
  Copy,
  Download,
  Building2,
  Megaphone,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrgLogo } from "@/components/ui/org-logo";
import { dashboardNav } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

interface SidebarProps {
  org?: {
    name: string;
    logo: string | null;
  } | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Award,
  Shield,
  Ticket,
  QrCode,
  ListTodo,
  User,
  Bell,
  Copy,
  Download,
  Building2,
  Megaphone,
  UserCheck,
  MessageSquare,
};

export function Sidebar({ org }: SidebarProps = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRole = (session?.user as { role?: string })?.role;

  const filteredNav = dashboardNav.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole as "STUDENT" | "ORGANIZER" | "ADMIN"))
  );

  const navContent = (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <Logo size="sm" />
      </div>

      {org && (
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <OrgLogo src={org.logo} name={org.name} size="sm" rounded="md" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              College
            </p>
            <p className="truncate text-sm font-medium">{org.name}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-3">
        {filteredNav.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] : null;
          // Exact match, or starts-with but only if no other nav item is a closer match
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href + "/") &&
              !filteredNav.some(
                (other) =>
                  other.href !== item.href &&
                  other.href.startsWith(item.href + "/") &&
                  (pathname === other.href || pathname.startsWith(other.href + "/"))
              ));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-8 w-8">
            {session?.user?.image && <AvatarImage src={session.user.image} />}
            <AvatarFallback>
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{userRole}</p>
          </div>
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
