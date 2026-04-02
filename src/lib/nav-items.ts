import type { NavItem } from "@/types";

export const dashboardNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    title: "Events",
    href: "/events",
    icon: "Calendar",
  },
  {
    title: "Create Event",
    href: "/events/create",
    icon: "PlusCircle",
    roles: ["ORGANIZER", "ADMIN"],
  },
  {
    title: "My Certificates",
    href: "/certificates",
    icon: "Award",
    roles: ["STUDENT"],
  },
  {
    title: "Admin Panel",
    href: "/admin",
    icon: "Shield",
    roles: ["ADMIN"],
  },
];

export const publicNav: NavItem[] = [
  { title: "Events", href: "/events" },
  { title: "About", href: "#about" },
];
