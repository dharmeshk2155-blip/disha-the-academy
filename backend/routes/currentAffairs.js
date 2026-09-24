const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// Admin protection
function requireAdminKey(req, res, next) {
  const key = req.header("x-admin-key");

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// =====================================================
// GET /api/current-affairs
// Public - newest entries first
// =====================================================
router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        Id AS id,
        Title AS title,
        Summary AS summary,
        PublishedDate AS date
      FROM CurrentAffairs
      ORDER BY PublishedDate DESC, Id DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Current Affairs GET error:", err);

    res.status(500).json({
      error: "Failed to load current affairs",
    });
  }
});

// =====================================================
// POST /api/current-affairs
// Admin - add new entry
// =====================================================
router.post("/", requireAdminKey, async (req, res) => {
  try {
    const { title, summary, date } = req.body;

    if (!title || !summary || !date) {
      return res.status(400).json({
        error: "title, summary and date are required",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("title", sql.NVarChar(255), title.trim())
      .input("summary", sql.NVarChar(sql.MAX), summary.trim())
      .input("date", sql.Date, date)
      .query(`
        INSERT INTO CurrentAffairs
          (Title, Summary, PublishedDate)

        OUTPUT
          INSERTED.Id AS id,
          INSERTED.Title AS title,
          INSERTED.Summary AS summary,
          INSERTED.PublishedDate AS date

        VALUES
          (@title, @summary, @date)
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Current Affairs POST error:", err);

    res.status(500).json({
      error: "Failed to add entry",
    });
  }
});

// =====================================================
// PUT /api/current-affairs/:id
// Admin - edit existing entry
// =====================================================
router.put("/:id", requireAdminKey, async (req, res) => {
  try {
    const { title, summary, date } = req.body;
    const id = Number(req.params.id);

    if (!id || !title || !summary || !date) {
      return res.status(400).json({
        error: "id, title, summary and date are required",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("title", sql.NVarChar(255), title.trim())
      .input("summary", sql.NVarChar(sql.MAX), summary.trim())
      .input("date", sql.Date, date)
      .query(`
        UPDATE CurrentAffairs
        SET
          Title = @title,
          Summary = @summary,
          PublishedDate = @date
        OUTPUT
          INSERTED.Id AS id,
          INSERTED.Title AS title,
          INSERTED.Summary AS summary,
          INSERTED.PublishedDate AS date
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        error: "Current affair not found",
      });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Current Affairs PUT error:", err);

    res.status(500).json({
      error: "Failed to update entry",
    });
  }
});

// =====================================================
// DELETE /api/current-affairs/:id
// Admin - delete entry
// =====================================================
router.delete("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Invalid entry ID",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM CurrentAffairs
        WHERE Id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: "Current affair not found",
      });
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("Current Affairs DELETE error:", err);

    res.status(500).json({
      error: "Failed to delete entry",
    });
  }
});

module.exports = router;