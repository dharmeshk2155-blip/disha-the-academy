const mongoose = require("mongoose");

// ======================================================
// ADMIN ACCOUNT
// Separate from User on purpose: a normal student account
// can never become an admin, and admins never show up in
// the users list. Admins are created ONLY with
// `node scripts/manageAdmin.js` (there is no signup API).
// ======================================================

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    // false = cannot log in, and existing tokens stop working
    // immediately (requireAdmin re-checks this on every request).
    isActive: {
      type: Boolean,
      default: true,
    },

    // Bumped on password reset / disable. Tokens carry the value
    // they were issued with, so bumping it logs the admin out
    // everywhere.
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // Brute-force protection (see routes/adminAuth.js)
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.Admin ||
  mongoose.model("Admin", adminSchema);
