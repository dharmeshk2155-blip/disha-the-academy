const express = require("express");
const multer = require("multer");

const Note = require("../models/Note");
const requireAdmin = require("../middleware/requireAdmin");
const { saveNoteImage } = require("../utils/mediaStorage");
const {
  blocksToHtml,
  convertDocxToBlocks,
  summarise,
  validateBlocks,
} = require("../utils/docxNotes");

/* =====================================================
   WORD NOTES IMPORT  (admin only)

   POST /api/admin/notes-import/convert
        multipart "file" (.docx)  ->  blocks + warnings + stats
        Nothing is saved as a note yet. Embedded images are stored.

   POST /api/admin/notes-import/publish
        JSON { details..., blocks }  ->  creates the note
        (blocks are checked again, the HTML is built on the server)
===================================================== */

const router = express.Router();

router.use(requireAdmin);

const MAX_FILE_BYTES = 15 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
});

const LANGUAGES = ["en", "hi", "bilingual"];

function fail(res, status, message, extra = {}) {
  return res.status(status).json({ success: false, message, ...extra });
}

function clean(value) {
  return String(value ?? "").trim();
}

// a .docx is a zip file: it must start with "PK"
function looksLikeDocx(buffer) {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length > 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05)
  );
}

/* ---------------------------------------------------
   CONVERT
--------------------------------------------------- */
router.post(
  "/convert",
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (!error) return next();

      if (error.code === "LIMIT_FILE_SIZE") {
        return fail(res, 413, "The file is larger than 15 MB.");
      }

      return fail(res, 400, "The file could not be uploaded.");
    });
  },
  async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return fail(res, 400, "Please choose a Word (.docx) file.");
      }

      if (!/\.docx$/i.test(file.originalname || "")) {
        return fail(
          res,
          400,
          "Only .docx files are supported. Open the file in Word and use Save As > Word Document (.docx)."
        );
      }

      if (!looksLikeDocx(file.buffer)) {
        return fail(
          res,
          400,
          "This file is not a valid Word document. It may be damaged or renamed from another format."
        );
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;

      let converted;

      try {
        converted = await convertDocxToBlocks(file.buffer, {
          saveImage: ({ buffer, ext }) =>
            saveNoteImage({ buffer, ext, baseUrl }),
        });
      } catch (error) {
        if (error.code === "MAMMOTH_MISSING") {
          console.error(error.message);
          return fail(res, 500, error.message);
        }

        console.error("DOCX conversion error:", error);

        return fail(
          res,
          422,
          "This Word file could not be read. Please re-save it as .docx and try again."
        );
      }

      const { blocks, warnings, stats } = converted;

      if (!blocks.length) {
        return fail(
          res,
          422,
          "No readable content was found in this Word file."
        );
      }

      return res.json({
        success: true,
        fileName: file.originalname,
        blocks,
        warnings,
        stats,
      });
    } catch (error) {
      console.error("Notes import convert error:", error);
      return fail(res, 500, "Failed to convert the Word file.");
    }
  }
);

/* ---------------------------------------------------
   PUBLISH
--------------------------------------------------- */
router.post("/publish", async (req, res) => {
  try {
    const body = req.body || {};

    const title = clean(body.title);
    const categorySlug = clean(body.categorySlug);
    const categoryTitle = clean(body.categoryTitle);
    const subcategorySlug = clean(body.subcategorySlug);
    const subcategoryTitle = clean(body.subcategoryTitle);
    const language = LANGUAGES.includes(body.language) ? body.language : "en";
    const price = Number(body.price);

    if (
      !title ||
      !categorySlug ||
      !categoryTitle ||
      !subcategorySlug ||
      !subcategoryTitle
    ) {
      return fail(res, 400, "Please fill the title, category and subject.");
    }

    if (title.length > 255) {
      return fail(res, 400, "The title is too long (maximum 255 characters).");
    }

    if (!Number.isFinite(price) || price < 0) {
      return fail(res, 400, "Please enter a valid price.");
    }

    const { blocks, errors } = validateBlocks(body.blocks);

    if (errors.length) {
      return fail(res, 400, errors[0], { errors });
    }

    // same title in the same subject = almost surely a duplicate import
    const duplicate = await Note.findOne({
      categorySlug,
      subcategorySlug,
      title: new RegExp(
        `^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      ),
    })
      .select({ id: 1 })
      .lean();

    if (duplicate) {
      return fail(
        res,
        409,
        `A note with this title already exists in this subject (note #${duplicate.id}). Change the title.`
      );
    }

    const last = await Note.findOne({}).sort({ id: -1 }).select({ id: 1 }).lean();
    const nextId = last?.id ? Number(last.id) + 1 : 1;

    const note = await Note.create({
      id: nextId,
      categorySlug,
      categoryTitle,
      subcategorySlug,
      subcategoryTitle,
      title,
      price,
      pdf: "",
      content: blocksToHtml(blocks),
      language,
      blocks,
      source: "docx",
      sourceFileName: clean(body.sourceFileName).slice(0, 255),
      isActive: body.isActive !== false,
    });

    return res.status(201).json({
      success: true,
      message: note.isActive ? "Note published." : "Note saved as a draft.",
      note: {
        id: note.id,
        title: note.title,
        isActive: note.isActive,
        stats: summarise(blocks),
      },
    });
  } catch (error) {
    console.error("Notes import publish error:", error);
    return fail(res, 500, "Failed to publish the note.");
  }
});

module.exports = router;