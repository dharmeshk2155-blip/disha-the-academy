const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const { v2: cloudinary } = require("cloudinary");

const CurrentAffair = require("../models/CurrentAffair");

const router = express.Router();

// =====================================================
// CLOUDINARY
// =====================================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =====================================================
// IMAGE UPLOAD
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),

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

const requireAdmin = require("../middleware/requireAdmin");

// =====================================================
// HELPERS
// =====================================================

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function nullableText(value) {
  const cleaned = cleanText(value);

  return cleaned || null;
}

function formatCurrentAffair(article) {
  return {
    id: article._id.toString(),

    title: article.title,

    summary: article.summary,

    date: article.publishedDate,

    category: article.category,

    imageUrl:
      article.imageUrl || null,

    content: article.content,

    keyPoints:
      article.keyPoints || null,

    createdAt: article.createdAt,
  };
}

// =====================================================
// POST /api/current-affairs/upload-image
// Admin - upload featured image to Cloudinary
// =====================================================

router.post(
  "/upload-image",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error:
            "Please select an image.",
        });
      }

      const uploadResult =
        await new Promise(
          (resolve, reject) => {
            const stream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    "disha-the-academy/current-affairs",

                  resource_type:
                    "image",

                  transformation: [
                    {
                      width: 1400,
                      height: 800,
                      crop: "limit",
                      quality: "auto",
                      fetch_format:
                        "auto",
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

            stream.end(
              req.file.buffer
            );
          }
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Image uploaded successfully.",

          imageUrl:
            uploadResult.secure_url,

          publicId:
            uploadResult.public_id,
        });
    } catch (error) {
      console.error(
        "Current Affairs image upload error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          error:
            "Failed to upload image.",
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
    const articleDocuments =
      await CurrentAffair.find({})
        .sort({
          publishedDate: -1,
          _id: -1,
        })
        .lean();

    const articles =
      articleDocuments.map(
        formatCurrentAffair
      );

    return res.json(articles);
  } catch (error) {
    console.error(
      "MongoDB Current Affairs GET error:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          "Failed to load current affairs",
      });
  }
});

// =====================================================
// GET /api/current-affairs/:id
// Public - single current affair
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const id =
      String(
        req.params.id || ""
      ).trim();

    if (
      !mongoose.isValidObjectId(id)
    ) {
      return res
        .status(400)
        .json({
          error:
            "Invalid current affair ID",
        });
    }

    const article =
      await CurrentAffair.findById(
        id
      ).lean();

    if (!article) {
      return res
        .status(404)
        .json({
          error:
            "Current affair not found",
        });
    }

    return res.json(
      formatCurrentAffair(
        article
      )
    );
  } catch (error) {
    console.error(
      "MongoDB Current Affairs single GET error:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          "Failed to load current affair",
      });
  }
});

// =====================================================
// POST /api/current-affairs
// Admin - add new entry
// =====================================================

router.post(
  "/",
  requireAdmin,
  async (req, res) => {
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

      const cleanTitle =
        cleanText(title);

      const cleanSummary =
        cleanText(summary);

      const cleanDate =
        cleanText(date);

      const cleanCategory =
        cleanText(category);

      const cleanImageUrl =
        nullableText(imageUrl);

      const cleanContent =
        cleanText(content);

      const cleanKeyPoints =
        nullableText(keyPoints);

      // ------------------------------------------
      // REQUIRED FIELDS
      // ------------------------------------------

      if (
        !cleanTitle ||
        !cleanSummary ||
        !cleanDate ||
        !cleanCategory ||
        !cleanContent
      ) {
        return res
          .status(400)
          .json({
            error:
              "title, summary, date, category and content are required",
          });
      }

      // ------------------------------------------
      // LENGTH VALIDATION
      // ------------------------------------------

      if (
        cleanTitle.length > 500
      ) {
        return res
          .status(400)
          .json({
            error:
              "Title cannot be longer than 500 characters",
          });
      }

      if (
        cleanCategory.length > 100
      ) {
        return res
          .status(400)
          .json({
            error:
              "Category cannot be longer than 100 characters",
          });
      }

      if (
        cleanImageUrl &&
        cleanImageUrl.length > 1000
      ) {
        return res
          .status(400)
          .json({
            error:
              "Image URL cannot be longer than 1000 characters",
          });
      }

      // ------------------------------------------
      // DATE VALIDATION
      // ------------------------------------------

      const publishedDate =
        new Date(cleanDate);

      if (
        Number.isNaN(
          publishedDate.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid published date",
          });
      }

      // ------------------------------------------
      // CREATE ARTICLE
      // ------------------------------------------

      const article =
        await CurrentAffair.create({
          title:
            cleanTitle,

          summary:
            cleanSummary,

          publishedDate,

          category:
            cleanCategory,

          imageUrl:
            cleanImageUrl || "",

          content:
            cleanContent,

          keyPoints:
            cleanKeyPoints || "",
        });

      return res
        .status(201)
        .json(
          formatCurrentAffair(
            article
          )
        );
    } catch (error) {
      console.error(
        "MongoDB Current Affairs POST error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to add current affair",
        });
    }
  }
);

// =====================================================
// PUT /api/current-affairs/:id
// Admin - edit existing entry
// =====================================================

router.put(
  "/:id",
  requireAdmin,
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
              "Invalid current affair ID",
          });
      }

      const {
        title,
        summary,
        date,
        category,
        imageUrl,
        content,
        keyPoints,
      } = req.body;

      const cleanTitle =
        cleanText(title);

      const cleanSummary =
        cleanText(summary);

      const cleanDate =
        cleanText(date);

      const cleanCategory =
        cleanText(category);

      const cleanImageUrl =
        nullableText(imageUrl);

      const cleanContent =
        cleanText(content);

      const cleanKeyPoints =
        nullableText(keyPoints);

      // ------------------------------------------
      // REQUIRED FIELDS
      // ------------------------------------------

      if (
        !cleanTitle ||
        !cleanSummary ||
        !cleanDate ||
        !cleanCategory ||
        !cleanContent
      ) {
        return res
          .status(400)
          .json({
            error:
              "title, summary, date, category and content are required",
          });
      }

      // ------------------------------------------
      // LENGTH VALIDATION
      // ------------------------------------------

      if (
        cleanTitle.length > 500
      ) {
        return res
          .status(400)
          .json({
            error:
              "Title cannot be longer than 500 characters",
          });
      }

      if (
        cleanCategory.length > 100
      ) {
        return res
          .status(400)
          .json({
            error:
              "Category cannot be longer than 100 characters",
          });
      }

      if (
        cleanImageUrl &&
        cleanImageUrl.length > 1000
      ) {
        return res
          .status(400)
          .json({
            error:
              "Image URL cannot be longer than 1000 characters",
          });
      }

      // ------------------------------------------
      // DATE VALIDATION
      // ------------------------------------------

      const publishedDate =
        new Date(cleanDate);

      if (
        Number.isNaN(
          publishedDate.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid published date",
          });
      }

      // ------------------------------------------
      // FIND ARTICLE
      // ------------------------------------------

      const article =
        await CurrentAffair.findById(
          id
        );

      if (!article) {
        return res
          .status(404)
          .json({
            error:
              "Current affair not found",
          });
      }

      // ------------------------------------------
      // UPDATE ARTICLE
      // ------------------------------------------

      article.title =
        cleanTitle;

      article.summary =
        cleanSummary;

      article.publishedDate =
        publishedDate;

      article.category =
        cleanCategory;

      article.imageUrl =
        cleanImageUrl || "";

      article.content =
        cleanContent;

      article.keyPoints =
        cleanKeyPoints || "";

      await article.save();

      return res.json(
        formatCurrentAffair(
          article
        )
      );
    } catch (error) {
      console.error(
        "MongoDB Current Affairs PUT error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to update current affair",
        });
    }
  }
);

// =====================================================
// DELETE /api/current-affairs/:id
// Admin - delete entry
// =====================================================

router.delete(
  "/:id",
  requireAdmin,
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
              "Invalid current affair ID",
          });
      }

      const deletedArticle =
        await CurrentAffair.findByIdAndDelete(
          id
        );

      if (!deletedArticle) {
        return res
          .status(404)
          .json({
            error:
              "Current affair not found",
          });
      }

      return res.json({
        success: true,

        message:
          "Current affair deleted successfully",

        id:
          deletedArticle._id.toString(),
      });
    } catch (error) {
      console.error(
        "MongoDB Current Affairs DELETE error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to delete current affair",
        });
    }
  }
);

// =====================================================
// MULTER ERROR HANDLER
// =====================================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Image must be smaller than 5 MB.",
          });
      }

      return res
        .status(400)
        .json({
          success: false,
          error:
            error.message,
        });
    }

    if (error) {
      return res
        .status(400)
        .json({
          success: false,

          error:
            error.message ||
            "Invalid image upload.",
        });
    }

    next();
  }
);

module.exports = router;