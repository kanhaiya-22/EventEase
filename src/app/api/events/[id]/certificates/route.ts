import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendCertificateEmail } from "@/lib/email";

/**
 * Generate a unique verification code for certificate
 */
function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * POST /api/events/[id]/certificates
 * Batch issue certificates to students for an event (organizer only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Please provide valid student IDs" },
        { status: 400 }
      );
    }

    // Get event and verify organizer
    const event = await db.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, email: true },
        },
        org: {
          select: { name: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify user is organizer of this event
    if (event.organizer.id !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to issue certificates for this event" },
        { status: 403 }
      );
    }

    // Only students who are registered AND marked present
    const registrations = await db.registration.findMany({
      where: {
        eventId: id,
        user: {
          id: {
            in: studentIds,
          },
        },
        status: "CONFIRMED",
        attendance: { isNot: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: "No valid students found. Only students marked present can receive certificates." },
        { status: 400 }
      );
    }

    // Issue certificates for each student
    const createdCertificates = [];
    for (const registration of registrations) {
      try {
        // Generate a certificate URL (can be a placeholder or actual PDF generation URL)
        const verificationCode = generateVerificationCode();

        const certificate = await db.certificate.upsert({
          where: {
            userId_eventId: {
              userId: registration.user.id,
              eventId: id,
            },
          },
          create: {
            userId: registration.user.id,
            eventId: id,
            verificationCode,
          },
          update: {
            verificationCode,
            issuedAt: new Date(),
          },
        });

        // Generate certificate URL with the actual certificate ID
        const certificateUrl = `/api/certificates/${certificate.id}/download?code=${verificationCode}`;

        // Update the certificate with the correct URL
        await db.certificate.update({
          where: { id: certificate.id },
          data: { certificateUrl },
        });

        createdCertificates.push({
          certificateId: certificate.id,
          studentName: registration.user.name,
          studentEmail: registration.user.email,
          certificateUrl,
        });
      } catch (error) {
        console.error(
          `Error creating certificate for student ${registration.user.id}:`,
          error
        );
      }
    }

    // Send certificate email to each student
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    for (const cert of createdCertificates) {
      try {
        const downloadUrl = `${appUrl}${cert.certificateUrl}`;
        await sendCertificateEmail(
          cert.studentEmail,
          cert.studentName || "Student",
          event.title,
          downloadUrl,
          event.org?.name
        );
      } catch (emailError) {
        console.error(`Error sending certificate email to ${cert.studentEmail}:`, emailError);
      }
    }

    // Create notification for students
    for (const cert of createdCertificates) {
      try {
        await db.notification.create({
          data: {
            type: "CERTIFICATE_READY",
            title: "Certificate Issued",
            message: `Your certificate for ${event.title} is ready`,
            userId: registrations.find((r) => r.user.email === cert.studentEmail)
              ?.user.id as string,
            link: `/certificates`,
          },
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        count: createdCertificates.length,
        message: `Certificates issued to ${createdCertificates.length} student(s)`,
        certificates: createdCertificates,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error issuing certificates:", error);
    return NextResponse.json(
      {
        error: "Failed to issue certificates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/[id]/certificates
 * Get all certificates for an event (organizer only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get event and verify organizer
    const event = await db.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify user is organizer or admin
    if (event.organizer.id !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to view certificates for this event" },
        { status: 403 }
      );
    }

    // Get all certificates
    const certificates = await db.certificate.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json(
      {
        certificates,
        count: certificates.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch certificates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
