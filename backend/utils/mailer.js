// ======================================================
// BREVO (formerly Sendinblue) TRANSACTIONAL EMAIL API
// ======================================================
// Render's free tier blocks outbound SMTP ports (465/587), so Gmail SMTP
// via Nodemailer times out there. Brevo sends over plain HTTPS instead,
// which is never blocked.
//
// Setup (one-time):
//   1. Sign up free at https://www.brevo.com
//   2. Go to Senders & IP > Senders > add & verify the email address
//      you want to send FROM (they email you a verification link)
//   3. Go to SMTP & API > API Keys > create a new API key
//   4. Set these env vars on Render:
//        BREVO_API_KEY = the API key from step 3
//        EMAIL_FROM    = the verified sender email from step 2

async function sendOtpEmail(toEmail, otp, name) {
  const greetingName = name ? name : "there";

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "Disha The Academy",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: toEmail }],
      subject: "Your password reset OTP - Disha The Academy",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a1a1a;">Password Reset Request</h2>
          <p>Hi ${greetingName},</p>
          <p>We received a request to reset your password. Use the OTP below to continue:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background: #f5f5f5; padding: 16px; text-align: center; border-radius: 6px; margin: 16px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">Disha The Academy</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }
}

module.exports = { sendOtpEmail };