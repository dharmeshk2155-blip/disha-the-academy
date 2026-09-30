const crypto = require("crypto");
const express = require("express");
const rateLimit = require("express-rate-limit");

const Admin = require("../models/Admin");
const requireAdmin = require("../middleware/requireAdmin");
const { hashPassword, verifyPassword } = require("../utils/password");
const {
  ADMIN_TOKEN_TTL_SECONDS,
  signAdminToken,
} = require("../utils/adminToken");

const router = express.Router();

// ======================================================
// SETTINGS
// ======================================================

const MAX_FAILED_ATTEMPTS = 5; // wrong passwords before the account locks
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // old failures are forgotten after this
const LOCK_MS = 15 * 60 * 1000; // how long a locked account stays locked

// Same message for every failure (wrong email, wrong password,
// locked, disabled) so nobody can find out which admin emails exist.
const LOGIN_FAILED_MESSAGE =
  "Invalid email or password. After 5 wrong attempts the account is locked for 15 minutes.";

// Used to spend the same time on unknown/locked accounts as on real
// ones (scrypt is slow), so response time does not leak anything.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString("hex"));

// ======================================================
// RATE LIMIT - per IP
// Only failed logins count (skipSuccessfulRequests), so a real
// admin is never blocked by their own successful logins.
// This is the FIRST layer; the per-account lock below is the
// second one and cannot be dodged by changing IP.
// ======================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many admin login attempts. Please try again after 15 minutes.",
  },
});

// ======================================================
// ADMIN LOGIN
// POST /api/admin/login   { email, password }
// ======================================================

router.post("/login", loginLimiter, async (req, res) => {
  const fail = () =>
    res.status(401).json({
      success: false,
      message: LOGIN_FAILED_MESSAGE,
    });

  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (email.length > 150 || password.length > 200) {
      return fail();
    }

    const now = new Date();

    // ---------------------------------------------------
    // 1) Housekeeping: forget an expired lock, and forget
    //    old failures once the attempt window has passed.
    //    (Each is one atomic update; running it twice in
    //    parallel is harmless.)
    // ---------------------------------------------------
    await Admin.updateOne(
      {
        email,
        $or: [
          { lockUntil: { $lte: now } },
          {
            lockUntil: null,
            loginAttempts: { $gt: 0 },
            lastAttemptAt: {
              $lte: new Date(now.getTime() - ATTEMPT_WINDOW_MS),
            },
          },
        ],
      },
      { $set: { lockUntil: null, loginAttempts: 0 } }
    );

    // ---------------------------------------------------
    // 2) Claim ONE attempt atomically BEFORE checking the
    //    password. The "loginAttempts < MAX" condition is
    //    inside the same query, so even 100 parallel guesses
    //    can only ever get MAX claims - the rest get null.
    // ---------------------------------------------------
    const admin = await Admin.findOneAndUpdate(
      {
        email,
        isActive: true,
        lockUntil: null,
        loginAttempts: { $lt: MAX_FAILED_ATTEMPTS },
      },
      {
        $inc: { loginAttempts: 1 },
        $set: { lastAttemptAt: now },
      },
      { new: true }
    );

    // Unknown email, disabled account, or currently locked
    if (!admin) {
      verifyPassword(password, DUMMY_HASH);
      return fail();
    }

    // ---------------------------------------------------
    // 3) Check the password
    // ---------------------------------------------------
    if (!verifyPassword(password, admin.passwordHash)) {
      // That was the last allowed attempt -> lock the account
      if (admin.loginAttempts >= MAX_FAILED_ATTEMPTS) {
        await Admin.updateOne(
          { _id: admin._id },
          { $set: { lockUntil: new Date(Date.now() + LOCK_MS) } }
        );
      }

      return fail();
    }

    // ---------------------------------------------------
    // 4) Success
    // ---------------------------------------------------
    await Admin.updateOne(
      { _id: admin._id },
      {
        $set: {
          loginAttempts: 0,
          lockUntil: null,
          lastAttemptAt: null,
          lastLoginAt: new Date(),
        },
      }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token: signAdminToken(admin),
      expiresIn: ADMIN_TOKEN_TTL_SECONDS,
      admin: {
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});

// ======================================================
// ADMIN SESSION CHECK
// GET /api/admin/session
// Used by the admin panel on page load to check that the
// saved token is still valid.
// ======================================================

router.get("/session", requireAdmin, (req, res) => {
  return res.json({
    success: true,
    admin: {
      name: req.admin.name,
      email: req.admin.email,
    },
  });
});

module.exports = router;
