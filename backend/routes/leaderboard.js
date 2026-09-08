const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// GET /api/leaderboard - top 10 users by total score across all attempts
router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT TOP 10
        u.Name AS name,
        SUM(r.Score) AS totalScore,
        COUNT(r.ResultId) AS testsTaken
      FROM Results r
      JOIN dbo.Users u ON u.Id = TRY_CAST(r.UserId AS INT)
      WHERE r.UserId IS NOT NULL
      GROUP BY u.Name
      ORDER BY totalScore DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

module.exports = router;