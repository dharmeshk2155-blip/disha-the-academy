const express = require("express");
const { sql, connectDB } = require("../db");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, PNG and WEBP images are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// =====================================================
// ADMIN PROTECTION
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

// =====================================================
// HELPERS
// =====================================================
function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

// =====================================================
// POST /api/current-affairs/upload-image
// Admin - upload featured image to Cloudinary
// =====================================================
router.post(
  "/upload-image",
  requireAdminKey,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Please select an image.",
        });
      }

      const uploadResult = await new Promise(
        (resolve, reject) => {
          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder: "disha-the-academy/current-affairs",

                resource_type: "image",

                transformation: [
                  {
                    width: 1400,
                    height: 800,
                    crop: "limit",
                    quality: "auto",
                    fetch_format: "auto",
                  },
                ],
              },
              (error, result) => {
                if (error) {
                  reject(error);
                  return;
                }

                resolve(result);
              }
            );

          stream.end(req.file.buffer);
        }
      );

      return res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (error) {
      console.error(
        "Current Affairs image upload error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Failed to upload image.",
      });
    }
  }
);

// =====================================================
// GET /api/current-affairs
// Public - newest entries first
// =====================================================
router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        Id AS id,
        Title AS title,
        Summary AS summary,
        PublishedDate AS date,
        Category AS category,
        ImageUrl AS imageUrl,
        Content AS content,
        KeyPoints AS keyPoints,
        CreatedAt AS createdAt
      FROM dbo.CurrentAffairs
      ORDER BY PublishedDate DESC, Id DESC
    `);

    return res.json(result.recordset);
  } catch (err) {
    console.error("Current Affairs GET error:", err);

    return res.status(500).json({
      error: "Failed to load current affairs",
    });
  }
});

// =====================================================
// GET /api/current-affairs/:id
// Public - single current affair
// =====================================================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid current affair ID",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT
          Id AS id,
          Title AS title,
          Summary AS summary,
          PublishedDate AS date,
          Category AS category,
          ImageUrl AS imageUrl,
          Content AS content,
          KeyPoints AS keyPoints,
          CreatedAt AS createdAt
        FROM dbo.CurrentAffairs
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        error: "Current affair not found",
      });
    }

    return res.json(result.recordset[0]);
  } catch (err) {
    console.error("Current Affairs single GET error:", err);

    return res.status(500).json({
      error: "Failed to load current affair",
    });
  }
});

// =====================================================
// POST /api/current-affairs
// Admin - add new entry
// =====================================================
router.post("/", requireAdminKey, async (req, res) => {
  try {
    const {
      title,
      summary,
      date,
      category,
      imageUrl,
      content,
      keyPoints,
    } = req.body;

    const cleanTitle = cleanText(title);
    const cleanSummary = cleanText(summary);
    const cleanDate = cleanText(date);
    const cleanCategory = cleanText(category);
    const cleanImageUrl = nullableText(imageUrl);
    const cleanContent = cleanText(content);
    const cleanKeyPoints = nullableText(keyPoints);

    if (
      !cleanTitle ||
      !cleanSummary ||
      !cleanDate ||
      !cleanCategory ||
      !cleanContent
    ) {
      return res.status(400).json({
        error:
          "title, summary, date, category and content are required",
      });
    }

    if (cleanTitle.length > 500) {
      return res.status(400).json({
        error: "Title cannot be longer than 500 characters",
      });
    }

    if (cleanCategory.length > 100) {
      return res.status(400).json({
        error: "Category cannot be longer than 100 characters",
      });
    }

    if (cleanImageUrl && cleanImageUrl.length > 1000) {
      return res.status(400).json({
        error: "Image URL cannot be longer than 1000 characters",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("title", sql.NVarChar(500), cleanTitle)
      .input("summary", sql.NVarChar(sql.MAX), cleanSummary)
      .input("date", sql.Date, cleanDate)
      .input("category", sql.NVarChar(100), cleanCategory)
      .input("imageUrl", sql.NVarChar(1000), cleanImageUrl)
      .input("content", sql.NVarChar(sql.MAX), cleanContent)
      .input("keyPoints", sql.NVarChar(sql.MAX), cleanKeyPoints)
      .query(`
        INSERT INTO dbo.CurrentAffairs
        (
          Title,
          Summary,
          PublishedDate,
          Category,
          ImageUrl,
          Content,
          KeyPoints
        )

        OUTPUT
          INSERTED.Id AS id,
          INSERTED.Title AS title,
          INSERTED.Summary AS summary,
          INSERTED.PublishedDate AS date,
          INSERTED.Category AS category,
          INSERTED.ImageUrl AS imageUrl,
          INSERTED.Content AS content,
          INSERTED.KeyPoints AS keyPoints,
          INSERTED.CreatedAt AS createdAt

        VALUES
        (
          @title,
          @summary,
          @date,
          @category,
          @imageUrl,
          @content,
          @keyPoints
        )
      `);

    return res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error("Current Affairs POST error:", err);

    return res.status(500).json({
      error: "Failed to add current affair",
    });
  }
});

// =====================================================
// PUT /api/current-affairs/:id
// Admin - edit existing entry
// =====================================================
router.put("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      title,
      summary,
      date,
      category,
      imageUrl,
      content,
      keyPoints,
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid current affair ID",
      });
    }

    const cleanTitle = cleanText(title);
    const cleanSummary = cleanText(summary);
    const cleanDate = cleanText(date);
    const cleanCategory = cleanText(category);
    const cleanImageUrl = nullableText(imageUrl);
    const cleanContent = cleanText(content);
    const cleanKeyPoints = nullableText(keyPoints);

    if (
      !cleanTitle ||
      !cleanSummary ||
      !cleanDate ||
      !cleanCategory ||
      !cleanContent
    ) {
      return res.status(400).json({
        error:
          "title, summary, date, category and content are required",
      });
    }

    if (cleanTitle.length > 500) {
      return res.status(400).json({
        error: "Title cannot be longer than 500 characters",
      });
    }

    if (cleanCategory.length > 100) {
      return res.status(400).json({
        error: "Category cannot be longer than 100 characters",
      });
    }

    if (cleanImageUrl && cleanImageUrl.length > 1000) {
      return res.status(400).json({
        error: "Image URL cannot be longer than 1000 characters",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("title", sql.NVarChar(500), cleanTitle)
      .input("summary", sql.NVarChar(sql.MAX), cleanSummary)
      .input("date", sql.Date, cleanDate)
      .input("category", sql.NVarChar(100), cleanCategory)
      .input("imageUrl", sql.NVarChar(1000), cleanImageUrl)
      .input("content", sql.NVarChar(sql.MAX), cleanContent)
      .input("keyPoints", sql.NVarChar(sql.MAX), cleanKeyPoints)
      .query(`
        UPDATE dbo.CurrentAffairs
        SET
          Title = @title,
          Summary = @summary,
          PublishedDate = @date,
          Category = @category,
          ImageUrl = @imageUrl,
          Content = @content,
          KeyPoints = @keyPoints

        OUTPUT
          INSERTED.Id AS id,
          INSERTED.Title AS title,
          INSERTED.Summary AS summary,
          INSERTED.PublishedDate AS date,
          INSERTED.Category AS category,
          INSERTED.ImageUrl AS imageUrl,
          INSERTED.Content AS content,
          INSERTED.KeyPoints AS keyPoints,
          INSERTED.CreatedAt AS createdAt

        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        error: "Current affair not found",
      });
    }

    return res.json(result.recordset[0]);
  } catch (err) {
    console.error("Current Affairs PUT error:", err);

    return res.status(500).json({
      error: "Failed to update current affair",
    });
  }
});

// =====================================================
// DELETE /api/current-affairs/:id
// Admin - delete entry
// =====================================================
router.delete("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid current affair ID",
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.CurrentAffairs
        WHERE Id = @id
      `);

    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: "Current affair not found",
      });
    }

    return res.json({
      success: true,
      message: "Current affair deleted successfully",
      id,
    });
  } catch (err) {
    console.error("Current Affairs DELETE error:", err);

    return res.status(500).json({
      error: "Failed to delete current affair",
    });
  }
});

// =====================================================
// MULTER ERROR HANDLER
// =====================================================
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "Image must be smaller than 5 MB.",
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "Invalid image upload.",
    });
  }

  next();
});

module.exports = router;