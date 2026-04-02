export type { Role, EventStatus, EventCategory, RegistrationStatus } from "@prisma/client";

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  roles?: ("STUDENT" | "ORGANIZER" | "ADMIN")[];
}
