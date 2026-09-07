const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// POST /api/contact - save a contact form submission
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

module.exports = router;