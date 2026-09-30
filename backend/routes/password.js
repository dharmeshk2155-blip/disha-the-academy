const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const User = require("../models/User");
const { hashPassword } = require("../utils/password");
const { sendOtpEmail } = require("../utils/mailer");

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

// Extra protection against spam / brute force (per IP)
function limiter(max, minutes, message) {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });
}

const forgotLimiter = limiter(
  10,
  15,
  "Too many OTP requests. Please try again after 15 minutes."
);
const resetLimiter = limiter(
  20,
  15,
  "Too many attempts. Please try again after 15 minutes."
);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ======================================================
// HELPERS
// ======================================================

function generateOtp() {
  // Always generates a 6-digit OTP
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");
}

function otpHashesMatch(storedHash, providedOtp) {
  if (!storedHash || !providedOtp) {
    return false;
  }

  try {
    const providedHash = hashOtp(
      String(providedOtp).trim()
    );

    const storedBuffer =
      Buffer.from(
        storedHash,
        "hex"
      );

    const providedBuffer =
      Buffer.from(
        providedHash,
        "hex"
      );

    if (
      storedBuffer.length !==
      providedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      storedBuffer,
      providedBuffer
    );
  } catch {
    return false;
  }
}

// ======================================================
// STEP 1: REQUEST OTP
// POST /api/forgot-password
// body: { email }
// ======================================================

router.post(
  "/forgot-password",
  forgotLimiter,
  async (req, res) => {
    try {
      const { email } = req.body;

      if (
        !email ||
        !emailRegex.test(
          String(email).trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      // Generic response prevents attackers
      // from checking which emails are registered.
      const genericResponse = {
        success: true,
        message:
          "If that email is registered, an OTP has been sent to it.",
      };

      // ------------------------------------------
      // FIND USER IN MONGODB
      // ------------------------------------------

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res.json(
          genericResponse
        );
      }

      // ------------------------------------------
      // RESEND COOLDOWN
      // ------------------------------------------

      if (
        user.resetOTPRequestedAt
      ) {
        const secondsSinceLastRequest =
          (
            Date.now() -
            new Date(
              user.resetOTPRequestedAt
            ).getTime()
          ) / 1000;

        if (
          secondsSinceLastRequest >=
            0 &&
          secondsSinceLastRequest <
            OTP_RESEND_COOLDOWN_SECONDS
        ) {
          return res
            .status(429)
            .json({
              success: false,
              message:
                "Please wait a bit before requesting another OTP.",
            });
        }
      }

      // ------------------------------------------
      // GENERATE OTP
      // ------------------------------------------

      const otp =
        generateOtp();

      const otpHash =
        hashOtp(otp);

      const expiryDate =
        new Date(
          Date.now() +
            OTP_EXPIRY_MINUTES *
              60 *
              1000
        );

      // ------------------------------------------
      // SAVE HASH ONLY
      // Raw OTP is NOT stored in MongoDB
      // ------------------------------------------

      user.resetOTPHash =
        otpHash;

      user.resetOTPExpiry =
        expiryDate;

      user.resetOTPRequestedAt =
        new Date();

      // New OTP = fresh set of attempts
      user.resetOTPAttempts = 0;

      await user.save();

      // ------------------------------------------
      // SEND OTP EMAIL
      // ------------------------------------------

      try {
        await sendOtpEmail(
          user.email,
          otp,
          user.fullName
        );
      } catch (mailError) {
        console.error(
          "Failed to send OTP email:",
          mailError.message
        );

        // Email failed, so invalidate the OTP
        user.resetOTPHash = null;
        user.resetOTPExpiry =
          null;
        user.resetOTPRequestedAt =
          null;

        await user.save();

        return res
          .status(500)
          .json({
            success: false,
            message:
              "Could not send OTP email right now. Please try again shortly.",
          });
      }

      return res.json(
        genericResponse
      );
    } catch (error) {
      console.error(
        "Forgot-password error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Something went wrong. Please try again.",
        });
    }
  }
);

// ======================================================
// STEP 2: VERIFY OTP + SET NEW PASSWORD
// POST /api/reset-password
//
// body:
// {
//   email,
//   otp,
//   newPassword
// }
// ======================================================

router.post(
  "/reset-password",
  resetLimiter,
  async (req, res) => {
    try {
      const {
        email,
        otp,
        newPassword,
      } = req.body;

      // ------------------------------------------
      // VALIDATION
      // ------------------------------------------

      if (
        !email ||
        !otp ||
        !newPassword
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Email, OTP and new password are all required",
          });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      if (
        !emailRegex.test(
          normalizedEmail
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Please enter a valid email address",
          });
      }

      if (
        String(newPassword)
          .length < 6
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Password must be at least 6 characters long",
          });
      }

      // ------------------------------------------
      // FIND USER
      // ------------------------------------------

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid or expired OTP",
          });
      }

      // ------------------------------------------
      // VERIFY OTP
      // ------------------------------------------

      const notExpired =
        user.resetOTPExpiry &&
        new Date(
          user.resetOTPExpiry
        ).getTime() >
          Date.now();

      if (!user.resetOTPHash || !notExpired) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid or expired OTP",
          });
      }

      // ------------------------------------------
      // ATTEMPT LIMIT (max 5 tries per OTP)
      // The attempt is counted atomically BEFORE the
      // OTP is checked, so many parallel guesses
      // cannot get around the limit.
      // ------------------------------------------

      const attemptedUser =
        await User.findOneAndUpdate(
          {
            _id: user._id,
            resetOTPHash:
              user.resetOTPHash,
          },
          {
            $inc: {
              resetOTPAttempts: 1,
            },
          },
          { new: true }
        );

      // OTP was replaced or cleared in the meantime
      if (!attemptedUser) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid or expired OTP",
          });
      }

      const tooManyMessage =
        "Too many wrong attempts. Please request a new OTP.";

      async function lockOtp() {
        // Keep resetOTPRequestedAt so the 60-second
        // resend cooldown still applies.
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              resetOTPHash: null,
              resetOTPExpiry: null,
              resetOTPAttempts: 0,
            },
          }
        );
      }

      if (
        attemptedUser.resetOTPAttempts >
        OTP_MAX_ATTEMPTS
      ) {
        await lockOtp();

        return res
          .status(400)
          .json({
            success: false,
            message: tooManyMessage,
          });
      }

      // ------------------------------------------
      // VERIFY OTP
      // ------------------------------------------

      const otpMatches =
        otpHashesMatch(
          user.resetOTPHash,
          otp
        );

      if (!otpMatches) {
        const attemptsLeft =
          OTP_MAX_ATTEMPTS -
          attemptedUser.resetOTPAttempts;

        if (attemptsLeft <= 0) {
          await lockOtp();

          return res
            .status(400)
            .json({
              success: false,
              message: tooManyMessage,
            });
        }

        return res
          .status(400)
          .json({
            success: false,
            message: `Invalid OTP. ${attemptsLeft} attempt${
              attemptsLeft === 1 ? "" : "s"
            } left.`,
          });
      }

      // ------------------------------------------
      // HASH NEW PASSWORD
      // ------------------------------------------

      const passwordHash =
        hashPassword(
          String(newPassword)
        );

      // ------------------------------------------
      // UPDATE USER
      // ------------------------------------------

      user.passwordHash =
        passwordHash;

      // Clear OTP after successful reset
      user.resetOTPHash = null;
      user.resetOTPExpiry = null;
      user.resetOTPRequestedAt =
        null;
      user.resetOTPAttempts = 0;

      await user.save();

      return res.json({
        success: true,
        message:
          "Password reset successful. You can now log in.",
      });
    } catch (error) {
      console.error(
        "Reset-password error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Something went wrong. Please try again.",
        });
    }
  }
);

module.exports = router;