const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");

// ======================================================
// REQUIRE LOGIN
// Reads "Authorization: Bearer <token>", verifies the JWT,
// checks the account still exists and is active, and sets
// req.user = { id }.
//
// Usage:  router.get("/something", requireAuth, handler)
// ======================================================

function deny(res, status, message) {
  // "error" and "message" are both sent because different
  // parts of the frontend read different keys.
  return res.status(status).json({
    success: false,
    error: message,
    message,
  });
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7).trim()
      : null;

    if (!token) {
      return deny(res, 401, "Please log in to continue.");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return deny(
        res,
        401,
        "Your session has expired. Please log in again."
      );
    }

    const userId = String(decoded?.userId || "").trim();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return deny(res, 401, "Invalid login session.");
    }

    const user = await User.findById(userId)
      .select("_id isActive")
      .lean();

    if (!user) {
      return deny(res, 401, "User account not found.");
    }

    if (user.isActive === false) {
      return deny(res, 403, "Your account is currently disabled.");
    }

    req.user = { id: String(user._id) };
    return next();
  } catch (error) {
    console.error("requireAuth error:", error);
    return deny(res, 500, "Authentication failed. Please try again.");
  }
}

module.exports = requireAuth;