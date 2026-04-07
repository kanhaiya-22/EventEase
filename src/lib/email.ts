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
  collegeName?: string
) {
  const collegeDisplay = collegeName || "EventEase";

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
            <h1 style="margin: 0; color: #ffffff;">Registration Confirmed!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
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
    subject: `Registration Confirmed - ${eventTitle}`,
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
