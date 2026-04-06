import { v2 as cloudinary } from "cloudinary";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface MigrationResult {
  filename: string;
  status: "success" | "error" | "skipped";
  cloudinaryUrl?: string;
  message: string;
}

/**
 * Migrate all local uploads to Cloudinary
 */
export async function migrateLocalUploadsToCloudinary(): Promise<{
  success: boolean;
  results: MigrationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
}> {
  const results: MigrationResult[] = [];
  const uploadsDir = join(process.cwd(), "public", "uploads");

  try {
    // Read all files from uploads directory
    const files = await readdir(uploadsDir);

    if (files.length === 0) {
      return {
        success: true,
        results: [],
        summary: { total: 0, successful: 0, failed: 0, skipped: 0 },
      };
    }

    for (const filename of files) {
      try {
        const filePath = join(uploadsDir, filename);

        // Determine file type
        const ext = filename.split(".").pop()?.toLowerCase() || "";
        let resourceType: "auto" | "image" | "video" | "raw" = "auto";
        let folder = "eventease/media";

        if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext)) {
          resourceType = "raw";
          folder = "eventease/documents";
        } else if (["mp4", "webm", "mov"].includes(ext)) {
          resourceType = "video";
          folder = "eventease/media";
        } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          resourceType = "image";
          folder = "eventease/media";
        }

        // Read file
        const fileBuffer = await readFile(filePath);

        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: resourceType,
              folder: folder,
              public_id: filename.replace(/\.[^/.]+$/, ""), // Remove extension
              overwrite: false,
            },
            (error, result) => {
              if (error) reject(error);
              resolve(result);
            }
          );

          stream.end(fileBuffer);
        });

        results.push({
          filename,
          status: "success",
          cloudinaryUrl: uploadResult.secure_url,
          message: `Successfully uploaded to ${uploadResult.public_id}`,
        });

        console.log(`✓ ${filename} uploaded successfully`);
      } catch (error) {
        results.push({
          filename,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(`✗ ${filename} failed:`, error);
      }
    }

    // Update database records
    console.log("\nUpdating database records...");
    for (const result of results) {
      if (result.status === "success" && result.cloudinaryUrl) {
        // Try to find and update events with this posterUrl
        try {
          await db.event.updateMany({
            where: {
              posterUrl: {
                contains: result.filename,
              },
            },
            data: {
              posterUrl: result.cloudinaryUrl,
            },
          });
          console.log(`✓ Updated event posterUrl for ${result.filename}`);
        } catch (e) {
          console.warn(`Could not update event for ${result.filename}`);
        }

        // Try to find and update certificates with this URL
        try {
          await db.certificate.updateMany({
            where: {
              certificateUrl: {
                contains: result.filename,
              },
            },
            data: {
              certificateUrl: result.cloudinaryUrl,
            },
          });
          console.log(`✓ Updated certificate URL for ${result.filename}`);
        } catch (e) {
          console.warn(`Could not update certificate for ${result.filename}`);
        }

        // Try to find and update users with this avatar
        try {
          await db.user.updateMany({
            where: {
              avatarUrl: {
                contains: result.filename,
              },
            },
            data: {
              avatarUrl: result.cloudinaryUrl,
            },
          });
          console.log(`✓ Updated user avatar for ${result.filename}`);
        } catch (e) {
          console.warn(`Could not update user avatar for ${result.filename}`);
        }
      }
    }

    const summary = {
      total: files.length,
      successful: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "error").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    };

    return {
      success: true,
      results,
      summary,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      success: false,
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status === "error").length,
        skipped: results.filter((r) => r.status === "skipped").length,
      },
    };
  }
}

/**
 * Get all local URLs in database that need migration
 */
export async function findLocalUrlsInDatabase() {
  const localUrls = {
    events: [] as any[],
    certificates: [] as any[],
    users: [] as any[],
  };

  try {
    // Find events with local URLs
    const eventsWithLocal = await db.event.findMany({
      where: {
        posterUrl: {
          contains: "/uploads/",
        },
      },
      select: {
        id: true,
        title: true,
        posterUrl: true,
      },
    });

    localUrls.events = eventsWithLocal;

    // Find certificates with local URLs
    const certificatesWithLocal = await db.certificate.findMany({
      where: {
        certificateUrl: {
          contains: "/uploads/",
        },
      },
      select: {
        id: true,
        certificateUrl: true,
      },
    });

    localUrls.certificates = certificatesWithLocal;

    // Find users with local avatar URLs
    const usersWithLocal = await db.user.findMany({
      where: {
        avatarUrl: {
          contains: "/uploads/",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    localUrls.users = usersWithLocal;

    console.log("Local URLs found:");
    console.log(`- Events: ${localUrls.events.length}`);
    console.log(`- Certificates: ${localUrls.certificates.length}`);
    console.log(`- Users: ${localUrls.users.length}`);

    return localUrls;
  } catch (error) {
    console.error("Error finding local URLs:", error);
    return localUrls;
  }
}
