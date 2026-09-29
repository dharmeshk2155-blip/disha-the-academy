const express = require("express");
const SiteSettings = require("../models/SiteSettings");

const router = express.Router();


// ======================================================
// ADMIN SECURITY
// ======================================================

function requireAdminKey(req, res, next) {
  const adminKey = req.header("x-admin-key");

  if (
    !adminKey ||
    adminKey !== process.env.ADMIN_KEY
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
}


// ======================================================
// BOOLEAN HELPER
// ======================================================

function parseBoolean(
  value,
  defaultValue
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return defaultValue;
}


// ======================================================
// FORMAT SETTINGS
// ======================================================

function formatSettings(settings) {
  if (!settings) {
    return null;
  }

  return {
    id:
      settings._id?.toString(),

    siteName:
      settings.siteName ||
      "",

    tagline:
      settings.tagline ||
      "",

    supportEmail:
      settings.supportEmail ||
      "",

    supportPhone:
      settings.supportPhone ||
      "",

    maintenanceMode:
      Boolean(
        settings.maintenanceMode
      ),

    notesSalesEnabled:
      settings.notesSalesEnabled !==
      false,

    createdAt:
      settings.createdAt,

    updatedAt:
      settings.updatedAt,
  };
}


// ======================================================
// PUBLIC SETTINGS
// GET /api/settings
// ======================================================

router.get("/", async (req, res) => {
  try {
    const settings =
      await SiteSettings.findOne({
        key: "main",
      }).lean();

    return res.json({
      success: true,
      settings:
        formatSettings(settings),
    });
  } catch (error) {
    console.error(
      "Get MongoDB settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load website settings",
    });
  }
});


// ======================================================
// ADMIN SETTINGS
// GET /api/settings/admin
// ======================================================

router.get(
  "/admin",
  requireAdminKey,
  async (req, res) => {
    try {
      const settings =
        await SiteSettings.findOne({
          key: "main",
        }).lean();

      return res.json({
        success: true,
        settings:
          formatSettings(settings),
      });
    } catch (error) {
      console.error(
        "Admin get MongoDB settings error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load website settings",
      });
    }
  }
);


// ======================================================
// UPDATE SETTINGS
// PUT /api/settings
// ======================================================

router.put(
  "/",
  requireAdminKey,
  async (req, res) => {
    try {
      const {
        siteName,
        tagline = "",
        supportEmail = "",
        supportPhone = "",
        maintenanceMode = false,
        notesSalesEnabled = true,
      } = req.body;

      const cleanSiteName =
        String(
          siteName || ""
        ).trim();

      if (!cleanSiteName) {
        return res.status(400).json({
          success: false,
          message:
            "Site name is required",
        });
      }

      const settings =
        await SiteSettings
          .findOneAndUpdate(
            {
              key: "main",
            },

            {
              $set: {
                siteName:
                  cleanSiteName,

                tagline:
                  String(
                    tagline || ""
                  ).trim(),

                supportEmail:
                  String(
                    supportEmail || ""
                  ).trim(),

                supportPhone:
                  String(
                    supportPhone || ""
                  ).trim(),

                maintenanceMode:
                  parseBoolean(
                    maintenanceMode,
                    false
                  ),

                notesSalesEnabled:
                  parseBoolean(
                    notesSalesEnabled,
                    true
                  ),
              },

              $setOnInsert: {
                key: "main",
              },
            },

            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true,
            }
          )
          .lean();

      return res.json({
        success: true,
        message:
          "Website settings saved successfully",

        settings:
          formatSettings(settings),
      });
    } catch (error) {
      console.error(
        "Save MongoDB settings error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to save website settings",
      });
    }
  }
);


module.exports = router;