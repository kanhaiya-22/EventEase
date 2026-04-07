import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract Cloudinary public_id and resource_type from a secure_url
function getSignedUrl(originalUrl: string): string {
  try {
    const urlObj = new URL(originalUrl);
    const pathname = urlObj.pathname;
    // Cloudinary URLs: /image|video|raw/upload/v{version}/{public_id.ext}
    const uploadMatch = pathname.match(
      /\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/
    );
    if (uploadMatch) {
      const resourceType = uploadMatch[1] as "image" | "video" | "raw";
      const publicId = uploadMatch[2];
      return cloudinary.url(publicId, {
        resource_type: resourceType,
        sign_url: true,
        type: "authenticated",
        secure: true,
      });
    }
  } catch {
    // Fall through to return original
  }
  return originalUrl;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");
    const name = searchParams.get("name");

    if (!url) {
      return NextResponse.json(
        { error: "Missing URL parameter" },
        { status: 400 }
      );
    }

    // Try fetching the original URL first (works for public access_mode)
    let response = await fetch(url, {
      headers: { "User-Agent": "EventEase/1.0" },
    });

    // If blocked (e.g. token-protected), retry with a signed URL
    if (!response.ok && (response.status === 401 || response.status === 403)) {
      const signed = getSignedUrl(url);
      response = await fetch(signed, {
        headers: { "User-Agent": "EventEase/1.0" },
      });
    }

    if (!response.ok) {
      console.error(
        `Cloudinary fetch failed: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        {
          error: `Failed to download document (${response.status})`,
        },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("Content-Type") || "application/octet-stream";

    // Ensure filename has proper extension
    let filename = name || "document";
    if (contentType === "application/pdf" && !filename.endsWith(".pdf")) {
      filename += ".pdf";
    } else if (
      contentType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      if (!filename.endsWith(".docx")) filename += ".docx";
    }

    // Set proper headers for download
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": buffer.byteLength.toString(),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=3600",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to download document",
      },
      { status: 500 }
    );
  }
}





