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
    title: "My Registrations",
    href: "/my-registrations",
    icon: "Ticket",
    roles: ["STUDENT"],
  },
  {
    title: "Check In",
    href: "/check-in",
    icon: "QrCode",
    roles: ["STUDENT"],
  },
  {
    title: "My Events",
    href: "/organized-events",
    icon: "ListTodo",
    roles: ["ORGANIZER", "ADMIN"],
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
