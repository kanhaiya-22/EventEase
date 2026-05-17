import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().optional(),
  year: z.string().optional(),
  phone: z.string().optional(),
  interests: z.array(z.string()).default([]),
  // Set only by unaffiliated users during onboarding. Maps to a slug in college-domain-map.
  organizationSlug: z.string().min(1).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
