const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// Admin protection (same pattern used across the other admin routes)
function requireAdminKey(req, res, next) {
  const key = req.header("x-admin-key");

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// =====================================================
// POST /api/contact
// Public - save a contact form submission
// =====================================================
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are all required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const pool = await connectDB();
    await pool
      .request()
      .input("Name", sql.NVarChar(100), name.trim())
      .input("Email", sql.NVarChar(150), email.trim().toLowerCase())
      .input("Message", sql.NVarChar(sql.MAX), message.trim())
      .query(`
        INSERT INTO Contacts (Name, Email, Message)
        VALUES (@Name, @Email, @Message)
      `);

    res.status(201).json({
      success: true,
      message: "Thanks! We'll get back to you soon.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// =====================================================
// GET /api/contact
// Admin - list all submissions, newest first
// =====================================================
router.get("/", requireAdminKey, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        Id AS id,
        Name AS name,
        Email AS email,
        Message AS message,
        SubmittedAt AS submittedAt
      FROM Contacts
      ORDER BY SubmittedAt DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Contact submissions GET error:", err);
    res.status(500).json({ error: "Failed to load submissions" });
  }
});

// =====================================================
// DELETE /api/contact/:id
// Admin - remove a submission
// =====================================================
router.delete("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Invalid submission ID" });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Contacts WHERE Id = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Contact submissions DELETE error:", err);
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

module.exports = router;