const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// ======================================================
// ADMIN TOKENS
// Signed with a DIFFERENT secret than student tokens, plus
// their own issuer/audience/role, so a student JWT can never
// be accepted as an admin token (and vice versa).
//
// Set ADMIN_JWT_SECRET in .env (recommended: 64+ random chars).
// If it is missing we derive a separate key from JWT_SECRET so
// the server still works, but a dedicated secret is better.
// ======================================================

const ADMIN_TOKEN_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const ISSUER = "disha-admin";
const AUDIENCE = "disha-admin-panel";

function adminSecret() {
  if (process.env.ADMIN_JWT_SECRET) {
    return process.env.ADMIN_JWT_SECRET;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error(
      "ADMIN_JWT_SECRET (or JWT_SECRET) is not set in .env"
    );
  }

  return crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update("disha-admin-jwt-v1")
    .digest("hex");
}

function signAdminToken(admin) {
  return jwt.sign(
    {
      role: "admin",
      adminId: String(admin._id),
      tv: admin.tokenVersion || 0,
    },
    adminSecret(),
    {
      algorithm: "HS256",
      expiresIn: ADMIN_TOKEN_TTL_SECONDS,
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );
}

function verifyAdminToken(token) {
  return jwt.verify(token, adminSecret(), {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

module.exports = {
  ADMIN_TOKEN_TTL_SECONDS,
  signAdminToken,
  verifyAdminToken,
};
