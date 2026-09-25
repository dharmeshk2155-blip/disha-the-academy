const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const { sql, connectDB } = require("../db");
const { hashPassword } = require("../utils/password");
const { sendOtpEmail } = require("../utils/mailer");

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateOtp() {
  // 6-digit numeric OTP, always 6 digits (no leading-zero truncation)
  return crypto.randomInt(100000, 1000000).toString();
}

// ======================================================
// STEP 1: REQUEST OTP
// POST /api/forgot-password   { email }
// ======================================================

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pool = await connectDB();

    const userResult = await pool
      .request()
      .input("Email", sql.NVarChar(150), normalizedEmail)
      .query(`
        SELECT Id, Name, Email, ResetOTPExpiry
        FROM dbo.Users
        WHERE Email = @Email
      `);

    // Always return a generic success message, even if the email doesn't
    // exist — this stops attackers from using this endpoint to find out
    // which emails are registered.
    const genericResponse = {
      success: true,
      message: "If that email is registered, an OTP has been sent to it.",
    };

    if (userResult.recordset.length === 0) {
      return res.json(genericResponse);
    }

    const user = userResult.recordset[0];

    // Basic resend cooldown so the same user can't spam OTP requests
    if (user.ResetOTPExpiry) {
      const expiry = new Date(user.ResetOTPExpiry);
      const secondsSinceLastOtp =
        OTP_EXPIRY_MINUTES * 60 - (expiry - new Date()) / 1000;

      if (
        secondsSinceLastOtp >= 0 &&
        secondsSinceLastOtp < OTP_RESEND_COOLDOWN_SECONDS
      ) {
        return res.status(429).json({
          success: false,
          message: "Please wait a bit before requesting another OTP.",
        });
      }
    }

    const otp = generateOtp();
    const expiryDate = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    await pool
      .request()
      .input("Email", sql.NVarChar(150), normalizedEmail)
      .input("ResetOTP", sql.NVarChar(10), otp)
      .input("ResetOTPExpiry", sql.DateTime, expiryDate)
      .query(`
        UPDATE dbo.Users
        SET ResetOTP = @ResetOTP, ResetOTPExpiry = @ResetOTPExpiry
        WHERE Email = @Email
      `);

    try {
      await sendOtpEmail(user.Email, otp, user.Name);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr.message);
      return res.status(500).json({
        success: false,
        message:
          "Could not send OTP email right now. Please try again shortly.",
      });
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error("Forgot-password error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

// ======================================================
// STEP 2: VERIFY OTP + SET NEW PASSWORD
// POST /api/reset-password   { email, otp, newPassword }
// ======================================================

router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are all required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pool = await connectDB();

    const userResult = await pool
      .request()
      .input("Email", sql.NVarChar(150), normalizedEmail)
      .query(`
        SELECT Id, ResetOTP, ResetOTPExpiry
        FROM dbo.Users
        WHERE Email = @Email
      `);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = userResult.recordset[0];

    const otpMatches =
      user.ResetOTP && user.ResetOTP === otp.trim();

    const notExpired =
      user.ResetOTPExpiry && new Date(user.ResetOTPExpiry) > new Date();

    if (!otpMatches || !notExpired) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const passwordHash = hashPassword(newPassword);

    await pool
      .request()
      .input("Email", sql.NVarChar(150), normalizedEmail)
      .input("PasswordHash", sql.NVarChar(255), passwordHash)
      .query(`
        UPDATE dbo.Users
        SET PasswordHash = @PasswordHash,
            ResetOTP = NULL,
            ResetOTPExpiry = NULL
        WHERE Email = @Email
      `);

    return res.json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("Reset-password error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;