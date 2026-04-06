"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Get all certificates for the authenticated user
 */
export async function getUserCertificates() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
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

    return {
      success: true,
      certificates,
      count: certificates.length,
    };
  } catch (error) {
    console.error("Error getting user certificates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get certificates",
    };
  }
}

/**
 * Get a specific certificate by ID
 */
export async function getCertificateById(certificateId: string) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const certificate = await db.certificate.findUnique({
      where: { id: certificateId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            venue: true,
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
    });

    if (!certificate) {
      return {
        success: false,
        error: "Certificate not found",
      };
    }

    // Check if user owns this certificate or is admin
    if (certificate.userId !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: "Access denied",
      };
    }

    return {
      success: true,
      certificate,
    };
  } catch (error) {
    console.error("Error getting certificate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get certificate",
    };
  }
}

/**
 * Create a certificate for a user (admin only)
 */
export async function createCertificate(
  userId: string,
  eventId: string,
  certificateUrl?: string,
  templateId?: string
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const admin = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can create certificates",
      };
    }

    // Check if certificate already exists
    const existingCert = await db.certificate.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existingCert) {
      return {
        success: false,
        error: "Certificate already exists for this user and event",
      };
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

    return {
      success: true,
      certificate,
    };
  } catch (error) {
    console.error("Error creating certificate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create certificate",
    };
  }
}

/**
 * Get certificate count for the authenticated user
 */
export async function getCertificateCount() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return {
        success: false,
        count: 0,
      };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        success: false,
        count: 0,
      };
    }

    const count = await db.certificate.count({
      where: { userId: user.id },
    });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error("Error getting certificate count:", error);
    return {
      success: false,
      count: 0,
    };
  }
}
