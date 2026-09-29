const express = require("express");
const Note = require("../models/Note");

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
// FORMAT NOTE
// ======================================================

function formatNote(note) {
  return {
    id: note.id,

    categorySlug:
      note.categorySlug,

    categoryTitle:
      note.categoryTitle,

    subcategorySlug:
      note.subcategorySlug,

    subcategoryTitle:
      note.subcategoryTitle,

    title:
      note.title,

    price:
      Number(note.price) || 0,

    pdf:
      note.pdf || "",

    content:
      note.content || "",

    isActive:
      Boolean(note.isActive),

    createdAt:
      note.createdAt,

    updatedAt:
      note.updatedAt,
  };
}

// ======================================================
// GET ALL NOTES
// GET /api/admin/notes
// ======================================================

router.get(
  "/",
  requireAdminKey,
  async (req, res) => {
    try {
      const notes =
        await Note.find({})
          .sort({ id: 1 })
          .lean();

      return res.json({
        success: true,
        count:
          notes.length,
        notes:
          notes.map(formatNote),
      });
    } catch (error) {
      console.error(
        "Admin MongoDB notes fetch error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load notes",
      });
    }
  }
);

// ======================================================
// CREATE NOTE
// POST /api/admin/notes
// ======================================================

router.post(
  "/",
  requireAdminKey,
  async (req, res) => {
    try {
      const {
        categorySlug,
        categoryTitle,
        subcategorySlug,
        subcategoryTitle,
        title,
        price,
        pdf,
        content,
        isActive,
      } = req.body;

      const cleanCategorySlug =
        String(
          categorySlug || ""
        ).trim();

      const cleanCategoryTitle =
        String(
          categoryTitle || ""
        ).trim();

      const cleanSubcategorySlug =
        String(
          subcategorySlug || ""
        ).trim();

      const cleanSubcategoryTitle =
        String(
          subcategoryTitle || ""
        ).trim();

      const cleanTitle =
        String(
          title || ""
        ).trim();

      const cleanPdf =
        String(
          pdf || ""
        ).trim();

      const cleanContent =
        String(
          content || ""
        ).trim();

      const priceNumber =
        Number(price);

      // REQUIRED FIELDS
      if (
        !cleanCategorySlug ||
        !cleanCategoryTitle ||
        !cleanSubcategorySlug ||
        !cleanSubcategoryTitle ||
        !cleanTitle
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please fill all required fields.",
        });
      }

      // PRICE
      if (
        !Number.isFinite(
          priceNumber
        ) ||
        priceNumber < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid price.",
        });
      }

      // ==================================================
      // NEXT NUMERIC NOTE ID
      // ==================================================

      const lastNote =
        await Note.findOne({})
          .sort({ id: -1 })
          .select({ id: 1 })
          .lean();

      const nextId =
        lastNote?.id
          ? Number(lastNote.id) + 1
          : 1;

      // ==================================================
      // CREATE NOTE
      // ==================================================

      const note =
        await Note.create({
          id:
            nextId,

          categorySlug:
            cleanCategorySlug,

          categoryTitle:
            cleanCategoryTitle,

          subcategorySlug:
            cleanSubcategorySlug,

          subcategoryTitle:
            cleanSubcategoryTitle,

          title:
            cleanTitle,

          price:
            priceNumber,

          pdf:
            cleanPdf,

          content:
            cleanContent,

          isActive:
            isActive === false
              ? false
              : true,
        });

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "MONGODB NOTE CREATED"
      );
      console.log(
        "NOTE ID:",
        note.id
      );
      console.log(
        "TITLE:",
        note.title
      );
      console.log(
        "================================="
      );
      console.log("");

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Note created successfully",
          id:
            note.id,
        });
    } catch (error) {
      console.error(
        "Admin MongoDB create note error:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A note with this ID already exists. Please try again.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to create note",
      });
    }
  }
);

// ======================================================
// UPDATE NOTE
// PUT /api/admin/notes/:id
// ======================================================

router.put(
  "/:id",
  requireAdminKey,
  async (req, res) => {
    try {
      const noteId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          noteId
        ) ||
        noteId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid note ID",
        });
      }

      const {
        categorySlug,
        categoryTitle,
        subcategorySlug,
        subcategoryTitle,
        title,
        price,
        pdf,
        content,
        isActive,
      } = req.body;

      const cleanCategorySlug =
        String(
          categorySlug || ""
        ).trim();

      const cleanCategoryTitle =
        String(
          categoryTitle || ""
        ).trim();

      const cleanSubcategorySlug =
        String(
          subcategorySlug || ""
        ).trim();

      const cleanSubcategoryTitle =
        String(
          subcategoryTitle || ""
        ).trim();

      const cleanTitle =
        String(
          title || ""
        ).trim();

      const cleanPdf =
        String(
          pdf || ""
        ).trim();

      const priceNumber =
        Number(price);

      if (
        !cleanCategorySlug ||
        !cleanCategoryTitle ||
        !cleanSubcategorySlug ||
        !cleanSubcategoryTitle ||
        !cleanTitle
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please fill all required fields.",
        });
      }

      if (
        !Number.isFinite(
          priceNumber
        ) ||
        priceNumber < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid price.",
        });
      }

      // Existing behavior:
      // agar content request me nahi aaya,
      // old content preserve hoga.
      const updateData = {
        categorySlug:
          cleanCategorySlug,

        categoryTitle:
          cleanCategoryTitle,

        subcategorySlug:
          cleanSubcategorySlug,

        subcategoryTitle:
          cleanSubcategoryTitle,

        title:
          cleanTitle,

        price:
          priceNumber,

        pdf:
          cleanPdf,

        isActive:
          Boolean(isActive),
      };

      if (
        Object.prototype
          .hasOwnProperty.call(
            req.body,
            "content"
          )
      ) {
        updateData.content =
          String(
            content || ""
          ).trim();
      }

      const note =
        await Note.findOneAndUpdate(
          {
            id:
              noteId,
          },
          {
            $set:
              updateData,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!note) {
        return res.status(404).json({
          success: false,
          message:
            "Note not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Note updated successfully",
      });
    } catch (error) {
      console.error(
        "Admin MongoDB update note error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update note",
      });
    }
  }
);

// ======================================================
// DEACTIVATE NOTE
// DELETE /api/admin/notes/:id
// ======================================================

router.delete(
  "/:id",
  requireAdminKey,
  async (req, res) => {
    try {
      const noteId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          noteId
        ) ||
        noteId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid note ID",
        });
      }

      const note =
        await Note.findOneAndUpdate(
          {
            id:
              noteId,
          },
          {
            $set: {
              isActive:
                false,
            },
          },
          {
            new: true,
          }
        );

      if (!note) {
        return res.status(404).json({
          success: false,
          message:
            "Note not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Note deactivated successfully",
      });
    } catch (error) {
      console.error(
        "Admin MongoDB deactivate note error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to deactivate note",
      });
    }
  }
);

module.exports = router;