const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// Admin protection (same pattern as routes/currentAffairs.js)
function requireAdminKey(req, res, next) {
  const key = req.header("x-admin-key");

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// =====================================================
// GET /api/notes
// Public - list all notes
// =====================================================
router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        Id AS id,
        Title AS title,
        Subject AS subject,
        Price AS price,
        Pdf AS pdf
      FROM dbo.Notes
      ORDER BY Id ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Notes GET error:", err);
    res.status(500).json({ success: false, error: "Failed to load notes" });
  }
});

// =====================================================
// GET /api/notes/:id
// Public - single note
// =====================================================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid note ID" });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT
          Id AS id,
          Title AS title,
          Subject AS subject,
          Price AS price,
          Pdf AS pdf
        FROM dbo.Notes
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Notes GET-by-id error:", err);
    res.status(500).json({ success: false, error: "Failed to load note" });
  }
});

// =====================================================
// POST /api/notes
// Admin - add a new note
// =====================================================
router.post("/", requireAdminKey, async (req, res) => {
  try {
    const { title, subject, price, pdf } = req.body;

    if (!title || !subject || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        error: "title, subject and price are required",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("title", sql.NVarChar(255), title.trim())
      .input("subject", sql.NVarChar(255), subject.trim())
      .input("price", sql.Decimal(10, 2), Number(price))
      .input("pdf", sql.NVarChar(500), pdf ? pdf.trim() : null)
      .query(`
        INSERT INTO dbo.Notes (Title, Subject, Price, Pdf)
        OUTPUT
          INSERTED.Id AS id,
          INSERTED.Title AS title,
          INSERTED.Subject AS subject,
          INSERTED.Price AS price,
          INSERTED.Pdf AS pdf
        VALUES (@title, @subject, @price, @pdf)
      `);

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Notes POST error:", err);
    res.status(500).json({ success: false, error: "Failed to add note" });
  }
});

// =====================================================
// PUT /api/notes/:id
// Admin - edit an existing note
// =====================================================
router.put("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, subject, price, pdf } = req.body;

    if (!id || !title || !subject || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        error: "id, title, subject and price are required",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("title", sql.NVarChar(255), title.trim())
      .input("subject", sql.NVarChar(255), subject.trim())
      .input("price", sql.Decimal(10, 2), Number(price))
      .input("pdf", sql.NVarChar(500), pdf ? pdf.trim() : null)
      .query(`
        UPDATE dbo.Notes
        SET
          Title = @title,
          Subject = @subject,
          Price = @price,
          Pdf = @pdf
        OUTPUT
          INSERTED.Id AS id,
          INSERTED.Title AS title,
          INSERTED.Subject AS subject,
          INSERTED.Price AS price,
          INSERTED.Pdf AS pdf
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Notes PUT error:", err);
    res.status(500).json({ success: false, error: "Failed to update note" });
  }
});

// =====================================================
// DELETE /api/notes/:id
// Admin - remove a note
// =====================================================
router.delete("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid note ID" });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM dbo.Notes WHERE Id = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Notes DELETE error:", err);

    // A note that's already been purchased is referenced by Orders.NoteId
    // (foreign key), so SQL Server will block the delete rather than
    // silently breaking past orders.
    if (err.number === 547) {
      return res.status(409).json({
        success: false,
        error: "This note has existing orders and can't be deleted.",
      });
    }

    res.status(500).json({ success: false, error: "Failed to delete note" });
  }
});

module.exports = router;