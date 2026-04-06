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
  eventTitle: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for registering for <strong>${eventTitle}</strong>.</p>
            <p>Your registration has been successfully confirmed. You can now access the event details and check-in when the event starts.</p>
            <p>Make sure to:</p>
            <ul>
              <li>Save this email for future reference</li>
              <li>Check your dashboard for event updates</li>
              <li>Arrive on time for the event</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Your Dashboard</a>
          </div>
          <div class="footer">
            <p>© 2026 EventEase. All rights reserved.</p>
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
  certificateUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .btn { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .certificate-preview { text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Congratulations!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Great news! Your certificate for <strong>${eventTitle}</strong> has been issued.</p>
            <p>This email contains your official certificate. You can now download, print, or share it.</p>
            <div class="certificate-preview">
              <p>Your certificate is ready:</p>
              <a href="${certificateUrl}" class="btn">Download Certificate</a>
            </div>
            <p>You can also view all your certificates in your dashboard.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/certificates" class="btn">View All Certificates</a>
          </div>
          <div class="footer">
            <p>© 2026 EventEase. All rights reserved.</p>
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
  eventDate: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .event-date { font-size: 18px; color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Upcoming Event Reminder</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>This is a reminder that the event you registered for is coming up!</p>
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p><strong>Event:</strong> ${eventTitle}</p>
              <p class="event-date">Date: ${eventDate}</p>
            </div>
            <p>Don't forget to join us! See you there!</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Event Details</a>
          </div>
          <div class="footer">
            <p>© 2026 EventEase. All rights reserved.</p>
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
