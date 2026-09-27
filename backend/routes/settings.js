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
// FORMAT SETTINGS
// ======================================================

function formatSettings(row) {
  if (!row) return null;

  return {
    id: row.Id,
    siteName: row.SiteName || "",
    tagline: row.Tagline || "",
    supportEmail: row.SupportEmail || "",
    supportPhone: row.SupportPhone || "",
    maintenanceMode: Boolean(row.MaintenanceMode),
    notesSalesEnabled: Boolean(row.NotesSalesEnabled),
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

// ======================================================
// PUBLIC SETTINGS
// GET /api/settings
// ======================================================

router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT TOP 1
        Id,
        SiteName,
        Tagline,
        SupportEmail,
        SupportPhone,
        MaintenanceMode,
        NotesSalesEnabled,
        CreatedAt,
        UpdatedAt
      FROM dbo.SiteSettings
      ORDER BY Id DESC
    `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        settings: null,
      });
    }

    return res.json({
      success: true,
      settings: formatSettings(result.recordset[0]),
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load website settings",
    });
  }
});

// ======================================================
// ADMIN SETTINGS
// GET /api/settings/admin
// ======================================================

router.get("/admin", requireAdminKey, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT TOP 1
        Id,
        SiteName,
        Tagline,
        SupportEmail,
        SupportPhone,
        MaintenanceMode,
        NotesSalesEnabled,
        CreatedAt,
        UpdatedAt
      FROM dbo.SiteSettings
      ORDER BY Id DESC
    `);

    return res.json({
      success: true,
      settings:
        result.recordset.length > 0
          ? formatSettings(result.recordset[0])
          : null,
    });
  } catch (error) {
    console.error("Admin get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load website settings",
    });
  }
});

// ======================================================
// UPDATE SETTINGS
// PUT /api/settings
// ======================================================

router.put("/", requireAdminKey, async (req, res) => {
  try {
    const {
      siteName,
      tagline = "",
      supportEmail = "",
      supportPhone = "",
      maintenanceMode = false,
      notesSalesEnabled = true,
    } = req.body;

    const cleanSiteName = String(siteName || "").trim();

    if (!cleanSiteName) {
      return res.status(400).json({
        success: false,
        message: "Site name is required",
      });
    }

    const pool = await connectDB();

    const existing = await pool.request().query(`
      SELECT TOP 1 Id
      FROM dbo.SiteSettings
      ORDER BY Id DESC
    `);

    let result;

    if (existing.recordset.length > 0) {
      const id = existing.recordset[0].Id;

      result = await pool
        .request()
        .input("Id", sql.Int, id)
        .input("SiteName", sql.NVarChar(200), cleanSiteName)
        .input(
          "Tagline",
          sql.NVarChar(500),
          String(tagline || "").trim()
        )
        .input(
          "SupportEmail",
          sql.NVarChar(255),
          String(supportEmail || "").trim()
        )
        .input(
          "SupportPhone",
          sql.NVarChar(30),
          String(supportPhone || "").trim()
        )
        .input(
          "MaintenanceMode",
          sql.Bit,
          Boolean(maintenanceMode)
        )
        .input(
          "NotesSalesEnabled",
          sql.Bit,
          Boolean(notesSalesEnabled)
        )
        .query(`
          UPDATE dbo.SiteSettings

          SET
            SiteName = @SiteName,
            Tagline = @Tagline,
            SupportEmail = @SupportEmail,
            SupportPhone = @SupportPhone,
            MaintenanceMode = @MaintenanceMode,
            NotesSalesEnabled = @NotesSalesEnabled,
            UpdatedAt = SYSDATETIME()

          OUTPUT
            INSERTED.Id,
            INSERTED.SiteName,
            INSERTED.Tagline,
            INSERTED.SupportEmail,
            INSERTED.SupportPhone,
            INSERTED.MaintenanceMode,
            INSERTED.NotesSalesEnabled,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt

          WHERE Id = @Id
        `);
    } else {
      result = await pool
        .request()
        .input("SiteName", sql.NVarChar(200), cleanSiteName)
        .input(
          "Tagline",
          sql.NVarChar(500),
          String(tagline || "").trim()
        )
        .input(
          "SupportEmail",
          sql.NVarChar(255),
          String(supportEmail || "").trim()
        )
        .input(
          "SupportPhone",
          sql.NVarChar(30),
          String(supportPhone || "").trim()
        )
        .input(
          "MaintenanceMode",
          sql.Bit,
          Boolean(maintenanceMode)
        )
        .input(
          "NotesSalesEnabled",
          sql.Bit,
          Boolean(notesSalesEnabled)
        )
        .query(`
          INSERT INTO dbo.SiteSettings
          (
            SiteName,
            Tagline,
            SupportEmail,
            SupportPhone,
            MaintenanceMode,
            NotesSalesEnabled
          )

          OUTPUT
            INSERTED.Id,
            INSERTED.SiteName,
            INSERTED.Tagline,
            INSERTED.SupportEmail,
            INSERTED.SupportPhone,
            INSERTED.MaintenanceMode,
            INSERTED.NotesSalesEnabled,
            INSERTED.CreatedAt,
            INSERTED.UpdatedAt

          VALUES
          (
            @SiteName,
            @Tagline,
            @SupportEmail,
            @SupportPhone,
            @MaintenanceMode,
            @NotesSalesEnabled
          )
        `);
    }

    return res.json({
      success: true,
      message: "Website settings saved successfully",
      settings: formatSettings(result.recordset[0]),
    });
  } catch (error) {
    console.error("Save settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save website settings",
    });
  }
});

module.exports = router;