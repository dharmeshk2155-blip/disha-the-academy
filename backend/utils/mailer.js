const nodemailer = require("nodemailer");

// ======================================================
// GMAIL SMTP TRANSPORTER
// ======================================================
// Requires two env vars (set these on your host, e.g. Vercel/Render):
//   EMAIL_USER = your Gmail address, e.g. dishatheacademy@gmail.com
//   EMAIL_PASS = a 16-character Gmail "App Password" (NOT your normal
//                Gmail login password — see note below)
//
// How to get an App Password:
//   1. Go to https://myaccount.google.com/security
//   2. Turn on 2-Step Verification (required first)
//   3. Go to https://myaccount.google.com/apppasswords
//   4. Create an app password for "Mail" and copy the 16-character code
//   5. Use that code as EMAIL_PASS

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      "EMAIL_USER / EMAIL_PASS env vars are missing. Forgot-password emails will fail."
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

// ======================================================
// SEND OTP EMAIL
// ======================================================

async function sendOtpEmail(toEmail, otp, name) {
  const mailer = getTransporter();

  const greetingName = name ? name : "there";

  await mailer.sendMail({
    from: `"Disha The Academy" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your password reset OTP - Disha The Academy",
    html: `
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
  });
}

module.exports = { sendOtpEmail };