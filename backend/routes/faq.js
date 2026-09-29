const express = require("express");
const mongoose = require("mongoose");

const FAQ = require("../models/FAQ");

const router = express.Router();

// ======================================================
// ADMIN KEY CHECK
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
// FORMAT FAQ
// Keeps frontend response structure consistent
// ======================================================

function formatFAQ(faq) {
  return {
    id: faq._id.toString(),
    question: faq.question,
    answer: faq.answer,
    isActive: Boolean(faq.isActive),
    sortOrder:
      Number(faq.sortOrder) || 0,
    createdAt: faq.createdAt,
    updatedAt: faq.updatedAt,
  };
}

// ======================================================
// PUBLIC - GET ACTIVE FAQS
// GET /api/faq
// ======================================================

router.get("/", async (req, res) => {
  try {
    const faqDocuments =
      await FAQ.find({
        isActive: true,
      })
        .sort({
          sortOrder: 1,
          _id: 1,
        })
        .lean();

    const faqs =
      faqDocuments.map(
        formatFAQ
      );

    return res.json(faqs);
  } catch (error) {
    console.error(
      "MongoDB get FAQs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load FAQs",
    });
  }
});

// ======================================================
// ADMIN - GET ALL FAQS
// GET /api/faq/admin/all
// ======================================================

router.get(
  "/admin/all",
  requireAdminKey,
  async (req, res) => {
    try {
      const faqDocuments =
        await FAQ.find({})
          .sort({
            sortOrder: 1,
            _id: 1,
          })
          .lean();

      const faqs =
        faqDocuments.map(
          formatFAQ
        );

      return res.json({
        success: true,
        faqs,
      });
    } catch (error) {
      console.error(
        "MongoDB admin get FAQs error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load FAQs",
        });
    }
  }
);

// ======================================================
// ADMIN - CREATE FAQ
// POST /api/faq
// ======================================================

router.post(
  "/",
  requireAdminKey,
  async (req, res) => {
    try {
      const {
        question,
        answer,
        isActive = true,
        sortOrder = 0,
      } = req.body;

      const cleanQuestion =
        String(
          question || ""
        ).trim();

      const cleanAnswer =
        String(
          answer || ""
        ).trim();

      if (
        !cleanQuestion ||
        !cleanAnswer
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Question and answer are required",
          });
      }

      const cleanSortOrder =
        Number.isFinite(
          Number(sortOrder)
        )
          ? Math.trunc(
              Number(sortOrder)
            )
          : 0;

      const createdFAQ =
        await FAQ.create({
          question:
            cleanQuestion,

          answer:
            cleanAnswer,

          isActive:
            Boolean(isActive),

          sortOrder:
            cleanSortOrder,
        });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "FAQ created successfully",

          faq:
            formatFAQ(
              createdFAQ
            ),
        });
    } catch (error) {
      console.error(
        "MongoDB create FAQ error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to create FAQ",
        });
    }
  }
);

// ======================================================
// ADMIN - UPDATE FAQ
// PUT /api/faq/:id
// ======================================================

router.put(
  "/:id",
  requireAdminKey,
  async (req, res) => {
    try {
      const id =
        String(
          req.params.id || ""
        ).trim();

      if (
        !mongoose.isValidObjectId(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid FAQ ID",
          });
      }

      const {
        question,
        answer,
        isActive = true,
        sortOrder = 0,
      } = req.body;

      const cleanQuestion =
        String(
          question || ""
        ).trim();

      const cleanAnswer =
        String(
          answer || ""
        ).trim();

      if (
        !cleanQuestion ||
        !cleanAnswer
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Question and answer are required",
          });
      }

      const cleanSortOrder =
        Number.isFinite(
          Number(sortOrder)
        )
          ? Math.trunc(
              Number(sortOrder)
            )
          : 0;

      const faq =
        await FAQ.findById(id);

      if (!faq) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "FAQ not found",
          });
      }

      faq.question =
        cleanQuestion;

      faq.answer =
        cleanAnswer;

      faq.isActive =
        Boolean(isActive);

      faq.sortOrder =
        cleanSortOrder;

      await faq.save();

      return res.json({
        success: true,
        message:
          "FAQ updated successfully",

        faq:
          formatFAQ(faq),
      });
    } catch (error) {
      console.error(
        "MongoDB update FAQ error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update FAQ",
        });
    }
  }
);

// ======================================================
// ADMIN - DELETE FAQ
// DELETE /api/faq/:id
// ======================================================

router.delete(
  "/:id",
  requireAdminKey,
  async (req, res) => {
    try {
      const id =
        String(
          req.params.id || ""
        ).trim();

      if (
        !mongoose.isValidObjectId(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid FAQ ID",
          });
      }

      const deletedFAQ =
        await FAQ.findByIdAndDelete(
          id
        );

      if (!deletedFAQ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "FAQ not found",
          });
      }

      return res.json({
        success: true,
        message:
          "FAQ deleted successfully",
      });
    } catch (error) {
      console.error(
        "MongoDB delete FAQ error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to delete FAQ",
        });
    }
  }
);

module.exports = router;