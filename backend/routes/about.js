const express = require("express");

const AboutPage = require("../models/AboutPage");

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
// FORMAT PAGE
// ======================================================

function formatPage(page) {
  if (!page) {
    return null;
  }

  return {
    id: page._id.toString(),
    title: page.title,
    introduction:
      page.introduction || "",
    content:
      page.content || "",
    mission:
      page.mission || "",
    vision:
      page.vision || "",
    isActive:
      Boolean(page.isActive),
    createdAt:
      page.createdAt,
    updatedAt:
      page.updatedAt,
  };
}

// ======================================================
// PUBLIC ABOUT PAGE
// GET /api/about
// ======================================================

router.get("/", async (req, res) => {
  try {
    const page =
      await AboutPage.findOne({
        isActive: true,
      })
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .lean();

    return res.json({
      success: true,
      page:
        page
          ? formatPage(page)
          : null,
    });
  } catch (error) {
    console.error(
      "MongoDB get About page error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load About page",
    });
  }
});

// ======================================================
// ADMIN GET ABOUT PAGE
// GET /api/about/admin
// ======================================================

router.get(
  "/admin",
  requireAdminKey,
  async (req, res) => {
    try {
      const page =
        await AboutPage.findOne({})
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .lean();

      return res.json({
        success: true,
        page:
          page
            ? formatPage(page)
            : null,
      });
    } catch (error) {
      console.error(
        "MongoDB admin get About page error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load About page",
        });
    }
  }
);

// ======================================================
// CREATE / UPDATE ABOUT PAGE
// PUT /api/about
// ======================================================

router.put(
  "/",
  requireAdminKey,
  async (req, res) => {
    try {
      const {
        title,
        introduction = "",
        content = "",
        mission = "",
        vision = "",
        isActive = true,
      } = req.body;

      const cleanTitle =
        String(
          title || ""
        ).trim();

      if (!cleanTitle) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Page title is required",
          });
      }

      const cleanIntroduction =
        String(
          introduction || ""
        ).trim();

      const cleanContent =
        String(
          content || ""
        ).trim();

      const cleanMission =
        String(
          mission || ""
        ).trim();

      const cleanVision =
        String(
          vision || ""
        ).trim();

      // ------------------------------------------
      // CHECK EXISTING ABOUT PAGE
      // ------------------------------------------

      let page =
        await AboutPage.findOne({})
          .sort({
            createdAt: -1,
            _id: -1,
          });

      // ------------------------------------------
      // UPDATE EXISTING PAGE
      // ------------------------------------------

      if (page) {
        page.title =
          cleanTitle;

        page.introduction =
          cleanIntroduction;

        page.content =
          cleanContent;

        page.mission =
          cleanMission;

        page.vision =
          cleanVision;

        page.isActive =
          Boolean(isActive);

        await page.save();
      } else {
        // ----------------------------------------
        // CREATE FIRST ABOUT PAGE
        // ----------------------------------------

        page =
          await AboutPage.create({
            title:
              cleanTitle,

            introduction:
              cleanIntroduction,

            content:
              cleanContent,

            mission:
              cleanMission,

            vision:
              cleanVision,

            isActive:
              Boolean(isActive),
          });
      }

      return res.json({
        success: true,
        message:
          "About page saved successfully",

        page:
          formatPage(page),
      });
    } catch (error) {
      console.error(
        "MongoDB save About page error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to save About page",
        });
    }
  }
);

module.exports = router;