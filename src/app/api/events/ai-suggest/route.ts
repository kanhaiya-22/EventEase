import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  aiSuggestRequestSchema,
  aiSuggestResponseSchema,
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/validators/event-ai";

const groq = new Groq({ apiKey: process.env.CHATBOT_API_KEY });

const SYSTEM_PROMPT = `You are an event-planning copilot for EventEase, a college event management platform.

You convert a one-line organizer idea into a complete, well-structured event draft. The organizer will review and edit your output before publishing, so be specific and confident — do not hedge.

## Output rules
Return ONLY a single JSON object matching this exact shape — no prose, no markdown, no code fences:

{
  "title": string (3-100 chars, no quotes inside, no emojis),
  "description": string (2-4 short paragraphs, 100-220 words total. Plain prose only, no markdown headings, no bullet points. Cover: what the event is, who it's for, what attendees will gain, and a clear call to action.),
  "category": one of "TECHNICAL" | "CULTURAL" | "WORKSHOP" | "SEMINAR" | "HACKATHON" | "SPORTS" | "SOCIAL" | "OTHER" (MUST be UPPERCASE, exactly as listed),
  "tags": array of 3-6 short lowercase strings (single or hyphenated words, no leading #, e.g. ["web3", "blockchain", "workshop"]),
  "suggestedCapacity": integer (NOT a string — just a number like 100, not "100"),
  "suggestedStartDate": string in format "YYYY-MM-DDTHH:MM:00" (24-hour time, no timezone, no trailing Z),
  "suggestedEndDate": string in format "YYYY-MM-DDTHH:MM:00" (must be after suggestedStartDate),
  "venue": string (a plausible on-campus venue — auditorium, seminar hall, lab, ground, etc.)
}

## Date inference
- If the organizer's prompt mentions a relative date ("next Saturday", "this Friday", "tomorrow"), resolve it from the CURRENT DATE provided below.
- If no date is mentioned, pick a Saturday afternoon 2-3 weeks from the current date.
- Workshops/seminars: ~3-4 hours. Hackathons: 24-36 hours. Cultural fests: 1-3 days. Sports: 4-6 hours. Default: 3 hours.

## Capacity grounding
If the organizer's org has past similar events, prefer a number close to the median capacity of that category. Otherwise pick: workshops 30-80, seminars 100-200, hackathons 100-300, cultural 200-500, sports 50-150.

## Tone for description
- Active voice, second person ("you'll", "join us"), enthusiastic but professional.
- Keep it tight — 100-220 words is enough.
- Do not include exact dates, venue, or capacity in the description body — those are separate fields.

Return ONLY the JSON object. Nothing else. No code fences. No explanation.`;

interface PastEventSummary {
  title: string;
  category: string;
  capacity: number;
  venue: string;
  durationHours: number;
}

function buildGroundingContext(
  pastEvents: PastEventSummary[],
  currentDate: string,
): string {
  const lines: string[] = [`CURRENT DATE: ${currentDate}`];

  if (pastEvents.length === 0) {
    lines.push("ORG HISTORY: No prior events for this organization yet.");
    return lines.join("\n");
  }

  lines.push("\nORG HISTORY (last events from this college, for grounding):");
  pastEvents.forEach((e, i) => {
    lines.push(
      `${i + 1}. "${e.title}" — ${e.category}, capacity ${e.capacity}, venue "${e.venue}", ~${e.durationHours}h`,
    );
  });

  const byCategory = new Map<string, number[]>();
  for (const e of pastEvents) {
    if (!byCategory.has(e.category)) byCategory.set(e.category, []);
    byCategory.get(e.category)!.push(e.capacity);
  }
  const medians: string[] = [];
  for (const [cat, caps] of byCategory) {
    const sorted = [...caps].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    medians.push(`${cat}: ~${median}`);
  }
  if (medians.length > 0) {
    lines.push(`\nMedian capacity by category: ${medians.join(", ")}`);
  }

  return lines.join("\n");
}

function clampString(s: unknown, min: number, max: number, fallback: string): string {
  if (typeof s !== "string") return fallback;
  const trimmed = s.trim();
  if (trimmed.length < min) return fallback;
  if (trimmed.length > max) return trimmed.slice(0, max).trim();
  return trimmed;
}

function normalizeCategory(raw: unknown): EventCategory {
  if (typeof raw !== "string") return "OTHER";
  const upper = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const match = (EVENT_CATEGORIES as readonly string[]).includes(upper)
    ? (upper as EventCategory)
    : null;
  if (match) return match;
  const heuristics: Array<[RegExp, EventCategory]> = [
    [/HACK/, "HACKATHON"],
    [/WORK|TRAIN/, "WORKSHOP"],
    [/SEMI|LECT|TALK/, "SEMINAR"],
    [/TECH|CODE|DEV/, "TECHNICAL"],
    [/CULT|FEST|MUSIC|DANCE/, "CULTURAL"],
    [/SPORT|GAME|MATCH/, "SPORTS"],
    [/SOCIAL|MEET|NETWORK/, "SOCIAL"],
  ];
  for (const [re, cat] of heuristics) {
    if (re.test(upper)) return cat;
  }
  return "OTHER";
}

function normalizeTags(raw: unknown): string[] {
  let arr: string[] = [];
  if (Array.isArray(raw)) {
    arr = raw.filter((t): t is string => typeof t === "string");
  } else if (typeof raw === "string") {
    arr = raw.split(/[,;]/);
  }
  const cleaned = arr
    .map((t) => t.trim().replace(/^#+/, "").toLowerCase())
    .filter((t) => t.length > 0 && t.length <= 40);
  return Array.from(new Set(cleaned)).slice(0, 12);
}

function normalizeCapacity(raw: unknown, fallback: number): number {
  let n: number | null = null;
  if (typeof raw === "number") n = raw;
  else if (typeof raw === "string") {
    const parsed = parseInt(raw.replace(/[^\d]/g, ""), 10);
    if (!isNaN(parsed)) n = parsed;
  }
  if (n === null || !Number.isFinite(n)) return fallback;
  n = Math.round(n);
  if (n < 1) return fallback;
  if (n > 100000) return 100000;
  return n;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatLocalIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function normalizeDate(raw: unknown, fallback: Date): string {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const isoMatch = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(trimmed);
    if (isoMatch) {
      return `${isoMatch[1]}T${isoMatch[2]}:${isoMatch[3]}:00`;
    }
    const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(trimmed);
    if (dateOnly) {
      return `${dateOnly[1]}T10:00:00`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return formatLocalIso(d);
  }
  return formatLocalIso(fallback);
}

function defaultFutureDate(daysAhead: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function normalizeAiOutput(raw: Record<string, unknown>) {
  const fallbackStart = defaultFutureDate(14, 14);
  const fallbackEnd = new Date(fallbackStart.getTime() + 3 * 60 * 60 * 1000);

  const category = normalizeCategory(raw.category);
  const defaultCapByCategory: Record<EventCategory, number> = {
    TECHNICAL: 100,
    CULTURAL: 200,
    WORKSHOP: 60,
    SEMINAR: 100,
    HACKATHON: 150,
    SPORTS: 80,
    SOCIAL: 100,
    OTHER: 80,
  };

  const startStr = normalizeDate(raw.suggestedStartDate, fallbackStart);
  let endStr = normalizeDate(raw.suggestedEndDate, fallbackEnd);

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  if (
    !isNaN(startDate.getTime()) &&
    !isNaN(endDate.getTime()) &&
    endDate <= startDate
  ) {
    const fixed = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
    endStr = formatLocalIso(fixed);
  }

  return {
    title: clampString(raw.title, 3, 200, "Untitled Event"),
    description: clampString(
      raw.description,
      10,
      6000,
      "Join us for an exciting event! More details will be shared soon.",
    ),
    category,
    tags: normalizeTags(raw.tags),
    suggestedCapacity: normalizeCapacity(
      raw.suggestedCapacity,
      defaultCapByCategory[category],
    ),
    suggestedStartDate: startStr,
    suggestedEndDate: endStr,
    venue: clampString(raw.venue, 2, 300, "Main Auditorium"),
  };
}

function tryExtractJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    // fall through
  }
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1].trim());
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      // fall through
    }
  }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      const parsed = JSON.parse(raw.slice(first, last + 1));
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      // fall through
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, isVerified: true, orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only organizers can use AI assist" },
        { status: 403 },
      );
    }

    if (user.role === "ORGANIZER" && !user.isVerified) {
      return NextResponse.json(
        { error: "Your organizer account is pending verification" },
        { status: 403 },
      );
    }

    if (!process.env.CHATBOT_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const parsed = aiSuggestRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const pastEvents = user.orgId
      ? await db.event.findMany({
          where: {
            orgId: user.orgId,
            status: { in: ["PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"] },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            title: true,
            category: true,
            capacity: true,
            venue: true,
            startDate: true,
            endDate: true,
          },
        })
      : [];

    const pastEventSummaries: PastEventSummary[] = pastEvents.map((e) => ({
      title: e.title,
      category: e.category,
      capacity: e.capacity,
      venue: e.venue,
      durationHours: Math.max(
        1,
        Math.round(
          (e.endDate.getTime() - e.startDate.getTime()) / (1000 * 60 * 60),
        ),
      ),
    }));

    const currentDate = new Date().toISOString().slice(0, 10);
    const groundingContext = buildGroundingContext(
      pastEventSummaries,
      currentDate,
    );

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: groundingContext },
        { role: "user", content: `Event idea: ${parsed.data.prompt}` },
      ],
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "AI returned an empty response. Try again." },
        { status: 502 },
      );
    }

    const extracted = tryExtractJson(raw);
    if (!extracted) {
      console.error("AI suggest: unparseable output", raw.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned malformed output. Try again." },
        { status: 502 },
      );
    }

    const normalized = normalizeAiOutput(extracted);
    const validated = aiSuggestResponseSchema.safeParse(normalized);
    if (!validated.success) {
      console.error(
        "AI suggest: normalized output still invalid",
        validated.error.issues,
        normalized,
      );
      return NextResponse.json({ suggestion: normalized });
    }

    return NextResponse.json({ suggestion: validated.data });
  } catch (error: unknown) {
    console.error("AI suggest error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
      return NextResponse.json(
        { error: "AI is busy right now. Please try again in a minute." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 },
    );
  }
}
