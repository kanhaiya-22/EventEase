import { Resend } from "resend";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Get Resend instance with API key
 */
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set in environment variables");
  }
  return new Resend(apiKey);
}

/**
 * Send email using Resend service (or log in development mode)
 */
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    // Validate API key
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is missing in .env file");
      return {
        success: false,
        error: "RESEND_API_KEY is not configured",
      };
    }

    const resend = getResend();

    // In development mode, only send to TEST_EMAIL
    if (process.env.NODE_ENV === "development") {
      const testEmail = process.env.TEST_EMAIL;
      if (!testEmail) {
        console.warn("⚠️  TEST_EMAIL not configured in .env");
        return { success: false, error: "TEST_EMAIL not configured" };
      }

      // Only send to verified test email in development
      if (to !== testEmail) {
        console.log(
          `📧 [DEV MODE] Email would be sent to ${to}, but redirecting to ${testEmail}`
        );
      } else {
        console.log(`📧 [DEV MODE] Sending email to ${to}`);
      }

      console.log(`🔑 Using Resend API Key: ${process.env.RESEND_API_KEY?.substring(0, 10)}...`);

      // Use Resend's test domain (onboarding@resend.dev) for development
      const result = await resend.emails.send({
        from: "onboarding@resend.dev", // Use Resend's test domain
        to: testEmail,
        subject: `[TEST] ${subject}`,
        html,
      });

      if (result.error) {
        console.error("❌ Email send error:", result.error);
        return { success: false, error: result.error };
      }

      console.log("✅ Email sent successfully!");
      return { success: true, data: result.data };
    }

    // Production: send to actual recipient
    const result = await resend.emails.send({
      from: "noreply@eventease.com",
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("❌ Email send error:", result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmation(
  email: string,
  name: string,
  eventTitle: string,
  eventDetails?: {
    startDate: Date;
    endDate: Date;
    venue: string;
    category?: string;
  },
  collegeName?: string,
  options?: { wasPromoted?: boolean }
) {
  const collegeDisplay = collegeName || "EventEase";
  const wasPromoted = options?.wasPromoted === true;

  const startStr = eventDetails
    ? new Date(eventDetails.startDate).toLocaleString("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      })
    : "";
  const endStr = eventDetails
    ? new Date(eventDetails.endDate).toLocaleString("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      })
    : "";

  const eventDetailsBlock = eventDetails
    ? `
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px;"><strong>Event:</strong> ${eventTitle}</p>
              <p style="margin: 0 0 8px;"><strong>Start:</strong> ${startStr}</p>
              <p style="margin: 0 0 8px;"><strong>End:</strong> ${endStr}</p>
              <p style="margin: 0 0 8px;"><strong>Venue:</strong> ${eventDetails.venue}</p>
              ${eventDetails.category ? `<p style="margin: 0;"><strong>Category:</strong> ${eventDetails.category}</p>` : ""}
            </div>`
    : "";

  const promotedBanner = wasPromoted
    ? `
            <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 0 0 18px;">
              <p style="margin: 0; color: #065f46;"><strong>Good news!</strong> A spot opened up and you've been moved off the waitlist. Your seat is now confirmed.</p>
            </div>`
    : "";

  const headerTitle = wasPromoted ? "You're In!" : "Registration Confirmed!";
  const subjectPrefix = wasPromoted ? "You're confirmed" : "Registration Confirmed";

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #415a77; color: #ffffff; padding: 16px 30px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #ffffff;">${collegeDisplay}</h2>
          </div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; color: #ffffff;">${headerTitle}</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
            ${promotedBanner}
            <p>Thank you for registering for <strong>${eventTitle}</strong>.</p>
            ${eventDetailsBlock}
            <p>Your registration has been successfully confirmed. You can now access the event details and check-in when the event starts.</p>
            <p>Make sure to:</p>
            <ul>
              <li>Save this email for future reference</li>
              <li>Check your dashboard for event updates</li>
              <li>Arrive on time for the event</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 12px 30px; background: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Your Dashboard</a>
          </div>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 13px; color: #666;">&copy; 2026 ${collegeDisplay} &middot; Powered by EventEase</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${subjectPrefix} - ${eventTitle}`,
    html,
  });
}

/**
 * Send "you've been added to the waitlist" email
 */
export async function sendWaitlistJoinedEmail(
  email: string,
  name: string,
  eventTitle: string,
  position: number,
  collegeName?: string
) {
  const collegeDisplay = collegeName || "EventEase";
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #415a77; color: #ffffff; padding: 16px 30px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #ffffff;">${collegeDisplay}</h2>
          </div>
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; color: #ffffff;">You're on the Waitlist</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
            <p><strong>${eventTitle}</strong> is currently full, but you've been added to the waitlist.</p>
            <div style="background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 6px; color: #92400e;"><strong>Your position:</strong> #${position}</p>
              <p style="margin: 0; font-size: 14px; color: #555;">If a spot opens up, you'll be promoted automatically and notified by email.</p>
            </div>
            <p>You can leave the waitlist any time from your dashboard.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-registrations" style="display: inline-block; padding: 12px 30px; background: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px;">View My Registrations</a>
          </div>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 13px; color: #666;">&copy; 2026 ${collegeDisplay} &middot; Powered by EventEase</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Waitlisted for ${eventTitle}`,
    html,
  });
}

/**
 * Send certificate issued email
 */
export async function sendCertificateEmail(
  email: string,
  name: string,
  eventTitle: string,
  certificateUrl: string,
  collegeName?: string
) {
  const collegeDisplay = collegeName || "EventEase";
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #415a77; color: #ffffff; padding: 16px 30px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #ffffff;">${collegeDisplay}</h2>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; color: #ffffff;">Congratulations!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
            <p>Great news! Your certificate for <strong>${eventTitle}</strong> has been issued.</p>
            <p>This email contains your official certificate. You can now download, print, or share it.</p>
            <div style="text-align: center; margin: 20px 0;">
              <p>Your certificate is ready:</p>
              <a href="${certificateUrl}" style="display: inline-block; padding: 12px 30px; background: #f5576c; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Download Certificate</a>
            </div>
            <p>You can also view all your certificates in your dashboard.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/certificates" style="display: inline-block; padding: 12px 30px; background: #f5576c; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px;">View All Certificates</a>
          </div>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 13px; color: #666;">&copy; 2026 ${collegeDisplay} &middot; Powered by EventEase</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Certificate Issued - ${eventTitle}`,
    html,
  });
}

/**
 * Send event reminder email
 */
export async function sendEventReminder(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  collegeName?: string
) {
  const collegeDisplay = collegeName || "EventEase";
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #415a77; color: #ffffff; padding: 16px 30px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #ffffff;">${collegeDisplay}</h2>
          </div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; color: #ffffff;">Upcoming Event Reminder</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
            <p>This is a reminder that the event you registered for is coming up!</p>
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p><strong>Event:</strong> ${eventTitle}</p>
              <p style="font-size: 18px; color: #667eea; font-weight: bold;">Date: ${eventDate}</p>
            </div>
            <p>Don't forget to join us! See you there!</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 12px 30px; background: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Event Details</a>
          </div>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 13px; color: #666;">&copy; 2026 ${collegeDisplay} &middot; Powered by EventEase</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Reminder: ${eventTitle} is coming up!`,
    html,
  });
}

/**
 * Send organizer approval email
 */
export async function sendOrganizerApprovalEmail(
  email: string,
  name: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #415a77; color: #ffffff; padding: 16px 30px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #ffffff;">EventEase</h2>
          </div>
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; color: #ffffff;">Account Verified!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
            <p>Great news! Your organizer account on <strong>EventEase</strong> has been verified by an admin.</p>
            <p>You can now log in and start creating and managing events on the platform.</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; padding: 14px 35px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Log In Now</a>
            </div>
            <p>As an organizer, you can:</p>
            <ul>
              <li>Create and manage events</li>
              <li>Track registrations and attendance</li>
              <li>Issue certificates to participants</li>
              <li>Post announcements for your events</li>
            </ul>
          </div>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 13px; color: #666;">&copy; 2026 EventEase</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Your Organizer Account Has Been Verified - EventEase",
    html,
  });
}

/**
 * Send organizer rejection email
 */
export async function sendOrganizerRejectionEmail(
  email: string,
  name: string,
  reason?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #415a77; color: #ffffff; padding: 16px 30px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #ffffff;">EventEase</h2>
          </div>
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; color: #ffffff;">Organizer Request Update</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
            <p>We regret to inform you that your organizer account request on <strong>EventEase</strong> has not been approved at this time.</p>
            ${reason ? `
            <div style="background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
            </div>` : ""}
            <p>You can still use EventEase as a student to browse events and register for them. If you believe this decision was made in error, please reach out to the platform administrator.</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; padding: 14px 35px; background: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Browse Events</a>
            </div>
          </div>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 13px; color: #666;">&copy; 2026 EventEase</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Organizer Request Update - EventEase",
    html,
  });
}

/**
 * Send registration cancellation confirmation email
 */
export async function sendRegistrationCancellation(
  email: string,
  name: string,
  eventTitle: string,
  collegeName?: string
) {
  const collegeDisplay = collegeName || "EventEase";
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #415a77; color: #ffffff; padding: 16px 30px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #ffffff;">${collegeDisplay}</h2>
          </div>
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; color: #ffffff;">Registration Cancelled</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
            <p>Your registration for <strong>${eventTitle}</strong> has been successfully cancelled.</p>
            <p>If this was a mistake, you can re-register for the event from the events page (subject to availability).</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" style="display: inline-block; padding: 12px 30px; background: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Browse Events</a>
          </div>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 13px; color: #666;">&copy; 2026 ${collegeDisplay} &middot; Powered by EventEase</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Registration Cancelled - ${eventTitle}`,
    html,
  });
}
