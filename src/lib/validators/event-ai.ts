import { z } from "zod";

export const EVENT_CATEGORIES = [
  "TECHNICAL",
  "CULTURAL",
  "WORKSHOP",
  "SEMINAR",
  "HACKATHON",
  "SPORTS",
  "SOCIAL",
  "OTHER",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const aiSuggestRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, "Please describe your event idea in at least 10 characters")
    .max(1000, "Keep your idea under 1000 characters"),
});

export const aiSuggestResponseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(6000),
  category: z.enum(EVENT_CATEGORIES),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  suggestedCapacity: z.number().int().min(1).max(100000),
  suggestedStartDate: z.string().min(1),
  suggestedEndDate: z.string().min(1),
  venue: z.string().min(2).max(300),
});

export type AiSuggestRequest = z.infer<typeof aiSuggestRequestSchema>;
export type AiSuggestResponse = z.infer<typeof aiSuggestResponseSchema>;
