const mongoose = require("mongoose");

// Holds a signup until the email OTP is verified.
// The real User is created ONLY after verification, so nobody can
// register an email address they don't own.
const pendingSignupSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    mobile: { type: String, required: true, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpExpiry: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    // MongoDB deletes the document automatically after this date (TTL)
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.PendingSignup ||
  mongoose.model("PendingSignup", pendingSignupSchema);