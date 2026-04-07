import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "media"; // "media" or "document"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file types based on type parameter
    let allowedTypes: string[] = [];
    let maxSize: number;
    let resourceType: "auto" | "image" | "video" | "raw" = "auto";

    if (type === "document") {
      allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
      ];
      maxSize = 20 * 1024 * 1024; // 20MB for documents
      resourceType = "raw"; // Use 'raw' for documents - this makes them publicly accessible
    } else {
      allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];
      maxSize = file.type.startsWith("video/") ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      resourceType = file.type.startsWith("video/") ? "video" : "image";
    }

    if (!allowedTypes.includes(file.type)) {
      const fileTypes = type === "document"
        ? "PDF, Word, Excel, PowerPoint, or TXT files"
        : "images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV)";
      return NextResponse.json(
        { error: `Invalid file type. Only ${fileTypes} are allowed.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size must be less than ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: `eventease/${type}`,
          public_id: `${Date.now()}-${file.name.replace(/\s+/g, "-").split(".")[0]}`,
          quality: type === "document" ? undefined : 80,
          // Ensure documents are publicly accessible
          ...(type === "document" && { access_mode: "public" }),
          ...(file.type.startsWith("video/") && {
            eager: [{ width: 300, height: 300, crop: "fill" }],
          }),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error: any, result: any) => {
          if (error) reject(error);
          resolve(result);
        }
      );

      stream.end(buffer);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = uploadResult as any;

    return NextResponse.json(
      {
        success: true,
        fileUrl: result.secure_url,
        fileName: result.public_id,
        cloudinaryId: result.public_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
