import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = await db.event.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                department: true,
                year: true,
                phone: true,
              },
            },
            attendance: {
              select: {
                checkedInAt: true,
                method: true,
              },
            },
          },
          orderBy: { registeredAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Build CSV
    const headers = ["Name", "Email", "Department", "Year", "Phone", "Status", "Registered At", "Attended", "Check-in Time", "Check-in Method"];
    const rows = event.registrations.map((reg) => [
      escapeCsv(reg.user.name),
      escapeCsv(reg.user.email),
      escapeCsv(reg.user.department || ""),
      escapeCsv(reg.user.year || ""),
      escapeCsv(reg.user.phone || ""),
      reg.status,
      new Date(reg.registeredAt).toLocaleString("en-IN"),
      reg.attendance ? "Yes" : "No",
      reg.attendance ? new Date(reg.attendance.checkedInAt).toLocaleString("en-IN") : "",
      reg.attendance?.method || "",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}_registrations.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
