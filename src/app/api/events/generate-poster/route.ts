import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const requestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().max(40).optional(),
  tags: z.array(z.string()).max(20).optional(),
  description: z.string().trim().max(1000).optional(),
  startDate: z.string().trim().max(40).optional(),
  venue: z.string().trim().max(120).optional(),
});

// Category → explicit color pair for the gradient. Pollinations is far more
// reliable with concrete color names than abstract palette hints.
const GRADIENT_BY_CATEGORY: Record<string, string> = {
  TECHNICAL: "deep midnight blue to electric cyan",
  CULTURAL: "deep royal purple to vivid magenta",
  WORKSHOP: "dark forest green to bright emerald",
  SEMINAR: "dark navy blue to soft teal",
  HACKATHON: "charcoal black to electric violet",
  SPORTS: "dark crimson red to warm orange",
  SOCIAL: "deep amber to coral pink",
  OTHER: "deep indigo to vibrant violet",
};

// Background only — NO text in the AI output. Title is overlaid via Cloudinary
// afterwards so spelling is guaranteed.
function buildBackgroundPrompt(input: { category?: string }): string {
  const cat = (input.category ?? "OTHER").toUpperCase();
  const gradient = GRADIENT_BY_CATEGORY[cat] ?? GRADIENT_BY_CATEGORY.OTHER;

  const parts: string[] = [
    "abstract poster background only",
    `smooth diagonal linear color gradient from ${gradient}`,
    "soft seamless blend between the two colors",
    "pure gradient fill covering the entire canvas edge to edge",
    "clean minimal flat design",
    "professional, calm, modern",
    "rich saturated colors with a slightly dark overall tone for white text legibility",
  ];

  parts.push(
    "absolutely no text",
    "no letters",
    "no words",
    "no numbers",
    "no typography",
    "no logos",
    "no watermarks",
    "no people",
    "no faces",
    "no objects",
    "no icons",
    "no illustrations",
    "no shapes",
    "no patterns",
    "no decorations",
    "no borders",
    "no noise",
    "no grain",
    "no texture",
    "landscape orientation 16:9",
  );

  return parts.join(", ");
}

function fontSizeForTitle(title: string): number {
  const len = title.length;
  if (len <= 15) return 130;
  if (len <= 25) return 110;
  if (len <= 40) return 90;
  if (len <= 60) return 70;
  return 56;
}

interface UploadResult {
  secure_url: string;
  public_id: string;
}

async function uploadBufferToCloudinary(
  buffer: Buffer,
  publicIdHint: string,
): Promise<UploadResult> {
  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "eventease/posters",
        public_id: `${Date.now()}-${publicIdHint
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 40)}`,
        quality: 90,
        format: "jpg",
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          secure_url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });
      },
    );
    stream.end(buffer);
  });
}

function sanitizeForOverlay(text: string): string {
  // Cloudinary text overlays choke on backslashes and stray newlines.
  // Spaces and most punctuation are fine — the SDK handles URL encoding.
  return text
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateForOverlay(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeForOverlay(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface OverlayLayout {
  category?: string;
  startDate?: string;
}

function buildPosterUrlWithTitle(
  publicId: string,
  title: string,
  layout: OverlayLayout,
): string {
  const fontSize = fontSizeForTitle(title);
  const safeTitle = sanitizeForOverlay(title);

  const dateLabel = formatDateForOverlay(layout.startDate);
  const timeLabel = formatTimeForOverlay(layout.startDate);
  const dateTimeLine = [dateLabel, timeLabel].filter(Boolean).join(" | ");
  const categoryLabel = layout.category
    ? sanitizeForOverlay(layout.category.toUpperCase())
    : null;

  const transformation: Record<string, unknown>[] = [
    // Force final landscape 1920x1080 + darken background so white text stays legible.
    {
      width: 1920,
      height: 1080,
      crop: "fill",
      gravity: "center",
      effect: "brightness:-30",
    },
  ];

  // Category badge — small, letter-spaced, in the top band (~120px from top).
  if (categoryLabel) {
    transformation.push({
      overlay: {
        font_family: "Arial",
        font_size: 38,
        font_weight: "bold",
        letter_spacing: 8,
        text: categoryLabel,
      },
      color: "white",
      opacity: 75,
    });
    transformation.push({
      flags: "layer_apply",
      gravity: "north",
      y: 120,
    });
  }

  // Title overlay — the hero, dead center.
  transformation.push({
    overlay: {
      font_family: "Arial",
      font_size: fontSize,
      font_weight: "bold",
      text: safeTitle,
    },
    color: "white",
    width: 1500,
    crop: "fit",
  });
  transformation.push({
    flags: "layer_apply",
    gravity: "center",
  });

  // Date + time line — bottom band (~130px from bottom).
  if (dateTimeLine) {
    transformation.push({
      overlay: {
        font_family: "Arial",
        font_size: 48,
        font_weight: "bold",
        text: sanitizeForOverlay(dateTimeLine),
      },
      color: "white",
    });
    transformation.push({
      flags: "layer_apply",
      gravity: "south",
      y: 130,
    });
  }

  return cloudinary.url(publicId, {
    secure: true,
    transformation,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, isVerified: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only organizers can generate posters" },
        { status: 403 },
      );
    }
    if (user.role === "ORGANIZER" && !user.isVerified) {
      return NextResponse.json(
        { error: "Your organizer account is pending verification" },
        { status: 403 },
      );
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Image storage is not configured on the server" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Please provide at least an event title.",
        },
        { status: 400 },
      );
    }

    const prompt = buildBackgroundPrompt(parsed.data);
    const seed = Math.floor(Math.random() * 1_000_000);
    const params = new URLSearchParams({
      width: "1280",
      height: "720",
      model: "flux",
      nologo: "true",
      enhance: "false",
      safe: "true",
      seed: String(seed),
    });
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt,
    )}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    let imgRes: Response;
    try {
      imgRes = await fetch(pollinationsUrl, {
        signal: controller.signal,
        headers: { Accept: "image/*" },
      });
    } catch (err) {
      clearTimeout(timeout);
      const aborted = err instanceof Error && err.name === "AbortError";
      return NextResponse.json(
        {
          error: aborted
            ? "Image generation timed out. Please try again."
            : "Could not reach the image generator. Please try again.",
        },
        { status: 502 },
      );
    }
    clearTimeout(timeout);

    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `Image generator returned ${imgRes.status}. Try again.` },
        { status: 502 },
      );
    }

    const contentType = imgRes.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Image generator returned unexpected content. Try again." },
        { status: 502 },
      );
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    if (arrayBuffer.byteLength < 1024) {
      return NextResponse.json(
        { error: "Image generator returned an empty image. Try again." },
        { status: 502 },
      );
    }
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary(buffer, parsed.data.title);
    const posterUrl = buildPosterUrlWithTitle(
      uploaded.public_id,
      parsed.data.title,
      {
        category: parsed.data.category,
        startDate: parsed.data.startDate,
      },
    );

    console.log("[generate-poster] final URL:", posterUrl);

    return NextResponse.json({ posterUrl });
  } catch (error: unknown) {
    console.error("Generate poster error:", error);
    return NextResponse.json(
      { error: "Failed to generate poster" },
      { status: 500 },
    );
  }
}
