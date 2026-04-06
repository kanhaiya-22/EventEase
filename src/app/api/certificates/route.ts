import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendCertificateEmail } from "@/lib/email";

/**
 * GET /api/certificates
 * Retrieve certificates for the authenticated user
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

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const certificates = await db.certificate.findMany({
      where: { userId: user.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json(
      { certificates, count: certificates.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching certificates:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch certificates",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates
 * Create a certificate for a user (admin only)
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

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create certificates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, eventId, certificateUrl, templateId } = body;

    if (!userId || !eventId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, eventId" },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const existingCert = await db.certificate.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existingCert) {
      return NextResponse.json(
        { error: "Certificate already exists for this user and event" },
        { status: 409 }
      );
    }

    const certificate = await db.certificate.create({
      data: {
        userId,
        eventId,
        certificateUrl,
        templateId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            org: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send certificate email to the user
    try {
      if (certificateUrl) {
        await sendCertificateEmail(
          certificate.user.email,
          certificate.user.name || "User",
          certificate.event.title,
          certificateUrl
        );
      }
    } catch (emailError) {
      console.error("Error sending certificate email:", emailError);
      // Don't fail the certificate creation if email fails
    }

    return NextResponse.json(
      { certificate, message: "Certificate created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating certificate:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to create certificate",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
