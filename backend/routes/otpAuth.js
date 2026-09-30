const express = require("express");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const PendingSignup = require("../models/PendingSignup");
const { hashPassword, verifyPassword } = require("../utils/password");
const { sendOtpEmail } = require("../utils/mailer");
const {
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
  generateOtp,
  hashOtp,
  otpMatches,
  secondsSince,
  otpExpiryDate,
} = require("../utils/otp");
const { createToken, formatUser } = require("./auth");

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^[6-9]\d{9}$/;

// Set LOGIN_OTP_ENABLED=false in .env to turn off the login OTP
// (signup OTP always stays on).
const LOGIN_OTP_ENABLED =
  String(process.env.LOGIN_OTP_ENABLED || "true").toLowerCase() !== "false";

// ======================================================
// RATE LIMITS
// ======================================================

function limiter(max, minutes, message) {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });
}

const registerLimiter = limiter(
  10,
  15,
  "Too many signup attempts. Please try again after 15 minutes."
);
const loginLimiter = limiter(
  20,
  15,
  "Too many login attempts. Please try again after 15 minutes."
);
const otpVerifyLimiter = limiter(
  20,
  15,
  "Too many OTP attempts. Please try again after 15 minutes."
);
const otpResendLimiter = limiter(
  10,
  15,
  "Too many OTP requests. Please try again after 15 minutes."
);

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

// ======================================================
// REGISTER - STEP 1
// POST /api/register
// Validates the form, stores it as a PENDING signup and emails an OTP.
// The real account is NOT created yet.
// ======================================================

router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { name, fullName, email, mobile, password, confirmPassword } =
      req.body;

    const finalName = String(name || fullName || "").trim();
    const normalizedEmail = cleanEmail(email);
    const cleanMobile = String(mobile || "").trim();

    if (!finalName || !normalizedEmail || !cleanMobile || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    if (finalName.length < 2) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid full name" });
    }
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }
    if (!mobileRegex.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }
    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail })
      .select("_id")
      .lean();
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const pending = await PendingSignup.findOne({ email: normalizedEmail });
    if (
      pending &&
      secondsSince(pending.lastSentAt) < OTP_RESEND_COOLDOWN_SECONDS
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait a minute before requesting another OTP.",
      });
    }

    const otp = generateOtp();

    await PendingSignup.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          fullName: finalName,
          mobile: cleanMobile,
          passwordHash: hashPassword(String(password)),
          otpHash: hashOtp(otp, normalizedEmail, "signup"),
          otpExpiry: otpExpiryDate(),
          otpAttempts: 0,
          lastSentAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendOtpEmail(normalizedEmail, otp, finalName, "signup");
    } catch (mailError) {
      console.error("Failed to send signup OTP:", mailError.message);
      await PendingSignup.deleteOne({ email: normalizedEmail });
      return res.status(500).json({
        success: false,
        message: "Could not send OTP email right now. Please try again shortly.",
      });
    }

    return res.json({
      success: true,
      requiresOtp: true,
      email: normalizedEmail,
      message: "We sent a 6-digit OTP to your email.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Registration failed" });
  }
});

// ======================================================
// REGISTER - STEP 2
// POST /api/register/verify-otp   { email, otp }
// Creates the real account and logs the user in.
// ======================================================

router.post("/register/verify-otp", otpVerifyLimiter, async (req, res) => {
  try {
    const normalizedEmail = cleanEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!emailRegex.test(normalizedEmail) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the 6-digit OTP.",
      });
    }

    const pending = await PendingSignup.findOne({ email: normalizedEmail });

    if (!pending || pending.otpExpiry.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please sign up again.",
      });
    }

    if (pending.otpAttempts >= OTP_MAX_ATTEMPTS) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return res.status(400).json({
        success: false,
        message: "Too many wrong attempts. Please sign up again.",
      });
    }

    if (!otpMatches(pending.otpHash, otp, normalizedEmail, "signup")) {
      pending.otpAttempts += 1;
      await pending.save();
      const left = OTP_MAX_ATTEMPTS - pending.otpAttempts;
      return res.status(400).json({
        success: false,
        message:
          left > 0
            ? `Invalid OTP. ${left} attempt${left === 1 ? "" : "s"} left.`
            : "Too many wrong attempts. Please sign up again.",
      });
    }

    const existing = await User.findOne({ email: normalizedEmail })
      .select("_id")
      .lean();
    if (existing) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({
      fullName: pending.fullName,
      email: pending.email,
      mobile: pending.mobile,
      passwordHash: pending.passwordHash,
      authProvider: "local",
    });

    await PendingSignup.deleteOne({ _id: pending._id });

    return res.status(201).json({
      success: true,
      message: "Email verified. Account created successfully!",
      token: createToken(user),
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Register verify error:", error);
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Verification failed" });
  }
});

// ======================================================
// REGISTER - RESEND OTP
// POST /api/register/resend-otp   { email }
// ======================================================

router.post("/register/resend-otp", otpResendLimiter, async (req, res) => {
  try {
    const normalizedEmail = cleanEmail(req.body.email);

    const pending = await PendingSignup.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "Signup session expired. Please sign up again.",
      });
    }

    if (secondsSince(pending.lastSentAt) < OTP_RESEND_COOLDOWN_SECONDS) {
      return res.status(429).json({
        success: false,
        message: "Please wait a minute before requesting another OTP.",
      });
    }

    const otp = generateOtp();
    pending.otpHash = hashOtp(otp, normalizedEmail, "signup");
    pending.otpExpiry = otpExpiryDate();
    pending.otpAttempts = 0;
    pending.lastSentAt = new Date();
    pending.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await pending.save();

    try {
      await sendOtpEmail(normalizedEmail, otp, pending.fullName, "signup");
    } catch (mailError) {
      console.error("Failed to resend signup OTP:", mailError.message);
      return res.status(500).json({
        success: false,
        message: "Could not send OTP email right now. Please try again shortly.",
      });
    }

    return res.json({ success: true, message: "A new OTP has been sent." });
  } catch (error) {
    console.error("Register resend error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not resend OTP" });
  }
});

// ======================================================
// LOGIN - STEP 1
// POST /api/login   { email, password }
// Password is checked first. Only after a correct password is an OTP
// emailed (so strangers can't make us spam someone's inbox).
// ======================================================

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = cleanEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.isActive || !user.passwordHash) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!verifyPassword(String(password), user.passwordHash)) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!LOGIN_OTP_ENABLED) {
      return res.json({
        success: true,
        message: "Login successful",
        token: createToken(user),
        user: formatUser(user),
      });
    }

    if (
      user.loginOTPRequestedAt &&
      secondsSince(user.loginOTPRequestedAt) < OTP_RESEND_COOLDOWN_SECONDS &&
      user.loginOTPHash
    ) {
      // OTP was just sent - let the user enter it instead of blocking login.
      return res.json({
        success: true,
        requiresOtp: true,
        email: user.email,
        message: "Enter the OTP we already sent to your email.",
      });
    }

    const otp = generateOtp();
    user.loginOTPHash = hashOtp(otp, user.email, "login");
    user.loginOTPExpiry = otpExpiryDate();
    user.loginOTPRequestedAt = new Date();
    user.loginOTPAttempts = 0;
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, user.fullName, "login");
    } catch (mailError) {
      console.error("Failed to send login OTP:", mailError.message);
      user.loginOTPHash = null;
      user.loginOTPExpiry = null;
      user.loginOTPRequestedAt = null;
      await user.save();
      return res.status(500).json({
        success: false,
        message: "Could not send OTP email right now. Please try again shortly.",
      });
    }

    return res.json({
      success: true,
      requiresOtp: true,
      email: user.email,
      message: "We sent a 6-digit OTP to your email.",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

// ======================================================
// LOGIN - STEP 2
// POST /api/login/verify-otp   { email, otp }
// ======================================================

router.post("/login/verify-otp", otpVerifyLimiter, async (req, res) => {
  try {
    const normalizedEmail = cleanEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!emailRegex.test(normalizedEmail) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the 6-digit OTP.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    const expired =
      !user ||
      !user.loginOTPHash ||
      !user.loginOTPExpiry ||
      new Date(user.loginOTPExpiry).getTime() < Date.now();

    if (expired) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please log in again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is currently disabled",
      });
    }

    if ((user.loginOTPAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      user.loginOTPHash = null;
      user.loginOTPExpiry = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "Too many wrong attempts. Please log in again.",
      });
    }

    if (!otpMatches(user.loginOTPHash, otp, user.email, "login")) {
      user.loginOTPAttempts = (user.loginOTPAttempts || 0) + 1;
      await user.save();
      const left = OTP_MAX_ATTEMPTS - user.loginOTPAttempts;
      return res.status(400).json({
        success: false,
        message:
          left > 0
            ? `Invalid OTP. ${left} attempt${left === 1 ? "" : "s"} left.`
            : "Too many wrong attempts. Please log in again.",
      });
    }

    // Success - one-time use
    user.loginOTPHash = null;
    user.loginOTPExpiry = null;
    user.loginOTPRequestedAt = null;
    user.loginOTPAttempts = 0;
    await user.save();

    return res.json({
      success: true,
      message: "Login successful",
      token: createToken(user),
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login verify error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Verification failed" });
  }
});

// ======================================================
// LOGIN - RESEND OTP
// POST /api/login/resend-otp   { email }
// Always answers with the same generic message (no account enumeration).
// ======================================================

router.post("/login/resend-otp", otpResendLimiter, async (req, res) => {
  const generic = {
    success: true,
    message: "If a login is in progress, a new OTP has been sent.",
  };

  try {
    const normalizedEmail = cleanEmail(req.body.email);
    const user = await User.findOne({ email: normalizedEmail });

    // Only resend if a login OTP flow is already active for this account
    // (i.e. the password step was completed recently).
    if (
      !user ||
      !user.isActive ||
      !user.loginOTPHash ||
      !user.loginOTPExpiry ||
      new Date(user.loginOTPExpiry).getTime() < Date.now() ||
      secondsSince(user.loginOTPRequestedAt) < OTP_RESEND_COOLDOWN_SECONDS
    ) {
      return res.json(generic);
    }

    const otp = generateOtp();
    user.loginOTPHash = hashOtp(otp, user.email, "login");
    user.loginOTPExpiry = otpExpiryDate();
    user.loginOTPRequestedAt = new Date();
    user.loginOTPAttempts = 0;
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, user.fullName, "login");
    } catch (mailError) {
      console.error("Failed to resend login OTP:", mailError.message);
    }

    return res.json(generic);
  } catch (error) {
    console.error("Login resend error:", error);
    return res.json(generic);
  }
});

module.exports = router;