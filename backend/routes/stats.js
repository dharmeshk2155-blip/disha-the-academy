const express = require("express");
const { connectDB } = require("../db");

const router = express.Router();

// --- GET /api/stats ---
// Returns real, live counts from the database for the About page
// (and anywhere else genuine numbers are needed).
router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const usersResult = await pool
      .request()
      .query("SELECT COUNT(*) AS count FROM Users");

    const testsResult = await pool
      .request()
      .query("SELECT COUNT(*) AS count FROM Tests");

    const questionsResult = await pool
      .request()
      .query("SELECT COUNT(*) AS count FROM Questions");

    res.json({
      registeredStudents: usersResult.recordset[0].count,
      mockTestsCount: testsResult.recordset[0].count,
      questionsCount: questionsResult.recordset[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

module.exports = router;