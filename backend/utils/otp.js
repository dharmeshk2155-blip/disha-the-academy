const crypto = require("crypto");

// ======================================================
// SHARED OTP HELPERS (signup + login verification)
// ======================================================

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// OTP is hashed with HMAC (secret = JWT_SECRET) and is bound to the
// purpose + email, so a signup OTP can never be used for login.
function hashOtp(otp, email, purpose) {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET || "")
    .update(`${purpose}:${String(email).toLowerCase()}:${String(otp).trim()}`)
    .digest("hex");
}

function otpMatches(storedHash, providedOtp, email, purpose) {
  if (!storedHash || !providedOtp) return false;
  try {
    const provided = hashOtp(providedOtp, email, purpose);
    const a = Buffer.from(storedHash, "hex");
    const b = Buffer.from(provided, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function secondsSince(date) {
  if (!date) return Infinity;
  return (Date.now() - new Date(date).getTime()) / 1000;
}

function otpExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
  generateOtp,
  hashOtp,
  otpMatches,
  secondsSince,
  otpExpiryDate,
};