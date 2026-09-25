const crypto = require("crypto");

// ======================================================
// PASSWORD HASHING
// ======================================================

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
}

// ======================================================
// PASSWORD VERIFICATION
// ======================================================

function verifyPassword(password, storedPassword) {
  try {
    const parts = storedPassword.split(":");

    if (parts.length !== 2) {
      return false;
    }

    const salt = parts[0];
    const storedHash = parts[1];

    const hash = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");

    const storedHashBuffer = Buffer.from(storedHash, "hex");
    const hashBuffer = Buffer.from(hash, "hex");

    if (storedHashBuffer.length !== hashBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedHashBuffer, hashBuffer);
  } catch (err) {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };