const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// ======================================================
// ADMIN SECURITY
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
// FORMAT PAGE
// ======================================================

function formatPage(page) {
  if (!page) return null;

  return {
    id: page.Id,
    title: page.Title,
    introduction: page.Introduction || "",
    content: page.Content || "",
    mission: page.Mission || "",
    vision: page.Vision || "",
    isActive: Boolean(page.IsActive),
    createdAt: page.CreatedAt,
    updatedAt: page.UpdatedAt,
  };
}

// ======================================================
// PUBLIC ABOUT PAGE
// GET /api/about
// ======================================================

router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT TOP 1
        Id,
        Title,
        Introduction,
        Content,
        Mission,
        Vision,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM dbo.AboutPage
      WHERE IsActive = 1
      ORDER BY Id DESC
    `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        page: null,
      });
    }

    return res.json({
      success: true,
      page: formatPage(result.recordset[0]),
    });
  } catch (error) {
    console.error("Get About page error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load About page",
    });
  }
});

// ======================================================
// ADMIN GET ABOUT PAGE
// GET /api/about/admin
// ======================================================

router.get("/admin", requireAdminKey, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT TOP 1
        Id,
        Title,
        Introduction,
        Content,
        Mission,
        Vision,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM dbo.AboutPage
      ORDER BY Id DESC
    `);

    return res.json({
      success: true,
      page:
        result.recordset.length > 0
          ? formatPage(result.recordset[0])
          : null,
    });
  } catch (error) {
    console.error("Admin get About page error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load About page",
    });
  }
});

// ======================================================
// CREATE / UPDATE ABOUT PAGE
// PUT /api/about
// ======================================================

router.put("/", requireAdminKey, async (req, res) => {
  try {
    const {
      title,
      introduction = "",
      content = "",
      mission = "",
      vision = "",
      isActive = true,
    } = req.body;

    const cleanTitle = String(title || "").trim();

    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: "Page title is required",
      });
    }

    const pool = await connectDB();

    // Check whether About page already exists
    const existingResult = await pool.request().query(`
      SELECT TOP 1 Id
      FROM dbo.AboutPage
      ORDER BY Id DESC
    `);

    let result;

    if (existingResult.recordset.length > 0) {
      const pageId = existingResult.recordset[0].Id;

      result = await pool
        .request()
        .input("Id", sql.Int, pageId)
        .input(
          "Title",
          sql.NVarChar(300),
          cleanTitle
        )
        .input(
          "Introduction",
          sql.NVarChar(sql.MAX),
          String(introduction || "").trim()
        )
        .input(
          "Content",
          sql.NVarChar(sql.MAX),
          String(content || "").trim()
        )
        .input(
          "Mission",
          sql.NVarChar(sql.MAX),
          String(mission || "").trim()
        )
        .input(
          "Vision",
          sql.NVarChar(sql.MAX),
          String(vision || "").trim()
        )
        .input(
          "IsActive",
          sql.Bit,
          Boolean(isActive)
        )
        .query(`
          UPDATE dbo.AboutPage

          SET
            Title = @Title,
            Introduction = @Introduction,
            Content = @Content,
            Mission = @Mission,
            Vision = @Vision,
            IsActive = @IsActive,
            UpdatedAt = SYSDATETIME()

          OUTPUT
            INSERTED.Id,
            INSERTED.Title,
            INSERTED.Introduction,
            INSERTED.Content,
            INSERTED.Mission,
            INSERTED.Vision,
            INSERTED.IsActive,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt

          WHERE Id = @Id
        `);
    } else {
      result = await pool
        .request()
        .input(
          "Title",
          sql.NVarChar(300),
          cleanTitle
        )
        .input(
          "Introduction",
          sql.NVarChar(sql.MAX),
          String(introduction || "").trim()
        )
        .input(
          "Content",
          sql.NVarChar(sql.MAX),
          String(content || "").trim()
        )
        .input(
          "Mission",
          sql.NVarChar(sql.MAX),
          String(mission || "").trim()
        )
        .input(
          "Vision",
          sql.NVarChar(sql.MAX),
          String(vision || "").trim()
        )
        .input(
          "IsActive",
          sql.Bit,
          Boolean(isActive)
        )
        .query(`
          INSERT INTO dbo.AboutPage
          (
            Title,
            Introduction,
            Content,
            Mission,
            Vision,
            IsActive
          )

          OUTPUT
            INSERTED.Id,
            INSERTED.Title,
            INSERTED.Introduction,
            INSERTED.Content,
            INSERTED.Mission,
            INSERTED.Vision,
            INSERTED.IsActive,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt

          VALUES
          (
            @Title,
            @Introduction,
            @Content,
            @Mission,
            @Vision,
            @IsActive
          )
        `);
    }

    return res.json({
      success: true,
      message: "About page saved successfully",
      page: formatPage(result.recordset[0]),
    });
  } catch (error) {
    console.error("Save About page error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save About page",
    });
  }
});

module.exports = router;