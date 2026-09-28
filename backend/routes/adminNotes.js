const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const router = express.Router();

const { sql, connectDB } = require("../db");

// ======================================================
// CLOUDINARY
// ======================================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
// NOTES IMAGE UPLOAD
// ======================================================

const imageStorage =
  multer.memoryStorage();

const imageUpload = multer({
  storage: imageStorage,

  limits: {
    fileSize:
      8 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.mimetype
      )
    ) {
      return callback(
        new Error(
          "Only JPG, PNG and WEBP images are allowed."
        )
      );
    }

    callback(null, true);
  },
});

// ======================================================
// UPLOAD NOTE IMAGE
//
// POST /api/admin/notes/upload-image
// ======================================================

router.post(
  "/upload-image",
  requireAdminKey,
  imageUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select an image.",
        });
      }

      const uploadResult =
        await new Promise(
          (
            resolve,
            reject
          ) => {
            const stream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    "disha-the-academy/notes",

                  resource_type:
                    "image",

                  transformation: [
                    {
                      width: 1800,
                      crop: "limit",
                      quality: "auto",
                      fetch_format:
                        "auto",
                    },
                  ],
                },

                (
                  error,
                  result
                ) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );

            stream.end(
              req.file.buffer
            );
          }
        );

      return res.json({
        success: true,

        message:
          "Image uploaded successfully.",

        imageUrl:
          uploadResult.secure_url,

        publicId:
          uploadResult.public_id,

        width:
          uploadResult.width,

        height:
          uploadResult.height,
      });
    } catch (error) {
      console.error(
        "Note image upload error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to upload image.",
      });
    }
  }
);

// ======================================================
// GET ALL NOTES
// ======================================================

router.get(
  "/",
  requireAdminKey,
  async (req, res) => {
    try {
      const pool =
        await connectDB();

      const result =
        await pool
          .request()
          .query(`
            SELECT
              Id,
              CategorySlug,
              CategoryTitle,
              SubcategorySlug,
              SubcategoryTitle,
              Title,
              Price,
              Pdf,
              Content,
              IsActive,
              CreatedAt,
              UpdatedAt
            FROM dbo.Notes
            ORDER BY Id ASC
          `);

      const notes =
        result.recordset.map(
          (note) => ({
            id: note.Id,

            categorySlug:
              note.CategorySlug,

            categoryTitle:
              note.CategoryTitle,

            subcategorySlug:
              note.SubcategorySlug,

            subcategoryTitle:
              note.SubcategoryTitle,

            title:
              note.Title,

            price:
              Number(
                note.Price
              ) || 0,

            // Old system preserved.
            pdf:
              note.Pdf || "",

            // New article/book content.
            content:
              note.Content || "",

            isActive:
              Boolean(
                note.IsActive
              ),

            createdAt:
              note.CreatedAt,

            updatedAt:
              note.UpdatedAt,
          })
        );

      return res.json({
        success: true,
        count:
          notes.length,
        notes,
      });
    } catch (error) {
      console.error(
        "Admin notes fetch error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load notes",
        });
    }
  }
);

// ======================================================
// CREATE NOTE
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

      // ==================================================
      // REQUIRED FIELDS
      // ==================================================

      if (
        !cleanCategorySlug ||
        !cleanCategoryTitle ||
        !cleanSubcategorySlug ||
        !cleanSubcategoryTitle ||
        !cleanTitle
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Please fill all required fields.",
          });
      }

      // ==================================================
      // PRICE
      // ==================================================

      if (
        !Number.isFinite(
          priceNumber
        ) ||
        priceNumber < 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Please enter a valid price.",
          });
      }

      const pool =
        await connectDB();

      // ==================================================
      // NEXT ID
      // ==================================================

      const idResult =
        await pool
          .request()
          .query(`
            SELECT
              ISNULL(MAX(Id), 0) + 1
                AS NextId
            FROM dbo.Notes
          `);

      const nextId =
        Number(
          idResult
            .recordset[0]
            ?.NextId
        ) || 1;

      // ==================================================
      // INSERT NOTE
      // ==================================================

      await pool
        .request()

        .input(
          "Id",
          sql.Int,
          nextId
        )

        .input(
          "CategorySlug",
          sql.NVarChar(150),
          cleanCategorySlug
        )

        .input(
          "CategoryTitle",
          sql.NVarChar(200),
          cleanCategoryTitle
        )

        .input(
          "SubcategorySlug",
          sql.NVarChar(150),
          cleanSubcategorySlug
        )

        .input(
          "SubcategoryTitle",
          sql.NVarChar(200),
          cleanSubcategoryTitle
        )

        .input(
          "Title",
          sql.NVarChar(255),
          cleanTitle
        )

        .input(
          "Price",
          sql.Decimal(10, 2),
          priceNumber
        )

        .input(
          "Pdf",
          sql.NVarChar(500),
          cleanPdf || null
        )

        .input(
          "Content",
          sql.NVarChar(
            sql.MAX
          ),
          cleanContent || null
        )

        .input(
          "IsActive",
          sql.Bit,
          isActive === false
            ? false
            : true
        )

        .query(`
          INSERT INTO dbo.Notes
          (
            Id,
            CategorySlug,
            CategoryTitle,
            SubcategorySlug,
            SubcategoryTitle,
            Title,
            Price,
            Pdf,
            Content,
            IsActive
          )

          VALUES
          (
            @Id,
            @CategorySlug,
            @CategoryTitle,
            @SubcategorySlug,
            @SubcategoryTitle,
            @Title,
            @Price,
            @Pdf,
            @Content,
            @IsActive
          )
        `);

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Note created successfully",

          id: nextId,
        });
    } catch (error) {
      console.error(
        "Admin create note error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to create note",
        });
    }
  }
);

// ======================================================
// UPDATE NOTE
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
        return res
          .status(400)
          .json({
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

      const contentProvided =
        Object.prototype
          .hasOwnProperty
          .call(
            req.body,
            "content"
          );

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

      if (
        !cleanCategorySlug ||
        !cleanCategoryTitle ||
        !cleanSubcategorySlug ||
        !cleanSubcategoryTitle ||
        !cleanTitle
      ) {
        return res
          .status(400)
          .json({
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
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Please enter a valid price.",
          });
      }

      const pool =
        await connectDB();

      const result =
        await pool
          .request()

          .input(
            "Id",
            sql.Int,
            noteId
          )

          .input(
            "CategorySlug",
            sql.NVarChar(150),
            cleanCategorySlug
          )

          .input(
            "CategoryTitle",
            sql.NVarChar(200),
            cleanCategoryTitle
          )

          .input(
            "SubcategorySlug",
            sql.NVarChar(150),
            cleanSubcategorySlug
          )

          .input(
            "SubcategoryTitle",
            sql.NVarChar(200),
            cleanSubcategoryTitle
          )

          .input(
            "Title",
            sql.NVarChar(255),
            cleanTitle
          )

          .input(
            "Price",
            sql.Decimal(10, 2),
            priceNumber
          )

          .input(
            "Pdf",
            sql.NVarChar(500),
            cleanPdf || null
          )

          .input(
            "Content",
            sql.NVarChar(
              sql.MAX
            ),
            contentProvided
              ? cleanContent ||
                null
              : null
          )

          .input(
            "ContentProvided",
            sql.Bit,
            contentProvided
          )

          .input(
            "IsActive",
            sql.Bit,
            Boolean(
              isActive
            )
          )

          .query(`
            UPDATE dbo.Notes

            SET
              CategorySlug =
                @CategorySlug,

              CategoryTitle =
                @CategoryTitle,

              SubcategorySlug =
                @SubcategorySlug,

              SubcategoryTitle =
                @SubcategoryTitle,

              Title =
                @Title,

              Price =
                @Price,

              Pdf =
                @Pdf,

              Content =
                CASE
                  WHEN
                    @ContentProvided = 1
                  THEN @Content
                  ELSE Content
                END,

              IsActive =
                @IsActive,

              UpdatedAt =
                SYSDATETIME()

            WHERE Id = @Id
          `);

      if (
        !result
          .rowsAffected?.[0]
      ) {
        return res
          .status(404)
          .json({
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
        "Admin update note error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to update note",
        });
    }
  }
);

// ======================================================
// DEACTIVATE NOTE
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
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid note ID",
          });
      }

      const pool =
        await connectDB();

      const result =
        await pool
          .request()

          .input(
            "Id",
            sql.Int,
            noteId
          )

          .query(`
            UPDATE dbo.Notes

            SET
              IsActive = 0,

              UpdatedAt =
                SYSDATETIME()

            WHERE Id = @Id
          `);

      if (
        !result
          .rowsAffected?.[0]
      ) {
        return res
          .status(404)
          .json({
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
        "Admin delete note error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to deactivate note",
        });
    }
  }
);

// ======================================================
// MULTER / IMAGE ERROR HANDLER
// ======================================================

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

            message:
              "Image must be smaller than 8 MB.",
          });
      }

      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message,
        });
    }

    if (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error.message ||
            "Image upload failed.",
        });
    }

    next();
  }
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;