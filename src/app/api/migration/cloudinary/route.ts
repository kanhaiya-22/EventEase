import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { migrateLocalUploadsToCloudinary, findLocalUrlsInDatabase } from "@/lib/migration";

/**
 * POST /api/migration/cloudinary
 * Migrate all local uploads to Cloudinary
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const { db } = await import("@/lib/db");
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can run migrations" },
        { status: 403 }
      );
    }

    const result = await migrateLocalUploadsToCloudinary();

    return NextResponse.json(
      {
        success: result.success,
        message: "Migration completed",
        summary: result.summary,
        results: result.results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migration/cloudinary
 * Check for local URLs that need migration
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const { db } = await import("@/lib/db");
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can check migration status" },
        { status: 403 }
      );
    }

    const localUrls = await findLocalUrlsInDatabase();

    return NextResponse.json(
      {
        status: "ready",
        message: "Found local URLs that need migration",
        data: localUrls,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check migration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Check failed",
      },
      { status: 500 }
    );
  }
}
