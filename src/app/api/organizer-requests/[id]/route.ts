import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOrganizerApprovalEmail, sendOrganizerRejectionEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, rejectionReason } = body as {
    action: "APPROVED" | "REJECTED";
    rejectionReason?: string;
  };

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const request = await db.organizerRequest.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  // Update the request status
  await db.organizerRequest.update({
    where: { id },
    data: {
      status: action,
      reviewerId: admin.id,
      reviewedAt: new Date(),
      rejectionReason: action === "REJECTED" ? rejectionReason : null,
    },
  });

  if (action === "APPROVED") {
    // Verify the organizer
    await db.user.update({
      where: { id: request.userId },
      data: { isVerified: true },
    });

    // Notify the organizer
    await db.notification.create({
      data: {
        userId: request.userId,
        type: "ORGANIZER_APPROVED",
        title: "Organizer Account Approved",
        message: "Your organizer account has been verified. You can now log in and start creating events.",
        link: "/login",
      },
    });

    // Send approval email
    await sendOrganizerApprovalEmail(request.user.email, request.user.name);
  } else {
    // Notify the organizer about rejection
    await db.notification.create({
      data: {
        userId: request.userId,
        type: "ORGANIZER_REJECTED",
        title: "Organizer Request Rejected",
        message: rejectionReason || "Your organizer request has been rejected. Please contact admin for more details.",
        link: "/login",
      },
    });

    // Send rejection email
    await sendOrganizerRejectionEmail(
      request.user.email,
      request.user.name,
      rejectionReason
    );
  }

  return NextResponse.json({ success: true });
}
