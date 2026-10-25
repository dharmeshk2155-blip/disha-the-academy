// ======================================================
// BREVO (formerly Sendinblue) TRANSACTIONAL EMAIL API
// ======================================================
// Render's free tier blocks outbound SMTP ports (465/587), so Gmail SMTP
// via Nodemailer times out there. Brevo sends over plain HTTPS instead.
//
// Env vars: BREVO_API_KEY, EMAIL_FROM (verified sender in Brevo)

const PURPOSES = {
  reset: {
    subject: "Your password reset OTP - Disha The Academy",
    heading: "Password Reset Request",
    intro:
      "We received a request to reset your password. Use the OTP below to continue:",
  },
  signup: {
    subject: "Verify your email - Disha The Academy",
    heading: "Verify Your Email",
    intro:
      "Welcome to Disha The Academy! Use the OTP below to verify your email and finish creating your account:",
  },
  login: {
    subject: "Your login OTP - Disha The Academy",
    heading: "Login Verification",
    intro:
      "Someone is trying to log in to your account. Use the OTP below to continue:",
  },
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendOtpEmail(toEmail, otp, name, purpose = "reset") {
  const config = PURPOSES[purpose] || PURPOSES.reset;
  const greetingName = name ? escapeHtml(name) : "there";

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
      subject: config.subject,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a1a1a;">${config.heading}</h2>
          <p>Hi ${greetingName},</p>
          <p>${config.intro}</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background: #f5f5f5; padding: 16px; text-align: center; border-radius: 6px; margin: 16px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>. Never share it with anyone. If this wasn't you, you can safely ignore this email.</p>
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

// "Your live test starts soon" reminder
async function sendLiveReminderEmail(toEmail, name, { title, startsAtText, minutesLeft, link, durationMinutes }) {
  const greetingName = name ? escapeHtml(name) : "there";
  const when =
    minutesLeft >= 50 ? "in about 1 hour" : `in about ${Math.max(1, Math.round(minutesLeft))} minutes`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "Disha The Academy", email: process.env.EMAIL_FROM },
      to: [{ email: toEmail }],
      subject: `Live test starts ${when}: ${title}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a1a1a;">Your live test starts ${when}</h2>
          <p>Hi ${greetingName},</p>
          <p>You registered for the live test <strong>${escapeHtml(title)}</strong>.</p>
          <p><strong>Starts:</strong> ${escapeHtml(startsAtText)}<br>
             <strong>Duration:</strong> ${Number(durationMinutes) || 0} minutes</p>
          <p style="margin: 22px 0;">
            <a href="${escapeHtml(link)}" style="background:#0b5ed7;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold;">Open Live Tests</a>
          </p>
          <p>The test ends at a fixed time for everyone, so please join on time.</p>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">Disha The Academy</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`Brevo API error (${response.status}): ${errorBody}`);
    error.status = response.status;
    throw error;
  }
}

module.exports = { sendOtpEmail, sendLiveReminderEmail };