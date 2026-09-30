const mongoose = require("mongoose");

const Admin = require("../models/Admin");
const { verifyAdminToken } = require("../utils/adminToken");

// ======================================================
// REQUIRE ADMIN
// Reads "Authorization: Bearer <admin token>", verifies it,
// and checks the admin account still exists, is active and
// that the token has not been revoked (tokenVersion).
// Sets req.admin = { id, email, name }.
//
// Usage:  router.get("/something", requireAdmin, handler)
// ======================================================

function deny(res, status, message) {
  // "message" and "error" are both sent because different
  // admin pages read different keys.
  return res.status(status).json({
    success: false,
    message,
    error: message,
  });
}

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    const token = header.startsWith("Bearer ")
      ? header.slice(7).trim()
      : "";

    if (!token) {
      return deny(res, 401, "Unauthorized");
    }

    let decoded;

    try {
      decoded = verifyAdminToken(token);
    } catch (error) {
      return deny(
        res,
        401,
        "Admin session expired. Please log in again."
      );
    }

    const adminId = String(decoded?.adminId || "");

    if (
      decoded?.role !== "admin" ||
      !mongoose.Types.ObjectId.isValid(adminId)
    ) {
      return deny(res, 401, "Unauthorized");
    }

    const admin = await Admin.findById(adminId)
      .select("_id email name isActive tokenVersion")
      .lean();

    if (
      !admin ||
      admin.isActive === false ||
      (admin.tokenVersion || 0) !== (decoded.tv || 0)
    ) {
      return deny(
        res,
        401,
        "Admin session expired. Please log in again."
      );
    }

    req.admin = {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
    };

    return next();
  } catch (error) {
    console.error("requireAdmin error:", error);
    return deny(res, 500, "Authentication failed. Please try again.");
  }
}

module.exports = requireAdmin;
