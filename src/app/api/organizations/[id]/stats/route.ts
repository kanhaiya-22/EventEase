import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const org = await db.organization.findUnique({ where: { id } });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const [userCount, eventCount, registrationCount, eventsByStatus, usersByRole] =
      await Promise.all([
        db.user.count({ where: { orgId: id } }),
        db.event.count({ where: { orgId: id } }),
        db.registration.count({ where: { event: { orgId: id } } }),
        db.event.groupBy({
          by: ["status"],
          where: { orgId: id },
          _count: true,
        }),
        db.user.groupBy({
          by: ["role"],
          where: { orgId: id },
          _count: true,
        }),
      ]);

    return NextResponse.json({
      userCount,
      eventCount,
      registrationCount,
      eventsByStatus: eventsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      usersByRole: usersByRole.map((r) => ({
        role: r.role,
        count: r._count,
      })),
    });
  } catch (error) {
    console.error("Error fetching organization stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
