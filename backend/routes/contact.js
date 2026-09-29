const express = require("express");
const mongoose = require("mongoose");

const Contact = require("../models/Contact");

const router = express.Router();

// =====================================================
// ADMIN KEY SECURITY
// =====================================================

function requireAdminKey(req, res, next) {
  const key = req.header("x-admin-key");

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  next();
}

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =====================================================
// POST /api/contact
// Public - save a contact form submission
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      message,
    } = req.body;

    if (
      !name ||
      !email ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and message are all required",
      });
    }

    const cleanName =
      String(name).trim();

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    const cleanMessage =
      String(message).trim();

    if (
      !cleanName ||
      !cleanMessage
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and message are all required",
      });
    }

    if (
      !emailRegex.test(
        cleanEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address",
      });
    }

    await Contact.create({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
    });

    return res
      .status(201)
      .json({
        success: true,
        message:
          "Thanks! We'll get back to you soon.",
      });
  } catch (error) {
    console.error(
      "MongoDB contact submit error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Failed to send message",
      });
  }
});

// =====================================================
// GET /api/contact
// Admin - list all submissions, newest first
// =====================================================

router.get(
  "/",
  requireAdminKey,
  async (req, res) => {
    try {
      const contacts =
        await Contact.find({})
          .sort({
            submittedAt: -1,
            _id: -1,
          })
          .lean();

      const submissions =
        contacts.map(
          (contact) => ({
            id:
              contact._id.toString(),

            name:
              contact.name,

            email:
              contact.email,

            message:
              contact.message,

            submittedAt:
              contact.submittedAt,
          })
        );

      return res.json(
        submissions
      );
    } catch (error) {
      console.error(
        "MongoDB contact submissions GET error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to load submissions",
        });
    }
  }
);

// =====================================================
// DELETE /api/contact/:id
// Admin - remove a submission
// =====================================================

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
            error:
              "Invalid submission ID",
          });
      }

      const deletedContact =
        await Contact.findByIdAndDelete(
          id
        );

      if (!deletedContact) {
        return res
          .status(404)
          .json({
            error:
              "Submission not found",
          });
      }

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "MongoDB contact submissions DELETE error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to delete submission",
        });
    }
  }
);

module.exports = router;