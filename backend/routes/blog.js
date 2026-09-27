const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { sql, connectDB } = require("../db");

const router = express.Router();

/* =========================================================
   CLOUDINARY
========================================================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =========================================================
   ADMIN SECURITY
========================================================= */

function requireAdminKey(req, res, next) {
  const adminKey = req.headers["x-admin-key"];

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      message: "Unauthorized admin request",
    });
  }

  next();
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG and WEBP images are allowed")
      );
    }

    cb(null, true);
  },
});

/* =========================================================
   UPLOAD BLOG IMAGE
   POST /api/blog/upload-image
========================================================= */

router.post(
  "/upload-image",
  requireAdminKey,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please select an image",
        });
      }

      const uploadResult = await new Promise(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "disha-the-academy/blog",
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
              } else {
                resolve(result);
              }
            }
          );

          stream.end(req.file.buffer);
        }
      );

      res.json({
        message: "Image uploaded successfully",
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (error) {
      console.error("Blog image upload error:", error);

      res.status(500).json({
        message: "Image upload failed",
      });
    }
  }
);

/* =========================================================
   GET ALL PUBLISHED BLOGS
   GET /api/blog
========================================================= */

router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        Id AS id,
        Title AS title,
        Category AS category,
        Summary AS summary,
        ImageUrl AS imageUrl,
        Content AS content,
        Author AS author,
        PublishedDate AS date,
        Status AS status,
        CreatedAt AS createdAt,
        UpdatedAt AS updatedAt
      FROM dbo.Blogs
      WHERE Status = 'Published'
      ORDER BY PublishedDate DESC, Id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Get blogs error:", error);

    res.status(500).json({
      message: "Failed to load blogs",
    });
  }
});

/* =========================================================
   ADMIN — GET ALL BLOGS INCLUDING DRAFTS
   GET /api/blog/admin/all
========================================================= */

router.get(
  "/admin/all",
  requireAdminKey,
  async (req, res) => {
    try {
      const pool = await connectDB();

      const result = await pool.request().query(`
        SELECT
          Id AS id,
          Title AS title,
          Category AS category,
          Summary AS summary,
          ImageUrl AS imageUrl,
          Content AS content,
          Author AS author,
          PublishedDate AS date,
          Status AS status,
          CreatedAt AS createdAt,
          UpdatedAt AS updatedAt
        FROM dbo.Blogs
        ORDER BY PublishedDate DESC, Id DESC
      `);

      res.json(result.recordset);
    } catch (error) {
      console.error("Admin get blogs error:", error);

      res.status(500).json({
        message: "Failed to load blogs",
      });
    }
  }
);

/* =========================================================
   GET SINGLE PUBLISHED BLOG
   GET /api/blog/:id
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid blog ID",
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
          Category AS category,
          Summary AS summary,
          ImageUrl AS imageUrl,
          Content AS content,
          Author AS author,
          PublishedDate AS date,
          Status AS status,
          CreatedAt AS createdAt,
          UpdatedAt AS updatedAt
        FROM dbo.Blogs
        WHERE Id = @id
          AND Status = 'Published'
      `);

    if (!result.recordset.length) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Get blog error:", error);

    res.status(500).json({
      message: "Failed to load blog",
    });
  }
});

/* =========================================================
   CREATE BLOG
   POST /api/blog
========================================================= */

router.post("/", requireAdminKey, async (req, res) => {
  try {
    const {
      title,
      category,
      summary,
      imageUrl,
      content,
      author,
      date,
      status,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (!summary?.trim()) {
      return res.status(400).json({
        message: "Summary is required",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        message: "Published date is required",
      });
    }

    const blogStatus =
      status === "Draft" ? "Draft" : "Published";

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("title", sql.NVarChar(500), title.trim())
      .input(
        "category",
        sql.NVarChar(100),
        category?.trim() || null
      )
      .input("summary", sql.NVarChar(sql.MAX), summary.trim())
      .input(
        "imageUrl",
        sql.NVarChar(1000),
        imageUrl?.trim() || null
      )
      .input("content", sql.NVarChar(sql.MAX), content.trim())
      .input(
        "author",
        sql.NVarChar(150),
        author?.trim() || "Disha The Academy"
      )
      .input("date", sql.Date, date)
      .input("status", sql.NVarChar(20), blogStatus)
      .query(`
        INSERT INTO dbo.Blogs
        (
          Title,
          Category,
          Summary,
          ImageUrl,
          Content,
          Author,
          PublishedDate,
          Status
        )
        OUTPUT INSERTED.Id AS id
        VALUES
        (
          @title,
          @category,
          @summary,
          @imageUrl,
          @content,
          @author,
          @date,
          @status
        )
      `);

    res.status(201).json({
      message: "Blog created successfully",
      id: result.recordset[0].id,
    });
  } catch (error) {
    console.error("Create blog error:", error);

    res.status(500).json({
      message: "Failed to create blog",
    });
  }
});

/* =========================================================
   UPDATE BLOG
   PUT /api/blog/:id
========================================================= */

router.put("/:id", requireAdminKey, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid blog ID",
      });
    }

    const {
      title,
      category,
      summary,
      imageUrl,
      content,
      author,
      date,
      status,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (!summary?.trim()) {
      return res.status(400).json({
        message: "Summary is required",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        message: "Published date is required",
      });
    }

    const blogStatus =
      status === "Draft" ? "Draft" : "Published";

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("title", sql.NVarChar(500), title.trim())
      .input(
        "category",
        sql.NVarChar(100),
        category?.trim() || null
      )
      .input("summary", sql.NVarChar(sql.MAX), summary.trim())
      .input(
        "imageUrl",
        sql.NVarChar(1000),
        imageUrl?.trim() || null
      )
      .input("content", sql.NVarChar(sql.MAX), content.trim())
      .input(
        "author",
        sql.NVarChar(150),
        author?.trim() || "Disha The Academy"
      )
      .input("date", sql.Date, date)
      .input("status", sql.NVarChar(20), blogStatus)
      .query(`
        UPDATE dbo.Blogs
        SET
          Title = @title,
          Category = @category,
          Summary = @summary,
          ImageUrl = @imageUrl,
          Content = @content,
          Author = @author,
          PublishedDate = @date,
          Status = @status,
          UpdatedAt = SYSDATETIME()
        WHERE Id = @id
      `);

    if (!result.rowsAffected[0]) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    res.json({
      message: "Blog updated successfully",
    });
  } catch (error) {
    console.error("Update blog error:", error);

    res.status(500).json({
      message: "Failed to update blog",
    });
  }
});

/* =========================================================
   DELETE BLOG
   DELETE /api/blog/:id
========================================================= */

router.delete(
  "/:id",
  requireAdminKey,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid blog ID",
        });
      }

      const pool = await connectDB();

      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          DELETE FROM dbo.Blogs
          WHERE Id = @id
        `);

      if (!result.rowsAffected[0]) {
        return res.status(404).json({
          message: "Blog not found",
        });
      }

      res.json({
        message: "Blog deleted successfully",
      });
    } catch (error) {
      console.error("Delete blog error:", error);

      res.status(500).json({
        message: "Failed to delete blog",
      });
    }
  }
);

/* =========================================================
   MULTER ERROR HANDLER
========================================================= */

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image must be smaller than 5 MB",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message || "Image upload failed",
    });
  }

  next();
});

module.exports = router;