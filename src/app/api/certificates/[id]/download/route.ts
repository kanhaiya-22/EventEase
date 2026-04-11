import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const code = request.nextUrl.searchParams.get("code");

    const certificate = await db.certificate.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            venue: true,
            category: true,
            organizerId: true,
            org: {
              select: { name: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Authorization: the certificate owner, the event organizer, or an admin may download.
    const isOwner = certificate.userId === user.id;
    const isEventOrganizer = certificate.event.organizerId === user.id;
    const isAdmin = user.role === "ADMIN";
    if (!isOwner && !isEventOrganizer && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to download this certificate" },
        { status: 403 }
      );
    }

    // Admins and event organizers are trusted; the certificate owner must still
    // pass the verification code so cert IDs can't be guessed from another session.
    if (!isAdmin && !isEventOrganizer) {
      if (!code || code !== certificate.verificationCode) {
        return NextResponse.json(
          { error: "Verification code is required or invalid" },
          { status: 400 }
        );
      }
    }

    if (!certificate.issuedAt) {
      return NextResponse.json(
        { error: "This certificate has not been issued yet" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify/${certificate.verificationCode}`;

    const certificateHTML = generateCertificateHTML({
      studentName: certificate.user.name,
      studentDepartment: certificate.user.department,
      eventTitle: certificate.event.title,
      eventCategory: certificate.event.category,
      organizationName: certificate.event.org?.name || "EventEase",
      issuedDate: new Date(certificate.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      venue: certificate.event.venue,
      verificationCode: certificate.verificationCode,
      verifyUrl,
      eventDate: new Date(certificate.event.startDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      eventEndDate: certificate.event.endDate
        ? new Date(certificate.event.endDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      certificateId: certificate.id,
    });

    return new NextResponse(certificateHTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
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

interface CertificateData {
  studentName: string;
  studentDepartment: string | null;
  eventTitle: string;
  eventCategory: string;
  organizationName: string;
  issuedDate: string;
  venue: string;
  verificationCode: string;
  verifyUrl: string;
  eventDate: string;
  eventEndDate: string | null;
  certificateId: string;
}

function generateCertificateHTML(data: CertificateData): string {
  const e = escapeHtml;
  const serialNo = `EE-${data.certificateId.slice(0, 8).toUpperCase()}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate — ${e(data.studentName)} | ${e(data.eventTitle)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f1f5f9;
      padding: 40px 20px;
    }

    /* ── Action Buttons ── */
    .actions {
      display: flex;
      gap: 12px;
      margin-bottom: 28px;
    }

    .actions button {
      padding: 12px 32px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-print { background: #1e3a5f; color: white; }
    .btn-print:hover { background: #15294a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30,58,95,0.3); }
    .btn-save { background: #b8860b; color: white; }
    .btn-save:hover { background: #96700a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(184,134,11,0.3); }

    /* ── Certificate Frame — A4 landscape ── */
    .certificate-frame {
      width: 297mm;
      height: 210mm;
      background: #fffef9;
      border-radius: 4px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05);
      overflow: hidden;
      position: relative;
    }

    /* Subtle watermark background pattern */
    .certificate-frame::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 15% 50%, rgba(184,134,11,0.03) 0%, transparent 50%),
        radial-gradient(circle at 85% 50%, rgba(30,58,95,0.03) 0%, transparent 50%);
      pointer-events: none;
    }

    .certificate {
      width: 100%;
      height: 100%;
      position: relative;
    }

    /* ── Decorative Border System ── */
    .border-outer {
      position: absolute;
      inset: 12px;
      border: 2px solid #1e3a5f;
    }

    .border-inner {
      position: absolute;
      inset: 6px;
      border: 1px solid #c9a84c;
    }

    /* ── Corner Flourishes ── */
    .corner {
      position: absolute;
      width: 70px;
      height: 70px;
      z-index: 2;
    }
    .corner svg { width: 100%; height: 100%; }
    .corner-tl { top: 20px; left: 20px; }
    .corner-tr { top: 20px; right: 20px; transform: scaleX(-1); }
    .corner-bl { bottom: 20px; left: 20px; transform: scaleY(-1); }
    .corner-br { bottom: 20px; right: 20px; transform: scale(-1); }

    /* ── Main Content Grid ── */
    .cert-content {
      position: absolute;
      inset: 28px;
      display: flex;
      flex-direction: column;
      padding: 20px 60px 14px;
    }

    /* ── Top Accent Bar ── */
    .accent-bar {
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #1e3a5f, #c9a84c, #1e3a5f);
      border-radius: 2px;
      margin-bottom: 20px;
      flex-shrink: 0;
    }

    /* ── Header Section ── */
    .cert-header {
      text-align: center;
      flex-shrink: 0;
      margin-bottom: 8px;
    }

    .org-name {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #1e3a5f;
      margin-bottom: 12px;
    }

    .cert-title {
      font-family: 'Playfair Display', serif;
      font-size: 52px;
      font-weight: 900;
      color: #1e3a5f;
      letter-spacing: 6px;
      line-height: 1;
    }

    .title-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin: 10px 0 8px;
    }

    .title-divider .line {
      width: 80px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #c9a84c);
    }

    .title-divider .line:last-child {
      background: linear-gradient(90deg, #c9a84c, transparent);
    }

    .title-divider .diamond {
      width: 8px;
      height: 8px;
      background: #c9a84c;
      transform: rotate(45deg);
      flex-shrink: 0;
    }

    .cert-subtitle {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16px;
      font-weight: 600;
      color: #7a6c3a;
      letter-spacing: 4px;
      text-transform: uppercase;
    }

    /* ── Body — takes remaining space ── */
    .cert-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 6px;
      padding: 0 20px;
    }

    .preamble {
      font-family: 'Cormorant Garamond', serif;
      font-size: 18px;
      color: #666;
      font-style: italic;
    }

    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 700;
      color: #1e3a5f;
      padding: 4px 0 8px;
      position: relative;
    }

    .recipient-name::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #c9a84c, transparent);
    }

    .recipient-dept {
      font-size: 13px;
      color: #555;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 8px;
    }

    .description {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16px;
      color: #555;
      line-height: 1.7;
      max-width: 620px;
      margin-top: 10px;
    }

    .event-title {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: #1e3a5f;
      margin-top: 14px;
      padding: 10px 40px;
      background: linear-gradient(135deg, rgba(30,58,95,0.04), rgba(184,134,11,0.06));
      border-radius: 6px;
      border: 1px solid rgba(201,168,76,0.25);
    }

    /* ── Event Meta Row ── */
    .event-meta {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
    }

    .meta-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      background: #f8f6f0;
      border: 1px solid #e8e2d0;
      border-radius: 20px;
    }

    .meta-pill .icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      color: #b8860b;
    }

    .meta-pill .label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8a7a5a;
    }

    .meta-pill .value {
      font-size: 11px;
      font-weight: 500;
      color: #333;
    }

    /* ── Footer Section ── */
    .cert-footer {
      flex-shrink: 0;
    }

    /* ── Signatures ── */
    .signatures {
      display: flex;
      justify-content: space-between;
      padding: 0 60px;
      margin-bottom: 16px;
    }

    .sig-block {
      text-align: center;
      min-width: 180px;
    }

    .sig-line {
      width: 150px;
      height: 1px;
      background: #1e3a5f;
      margin: 0 auto 6px;
    }

    .sig-title {
      font-size: 11px;
      font-weight: 600;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .sig-org {
      font-size: 10px;
      color: #888;
      margin-top: 2px;
    }

    /* ── Verification Strip ── */
    .verification-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      background: linear-gradient(90deg, #f0fdf4, #f8fffe, #f0fdf4);
      border: 1px solid #bbf7d0;
      border-radius: 6px;
    }

    .verify-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .verify-badge {
      width: 32px;
      height: 32px;
      background: #dcfce7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .verify-badge svg {
      width: 18px;
      height: 18px;
    }

    .verify-info { line-height: 1.5; }

    .verify-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #16a34a;
    }

    .verify-code {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #1a1a1a;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .verify-center {
      font-size: 9px;
      color: #6b7280;
      text-align: center;
      line-height: 1.4;
    }

    .verify-center .serial {
      font-weight: 600;
      color: #374151;
    }

    .verify-right {
      text-align: right;
    }

    .verify-url-label {
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 2px;
    }

    .verify-url {
      font-size: 10px;
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    /* ── Bottom Accent ── */
    .bottom-accent {
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #1e3a5f, #c9a84c, #1e3a5f);
      border-radius: 2px;
      margin-top: 10px;
    }

    /* ── Print Styles ── */
    @page {
      size: A4 landscape;
      margin: 0;
    }

    @media print {
      html, body {
        width: 297mm;
        height: 210mm;
        background: white;
        padding: 0;
        margin: 0;
        overflow: hidden;
      }
      .actions { display: none !important; }
      .certificate-frame {
        width: 297mm;
        height: 210mm;
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="btn-print" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print
    </button>
    <button class="btn-save" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Save as PDF
    </button>
  </div>

  <div class="certificate-frame">
    <div class="certificate">
      <!-- Decorative Borders -->
      <div class="border-outer"></div>
      <div class="border-inner"></div>

      <!-- Corner Flourishes -->
      <div class="corner corner-tl">
        <svg viewBox="0 0 70 70" fill="none">
          <path d="M0 0h70v4H4v66H0V0z" fill="#1e3a5f" opacity="0.12"/>
          <path d="M8 8h40v2H10v40H8V8z" fill="#c9a84c" opacity="0.35"/>
          <circle cx="8" cy="8" r="3" fill="#c9a84c" opacity="0.4"/>
        </svg>
      </div>
      <div class="corner corner-tr">
        <svg viewBox="0 0 70 70" fill="none">
          <path d="M0 0h70v4H4v66H0V0z" fill="#1e3a5f" opacity="0.12"/>
          <path d="M8 8h40v2H10v40H8V8z" fill="#c9a84c" opacity="0.35"/>
          <circle cx="8" cy="8" r="3" fill="#c9a84c" opacity="0.4"/>
        </svg>
      </div>
      <div class="corner corner-bl">
        <svg viewBox="0 0 70 70" fill="none">
          <path d="M0 0h70v4H4v66H0V0z" fill="#1e3a5f" opacity="0.12"/>
          <path d="M8 8h40v2H10v40H8V8z" fill="#c9a84c" opacity="0.35"/>
          <circle cx="8" cy="8" r="3" fill="#c9a84c" opacity="0.4"/>
        </svg>
      </div>
      <div class="corner corner-br">
        <svg viewBox="0 0 70 70" fill="none">
          <path d="M0 0h70v4H4v66H0V0z" fill="#1e3a5f" opacity="0.12"/>
          <path d="M8 8h40v2H10v40H8V8z" fill="#c9a84c" opacity="0.35"/>
          <circle cx="8" cy="8" r="3" fill="#c9a84c" opacity="0.4"/>
        </svg>
      </div>

      <!-- Main Content -->
      <div class="cert-content">
        <div class="accent-bar"></div>

        <!-- Header -->
        <div class="cert-header">
          <div class="org-name">${e(data.organizationName)}</div>
          <div class="cert-title">CERTIFICATE</div>
          <div class="title-divider">
            <div class="line"></div>
            <div class="diamond"></div>
            <div class="line"></div>
          </div>
          <div class="cert-subtitle">of Participation &amp; Achievement</div>
        </div>

        <!-- Body -->
        <div class="cert-body">
          <div class="preamble">This is to certify that</div>
          <div class="recipient-name">${e(data.studentName)}</div>
          ${data.studentDepartment ? `<div class="recipient-dept">Department of ${e(data.studentDepartment)}</div>` : ""}
          <div class="description">
            has successfully participated in and completed all requirements of the following event organized by <strong>${e(data.organizationName)}</strong>.
          </div>
          <div class="event-title">${e(data.eventTitle)}</div>
          <div class="event-meta">
            <div class="meta-pill">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span class="value">${data.eventDate}${data.eventEndDate && data.eventEndDate !== data.eventDate ? ` — ${data.eventEndDate}` : ""}</span>
            </div>
            <div class="meta-pill">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span class="value">${e(data.venue)}</span>
            </div>
            <div class="meta-pill">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              <span class="value">${e(data.eventCategory)}</span>
            </div>
            <div class="meta-pill">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span class="label">Issued</span>
              <span class="value">${data.issuedDate}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="cert-footer">
          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-title">Event Coordinator</div>
              <div class="sig-org">${e(data.organizationName)}</div>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-title">Authorized Signatory</div>
              <div class="sig-org">${e(data.organizationName)}</div>
            </div>
          </div>

          <div class="verification-strip">
            <div class="verify-left">
              <div class="verify-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div class="verify-info">
                <div class="verify-label">Verification Code</div>
                <div class="verify-code">${e(data.verificationCode)}</div>
              </div>
            </div>
            <div class="verify-center">
              <div class="serial">Serial: ${serialNo}</div>
              Digitally issued by EventEase
            </div>
            <div class="verify-right">
              <div class="verify-url-label">Verify Online</div>
              <a href="${e(data.verifyUrl)}" class="verify-url">${e(data.verifyUrl)}</a>
            </div>
          </div>

          <div class="bottom-accent"></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
