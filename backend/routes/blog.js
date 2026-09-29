const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const { v2: cloudinary } = require("cloudinary");

const Blog = require("../models/Blog");

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

  if (
    !adminKey ||
    adminKey !== process.env.ADMIN_KEY
  ) {
    return res.status(401).json({
      message:
        "Unauthorized admin request",
    });
  }

  next();
}

/* =========================================================
   FORMAT BLOG
========================================================= */

function formatBlog(blog) {
  return {
    id: blog._id.toString(),

    title:
      blog.title,

    category:
      blog.category || "",

    summary:
      blog.summary,

    imageUrl:
      blog.imageUrl || "",

    content:
      blog.content,

    author:
      blog.author ||
      "Disha The Academy",

    date:
      blog.publishedDate,

    status:
      blog.status,

    createdAt:
      blog.createdAt,

    updatedAt:
      blog.updatedAt,
  };
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

const storage =
  multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    cb
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
      return cb(
        new Error(
          "Only JPG, PNG and WEBP images are allowed"
        )
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
        return res
          .status(400)
          .json({
            message:
              "Please select an image",
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
                    "disha-the-academy/blog",

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

                (
                  error,
                  result
                ) => {
                  if (error) {
                    reject(
                      error
                    );
                  } else {
                    resolve(
                      result
                    );
                  }
                }
              );

            stream.end(
              req.file.buffer
            );
          }
        );

      return res.json({
        message:
          "Image uploaded successfully",

        imageUrl:
          uploadResult.secure_url,

        publicId:
          uploadResult.public_id,
      });
    } catch (error) {
      console.error(
        "Blog image upload error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Image upload failed",
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
    const blogDocuments =
      await Blog.find({
        status: "Published",
      })
        .sort({
          publishedDate: -1,
          _id: -1,
        })
        .lean();

    const blogs =
      blogDocuments.map(
        formatBlog
      );

    return res.json(blogs);
  } catch (error) {
    console.error(
      "MongoDB get blogs error:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to load blogs",
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
      const blogDocuments =
        await Blog.find({})
          .sort({
            publishedDate: -1,
            _id: -1,
          })
          .lean();

      const blogs =
        blogDocuments.map(
          formatBlog
        );

      return res.json(
        blogs
      );
    } catch (error) {
      console.error(
        "MongoDB admin get blogs error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to load blogs",
        });
    }
  }
);

/* =========================================================
   GET SINGLE PUBLISHED BLOG
   GET /api/blog/:id
========================================================= */

router.get(
  "/:id",
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
            message:
              "Invalid blog ID",
          });
      }

      const blog =
        await Blog.findOne({
          _id: id,
          status: "Published",
        }).lean();

      if (!blog) {
        return res
          .status(404)
          .json({
            message:
              "Blog not found",
          });
      }

      return res.json(
        formatBlog(blog)
      );
    } catch (error) {
      console.error(
        "MongoDB get blog error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to load blog",
        });
    }
  }
);

/* =========================================================
   CREATE BLOG
   POST /api/blog
========================================================= */

router.post(
  "/",
  requireAdminKey,
  async (req, res) => {
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

      const cleanTitle =
        String(
          title || ""
        ).trim();

      const cleanSummary =
        String(
          summary || ""
        ).trim();

      const cleanContent =
        String(
          content || ""
        ).trim();

      if (!cleanTitle) {
        return res
          .status(400)
          .json({
            message:
              "Title is required",
          });
      }

      if (!cleanSummary) {
        return res
          .status(400)
          .json({
            message:
              "Summary is required",
          });
      }

      if (!cleanContent) {
        return res
          .status(400)
          .json({
            message:
              "Content is required",
          });
      }

      if (!date) {
        return res
          .status(400)
          .json({
            message:
              "Published date is required",
          });
      }

      const publishedDate =
        new Date(date);

      if (
        Number.isNaN(
          publishedDate.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid published date",
          });
      }

      const blogStatus =
        status === "Draft"
          ? "Draft"
          : "Published";

      const blog =
        await Blog.create({
          title:
            cleanTitle,

          category:
            String(
              category || ""
            ).trim(),

          summary:
            cleanSummary,

          imageUrl:
            String(
              imageUrl || ""
            ).trim(),

          content:
            cleanContent,

          author:
            String(
              author || ""
            ).trim() ||
            "Disha The Academy",

          publishedDate,

          status:
            blogStatus,
        });

      return res
        .status(201)
        .json({
          message:
            "Blog created successfully",

          id:
            blog._id.toString(),
        });
    } catch (error) {
      console.error(
        "MongoDB create blog error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to create blog",
        });
    }
  }
);

/* =========================================================
   UPDATE BLOG
   PUT /api/blog/:id
========================================================= */

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
            message:
              "Invalid blog ID",
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

      const cleanTitle =
        String(
          title || ""
        ).trim();

      const cleanSummary =
        String(
          summary || ""
        ).trim();

      const cleanContent =
        String(
          content || ""
        ).trim();

      if (!cleanTitle) {
        return res
          .status(400)
          .json({
            message:
              "Title is required",
          });
      }

      if (!cleanSummary) {
        return res
          .status(400)
          .json({
            message:
              "Summary is required",
          });
      }

      if (!cleanContent) {
        return res
          .status(400)
          .json({
            message:
              "Content is required",
          });
      }

      if (!date) {
        return res
          .status(400)
          .json({
            message:
              "Published date is required",
          });
      }

      const publishedDate =
        new Date(date);

      if (
        Number.isNaN(
          publishedDate.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid published date",
          });
      }

      const blog =
        await Blog.findById(
          id
        );

      if (!blog) {
        return res
          .status(404)
          .json({
            message:
              "Blog not found",
          });
      }

      blog.title =
        cleanTitle;

      blog.category =
        String(
          category || ""
        ).trim();

      blog.summary =
        cleanSummary;

      blog.imageUrl =
        String(
          imageUrl || ""
        ).trim();

      blog.content =
        cleanContent;

      blog.author =
        String(
          author || ""
        ).trim() ||
        "Disha The Academy";

      blog.publishedDate =
        publishedDate;

      blog.status =
        status === "Draft"
          ? "Draft"
          : "Published";

      await blog.save();

      return res.json({
        message:
          "Blog updated successfully",
      });
    } catch (error) {
      console.error(
        "MongoDB update blog error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to update blog",
        });
    }
  }
);

/* =========================================================
   DELETE BLOG
   DELETE /api/blog/:id
========================================================= */

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
            message:
              "Invalid blog ID",
          });
      }

      const deletedBlog =
        await Blog.findByIdAndDelete(
          id
        );

      if (!deletedBlog) {
        return res
          .status(404)
          .json({
            message:
              "Blog not found",
          });
      }

      return res.json({
        message:
          "Blog deleted successfully",
      });
    } catch (error) {
      console.error(
        "MongoDB delete blog error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to delete blog",
        });
    }
  }
);

/* =========================================================
   MULTER ERROR HANDLER
========================================================= */

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
            message:
              "Image must be smaller than 5 MB",
          });
      }

      return res
        .status(400)
        .json({
          message:
            error.message,
        });
    }

    if (error) {
      return res
        .status(400)
        .json({
          message:
            error.message ||
            "Image upload failed",
        });
    }

    next();
  }
);

module.exports = router;