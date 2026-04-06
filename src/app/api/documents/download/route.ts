import { NextRequest, NextResponse } from "next/server";

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

    console.log("Downloading document from:", url);

    // Fetch the file from Cloudinary with authentication headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": "EventEase/1.0",
      },
    });

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





