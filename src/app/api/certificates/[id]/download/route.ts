import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/certificates/[id]/download?code={verificationCode}
 * Download a certificate (PDF placeholder or actual file)
 * 
 * Security:
 * - Requires authentication
 * - User can only download their own certificate
 * - Verification code must match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get the verification code from query params
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Find and validate the certificate
    const certificate = await db.certificate.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        verificationCode: code,
      },
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

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found or verification code is invalid" },
        { status: 404 }
      );
    }

    // Check if certificate has been issued
    if (!certificate.issuedAt) {
      return NextResponse.json(
        { error: "This certificate has not been issued yet" },
        { status: 400 }
      );
    }

    // Generate a simple HTML-based certificate
    // In a production app, you might want to:
    // 1. Generate a PDF using a library like jsPDF or puppeteer
    // 2. Serve a pre-generated certificate file
    // 3. Use a dedicated certificate generation service
    
    const certificateHTML = generateCertificateHTML(
      certificate.user.name,
      certificate.event.title,
      certificate.event.org?.name || "Event Organizer",
      new Date(certificate.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      certificate.event.venue,
      certificate.verificationCode,
      new Date(certificate.event.startDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    // For now, return as HTML. In production, convert to PDF
    return new NextResponse(certificateHTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // If you want browsers to download instead of view:
        // "Content-Disposition": `attachment; filename="certificate-${certificate.id}.html"`,
      },
    });
  } catch (error) {
    console.error("Certificate download error:", error);
    return NextResponse.json(
      { error: "Failed to download certificate" },
      { status: 500 }
    );
  }
}

/**
 * Generate a professional HTML certificate
 * Includes official elements like verification codes, venue, event dates
 */
function generateCertificateHTML(
  studentName: string,
  eventTitle: string,
  organizationName: string,
  issuedDate: string,
  venue: string,
  verificationCode: string,
  eventDate: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Certificate</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Georgia', serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          padding: 20px;
        }
        
        .certificate {
          width: 100%;
          max-width: 1000px;
          aspect-ratio: 16 / 10;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 5px solid #c9a961;
          border-radius: 15px;
          padding: 50px 60px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(201, 169, 97, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(201, 169, 97, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .certificate::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(201, 169, 97, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .container {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #c9a961;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        
        .org-badge {
          display: inline-block;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1px;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        
        .header h1 {
          color: #1e3c72;
          font-size: 48px;
          margin: 10px 0;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-weight: bold;
        }
        
        .header p {
          color: #c9a961;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 2px;
        }
        
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          gap: 15px;
          padding: 20px 0;
        }
        
        .statement {
          color: #333;
          font-size: 16px;
          line-height: 1.8;
        }
        
        .student-name {
          font-size: 42px;
          color: #1e3c72;
          font-weight: bold;
          margin: 15px 0;
          position: relative;
          display: inline-block;
          width: 100%;
        }
        
        .student-name::after {
          content: '';
          display: block;
          width: 60%;
          max-width: 400px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #c9a961, transparent);
          margin: 12px auto 0;
        }
        
        .achievement {
          font-size: 15px;
          color: #555;
          line-height: 1.6;
          font-style: italic;
        }
        
        .event-title {
          font-size: 22px;
          font-weight: bold;
          color: #2a5298;
          margin: 12px 0;
          padding: 15px;
          background: rgba(201, 169, 97, 0.1);
          border-left: 4px solid #c9a961;
          border-radius: 4px;
        }
        
        .event-details {
          display: flex;
          justify-content: center;
          gap: 40px;
          font-size: 12px;
          color: #666;
          margin: 12px 0;
          padding: 12px;
          background: rgba(42, 82, 152, 0.05);
          border-radius: 6px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .detail-label {
          font-weight: bold;
          color: #1e3c72;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .detail-value {
          color: #333;
          font-size: 13px;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
          border-top: 2px solid #c9a961;
          padding-top: 20px;
        }
        
        .footer-section {
          flex: 1;
          text-align: center;
          font-size: 11px;
        }
        
        .signature-area {
          flex: 1;
        }
        
        .signature-line {
          width: 120px;
          border-top: 2px solid #333;
          margin: 20px auto 5px;
        }
        
        .signature-title {
          font-weight: bold;
          color: #1e3c72;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 8px;
        }
        
        .org-name {
          font-weight: bold;
          color: #1e3c72;
          font-size: 12px;
          margin-bottom: 5px;
        }
        
        .verification-code {
          font-size: 10px;
          color: #999;
          font-family: 'Courier New', monospace;
          margin-top: 12px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 4px;
          word-break: break-all;
        }
        
        .verification-label {
          font-size: 9px;
          color: #666;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 3px;
        }
        
        .ribbon {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 80px 80px 0;
          border-color: transparent #c9a961 transparent transparent;
          z-index: 2;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .certificate {
            box-shadow: none;
            max-width: 100%;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="ribbon"></div>
        
        <div class="container">
          <div class="header">
            <div class="org-badge">🎓 Official Certificate</div>
            <h1>Certificate</h1>
            <p>of Attendance & Recognition</p>
          </div>
          
          <div class="content">
            <div class="statement">This is to certify that</div>
            
            <div class="student-name">${escapeHtml(studentName)}</div>
            
            <div class="achievement">
              has successfully participated in and attended
            </div>
            
            <div class="event-title">${escapeHtml(eventTitle)}</div>
            
            <div class="event-details">
              <div class="detail-item">
                <span class="detail-label">📍 Venue</span>
                <span class="detail-value">${escapeHtml(venue || "On-site")}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">📅 Event Date</span>
                <span class="detail-value">${eventDate}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">🏢 Organized By</span>
                <span class="detail-value">${escapeHtml(organizationName)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="signature-area footer-section">
              <div class="org-name">${escapeHtml(organizationName)}</div>
              <div class="signature-line"></div>
              <div class="signature-title">Authorized Signatory</div>
            </div>
            
            <div class="footer-section">
              <div style="margin-bottom: 15px;">
                <div class="detail-label" style="margin-bottom: 4px;">Certificate ID</div>
                <div class="verification-code">${verificationCode}</div>
              </div>
            </div>
            
            <div class="footer-section">
              <div class="detail-label" style="margin-bottom: 6px;">Date of Issue</div>
              <div style="font-size: 13px; color: #333; font-weight: 500;">${issuedDate}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
