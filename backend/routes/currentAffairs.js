const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// Simple shared-secret admin check (no full user-role system yet).
// The admin panel sends this key in a header; only Dharmesh needs to know it.
function requireAdminKey(req, res, next) {
  const key = req.header("x-admin-key");
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// --- GET /api/current-affairs ---
// Public: list all entries, newest first
router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT Id AS id, Title AS title, Summary AS summary, PublishedDate AS date
      FROM CurrentAffairs
      ORDER BY PublishedDate DESC, Id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load current affairs" });
  }
});

// --- POST /api/current-affairs ---
// Admin only: add a new entry
// body: { title, summary, date }  (date format: YYYY-MM-DD)
router.post("/", requireAdminKey, async (req, res) => {
  try {
    const { title, summary, date } = req.body;
    if (!title || !summary || !date) {
      return res.status(400).json({ error: "title, summary and date are required" });
    }

    const pool = await connectDB();
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("summary", sql.NVarChar(sql.MAX), summary)
      .input("date", sql.Date, date)
      .query(`
        INSERT INTO CurrentAffairs (Title, Summary, PublishedDate)
        OUTPUT INSERTED.Id AS id, INSERTED.Title AS title, INSERTED.Summary AS summary, INSERTED.PublishedDate AS date
        VALUES (@title, @summary, @date)
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add entry" });
  }
});

// --- DELETE /api/current-affairs/:id ---
// Admin only: remove an entry (e.g. typo, wrong info)
router.delete("/:id", requireAdminKey, async (req, res) => {
  try {
    const pool = await connectDB();
    await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM CurrentAffairs WHERE Id = @id");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

module.exports = router;