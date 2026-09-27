const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// ======================================================
// ADMIN KEY CHECK
// ======================================================

function requireAdminKey(req, res, next) {
  const adminKey = req.header("x-admin-key");

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
}

// ======================================================
// PUBLIC - GET ACTIVE FAQS
// GET /api/faq
// ======================================================

router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        Id,
        Question,
        Answer,
        IsActive,
        SortOrder,
        CreatedAt,
        UpdatedAt
      FROM dbo.FAQs
      WHERE IsActive = 1
      ORDER BY SortOrder ASC, Id ASC
    `);

    const faqs = result.recordset.map((faq) => ({
      id: faq.Id,
      question: faq.Question,
      answer: faq.Answer,
      isActive: Boolean(faq.IsActive),
      sortOrder: Number(faq.SortOrder) || 0,
      createdAt: faq.CreatedAt,
      updatedAt: faq.UpdatedAt,
    }));

    return res.json(faqs);
  } catch (error) {
    console.error("Get FAQs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load FAQs",
    });
  }
});

// ======================================================
// ADMIN - GET ALL FAQS
// GET /api/faq/admin/all
// ======================================================

router.get("/admin/all", requireAdminKey, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        Id,
        Question,
        Answer,
        IsActive,
        SortOrder,
        CreatedAt,
        UpdatedAt
      FROM dbo.FAQs
      ORDER BY SortOrder ASC, Id ASC
    `);

    const faqs = result.recordset.map((faq) => ({
      id: faq.Id,
      question: faq.Question,
      answer: faq.Answer,
      isActive: Boolean(faq.IsActive),
      sortOrder: Number(faq.SortOrder) || 0,
      createdAt: faq.CreatedAt,
      updatedAt: faq.UpdatedAt,
    }));

    return res.json({
      success: true,
      faqs,
    });
  } catch (error) {
    console.error("Admin get FAQs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load FAQs",
    });
  }
});

// ======================================================
// ADMIN - CREATE FAQ
// POST /api/faq
// ======================================================

router.post("/", requireAdminKey, async (req, res) => {
  try {
    const {
      question,
      answer,
      isActive = true,
      sortOrder = 0,
    } = req.body;

    const cleanQuestion = String(question || "").trim();
    const cleanAnswer = String(answer || "").trim();

    if (!cleanQuestion || !cleanAnswer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("Question", sql.NVarChar(500), cleanQuestion)
      .input("Answer", sql.NVarChar(sql.MAX), cleanAnswer)
      .input("IsActive", sql.Bit, Boolean(isActive))
      .input(
        "SortOrder",
        sql.Int,
        Number.isFinite(Number(sortOrder))
          ? Number(sortOrder)
          : 0
      )
      .query(`
        INSERT INTO dbo.FAQs
        (
          Question,
          Answer,
          IsActive,
          SortOrder
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.Question,
          INSERTED.Answer,
          INSERTED.IsActive,
          INSERTED.SortOrder,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES
        (
          @Question,
          @Answer,
          @IsActive,
          @SortOrder
        )
      `);

    const faq = result.recordset[0];

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      faq: {
        id: faq.Id,
        question: faq.Question,
        answer: faq.Answer,
        isActive: Boolean(faq.IsActive),
        sortOrder: Number(faq.SortOrder) || 0,
        createdAt: faq.CreatedAt,
        updatedAt: faq.UpdatedAt,
      },
    });
  } catch (error) {
    console.error("Create FAQ error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create FAQ",
    });
  }
});

// ======================================================
// ADMIN - UPDATE FAQ
// PUT /api/faq/:id
// ======================================================

router.put("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid FAQ ID",
      });
    }

    const {
      question,
      answer,
      isActive = true,
      sortOrder = 0,
    } = req.body;

    const cleanQuestion = String(question || "").trim();
    const cleanAnswer = String(answer || "").trim();

    if (!cleanQuestion || !cleanAnswer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("Question", sql.NVarChar(500), cleanQuestion)
      .input("Answer", sql.NVarChar(sql.MAX), cleanAnswer)
      .input("IsActive", sql.Bit, Boolean(isActive))
      .input(
        "SortOrder",
        sql.Int,
        Number.isFinite(Number(sortOrder))
          ? Number(sortOrder)
          : 0
      )
      .query(`
        UPDATE dbo.FAQs
        SET
          Question = @Question,
          Answer = @Answer,
          IsActive = @IsActive,
          SortOrder = @SortOrder,
          UpdatedAt = SYSDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.Question,
          INSERTED.Answer,
          INSERTED.IsActive,
          INSERTED.SortOrder,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @Id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    const faq = result.recordset[0];

    return res.json({
      success: true,
      message: "FAQ updated successfully",
      faq: {
        id: faq.Id,
        question: faq.Question,
        answer: faq.Answer,
        isActive: Boolean(faq.IsActive),
        sortOrder: Number(faq.SortOrder) || 0,
        createdAt: faq.CreatedAt,
        updatedAt: faq.UpdatedAt,
      },
    });
  } catch (error) {
    console.error("Update FAQ error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update FAQ",
    });
  }
});

// ======================================================
// ADMIN - DELETE FAQ
// DELETE /api/faq/:id
// ======================================================

router.delete("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid FAQ ID",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query(`
        DELETE FROM dbo.FAQs
        OUTPUT DELETED.Id
        WHERE Id = @Id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    return res.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("Delete FAQ error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete FAQ",
    });
  }
});

module.exports = router;