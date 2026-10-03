const { connectMongoDB } = require("./mongoDb");
const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
require("dotenv").config();
connectMongoDB()
  .then(() => {
    console.log("MongoDB ready");
  })
  .catch((error) => {
    console.error(
      "MongoDB startup error:",
      error.message
    );
  });
const mongoose = require("mongoose");
const User = require("./models/User");
const Order = require("./models/Order");
const SiteSettings = require("./models/SiteSettings");
const Note = require("./models/Note");
const Test = require("./models/Test");
const Question = require("./models/Question");
const authRoutes = require("./routes/auth");
const otpAuthRoutes = require("./routes/otpAuth");
const testsRouter = require("./routes/tests");
const leaderboardRouter = require("./routes/leaderboard");
const contactRouter = require("./routes/contact");
const passwordRouter = require("./routes/password");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const adminFreeTestsRoutes = require("./routes/adminFreeTests");
const { createBulkImportHandler } = require("./utils/bulkQuestions");

const app = express();
const statsRoutes = require("./routes/stats");
const currentAffairsRoutes = require("./routes/currentAffairs");
const blogRoutes = require("./routes/blog");
const faqRoutes = require("./routes/faq");
const adminUsersRoutes = require("./routes/adminUsers");
const aboutRoutes = require("./routes/about");
const settingsRoutes = require("./routes/settings");
const adminNotesRoutes = require("./routes/adminNotes");
const adminAuthRoutes = require("./routes/adminAuth");
const subscriptionRoutes = require("./routes/subscription");
const requireAdmin = require("./middleware/requireAdmin");


// ======================================================
// BASIC SETUP
// ======================================================

// Required on Render/Vercel/any proxy so rate limits use the real client IP
app.set("trust proxy", 1);

app.use(cors());
// 2mb: bulk Excel import sends hundreds of bilingual questions in one request
app.use(express.json({ limit: "2mb" }));

// Safety net for every /api/admin/* endpoint. Guessing a token is not
// realistic (it is signed), so this mainly stops abuse/floods.
const adminApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many admin requests. Please slow down.",
  },
});

app.use("/api/admin", adminApiLimiter);
// Admin login + session check (/api/admin/login, /api/admin/session)
app.use("/api/admin", adminAuthRoutes);
app.use("/api/tests", testsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/contact", contactRouter);
app.use("/api/stats", statsRoutes);
app.use("/api/current-affairs", currentAffairsRoutes);
app.use("/api", passwordRouter);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api", otpAuthRoutes);
app.use("/api", authRoutes);


app.use("/api/blog", blogRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/notes",adminNotesRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use( "/api/admin/free-tests", adminFreeTestsRoutes);
// ======================================================
// FILE PATHS
// ======================================================

const pdfFolder = path.join(__dirname, "pdfs");

// ======================================================
// PASSWORD HASHING (shared with routes/password.js)
// ======================================================

const { hashPassword, verifyPassword } = require("./utils/password");

// ======================================================
// RAZORPAY
// ======================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
  res.send(
    "Disha The Academy Backend is Running!"
  );
});

// ======================================================
// TEST
// ======================================================

app.get("/api/test", (req, res) => {

  res.json({
    success: true,
    message: "Frontend and Backend are connected!",
  });

});
// ======================================================
// NOTES API
// Public endpoints return metadata only.
// Full paid Content is never exposed here.
// ======================================================

// ======================================================
// PUBLIC NOTES API - ACTIVE NOTES
// MongoDB
// ======================================================

app.get("/api/notes", async (req, res) => {
  try {
    const notes =
      await Note.find({
        isActive: true,
      })
        .sort({ id: 1 })
        .lean();

    const formattedNotes =
      notes.map((note) => ({
        id:
          note.id,

        title:
          note.title,

        subject:
          note.subcategoryTitle,

        price:
          Number(note.price) || 0,

        pdf:
          note.pdf || null,

        hasContent:
          Boolean(
            String(
              note.content || ""
            ).trim()
          ),

        categorySlug:
          note.categorySlug,

        categoryTitle:
          note.categoryTitle,

        subcategorySlug:
          note.subcategorySlug,

        subcategoryTitle:
          note.subcategoryTitle,

        isActive:
          Boolean(note.isActive),
      }));

    return res.json(
      formattedNotes
    );
  } catch (error) {
    console.error(
      "Public MongoDB notes fetch error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load notes",
    });
  }
});

// ======================================================
// PUBLIC SINGLE NOTE API
// MongoDB
// ======================================================

app.get(
  "/api/notes/:id",
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
        await Note.findOne({
          id:
            noteId,
          isActive:
            true,
        }).lean();

      if (!note) {
        return res.status(404).json({
          success: false,
          message:
            "Note not found",
        });
      }

      return res.json({
        id:
          note.id,

        title:
          note.title,

        subject:
          note.subcategoryTitle,

        price:
          Number(note.price) || 0,

        pdf:
          note.pdf || null,

        hasContent:
          Boolean(
            String(
              note.content || ""
            ).trim()
          ),

        categorySlug:
          note.categorySlug,

        categoryTitle:
          note.categoryTitle,

        subcategorySlug:
          note.subcategorySlug,

        subcategoryTitle:
          note.subcategoryTitle,

        isActive:
          Boolean(note.isActive),
      });
    } catch (error) {
      console.error(
        "Public MongoDB note fetch error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load note",
      });
    }
  }
);

     
// ======================================================
// CREATE RAZORPAY ORDER - JWT + MONGODB
// ======================================================

app.post(
  "/api/payment/create-order",
  async (req, res) => {
    try {
      // =================================================
      // AUTH TOKEN
      // =================================================

      const authHeader =
        req.headers.authorization;

      const token =
        authHeader &&
        authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

      if (!token) {
        return res.status(401).json({
          success: false,
          error:
            "Please log in before purchasing notes",
        });
      }

      // =================================================
      // VERIFY JWT
      // =================================================

      let decoded;

      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );
      } catch (error) {
        return res.status(401).json({
          success: false,
          error:
            "Your session has expired. Please log in again.",
        });
      }

      // MongoDB user ID string hoti hai,
      // ise Number() me convert nahi karna.
      const userId =
        String(
          decoded?.userId || ""
        ).trim();

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid login session",
        });
      }

      // =================================================
      // VERIFY USER EXISTS IN MONGODB
      // =================================================

      const user =
        await User.findById(
          userId
        )
          .select("_id isActive")
          .lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          error:
            "User account not found",
        });
      }

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          error:
            "Your account is currently disabled",
        });
      }

      // =================================================
      // NOTE ID
      // =================================================

      const noteId =
        Number(
          req.body?.noteId
        );

      if (
        !Number.isInteger(noteId) ||
        noteId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid Note ID is required",
        });
      }

      // =================================================
      // LOAD NOTE FROM MONGODB
      // =================================================

      const note =
        await Note.findOne({
          id: noteId,
        }).lean();

      if (!note) {
        return res.status(404).json({
          success: false,
          error:
            "Note not found",
        });
      }

      if (!note.isActive) {
        return res.status(403).json({
          success: false,
          error:
            "This note is currently unavailable.",
        });
      }

      // =================================================
      // CHECK NOTE CONTENT
      // =================================================

      const noteContent =
        String(
          note.content || ""
        ).trim();

      if (!noteContent) {
        return res.status(400).json({
          success: false,
          error:
            "This note is not available for purchase yet",
        });
      }

      // =================================================
      // NOTES SALES SETTING - MONGODB
      // =================================================

      const siteSettings =
        await SiteSettings.findOne({
          key: "main",
        }).lean();

      const notesSalesEnabled =
        siteSettings
          ? siteSettings.notesSalesEnabled !==
            false
          : true;

      if (!notesSalesEnabled) {
        return res.status(403).json({
          success: false,
          error:
            "Notes purchasing is temporarily unavailable. Please try again later.",
          code:
            "NOTES_SALES_DISABLED",
        });
      }

      // =================================================
      // PRICE
      // =================================================

      const amount =
        Number(
          note.price
        );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid note price",
        });
      }

      // =================================================
      // CREATE RAZORPAY ORDER
      // =================================================

      const razorpayOrder =
        await razorpay.orders.create({
          amount:
            Math.round(
              amount * 100
            ),

          currency:
            "INR",

          receipt:
            `receipt_${Date.now()}`,
        });

      // =================================================
      // SAVE ORDER TO MONGODB
      // =================================================

      await Order.create({
        orderId:
          razorpayOrder.id,

        userId:
          user._id,

        noteId:
          note.id,

        title:
          note.title,

        price:
          amount,

        pdf:
          note.pdf || null,

        paid:
          false,

        paymentId:
          "",

        verifiedAt:
          null,
      });

      // =================================================
      // LOG
      // =================================================

      console.log("");
      console.log(
        "================================="
      );

      console.log(
        "SECURE RAZORPAY ORDER CREATED"
      );

      console.log(
        "Order ID:",
        razorpayOrder.id
      );

      console.log(
        "MongoDB User ID:",
        user._id.toString()
      );

      console.log(
        "Note ID:",
        note.id
      );

      console.log(
        "Note:",
        note.title
      );

      console.log(
        "Amount:",
        amount
      );

      console.log(
        "ORDER SAVED TO MONGODB"
      );

      console.log(
        "================================="
      );

      console.log("");

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success: true,

        keyId:
          process.env
            .RAZORPAY_KEY_ID,

        ...razorpayOrder,
      });
    } catch (error) {
      console.error(
        "MongoDB Razorpay order error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to create payment order",
      });
    }
  }
);
// ======================================================
// VERIFY RAZORPAY PAYMENT - MONGODB
// ======================================================

app.post(
  "/api/payment/verify",
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      // =================================================
      // CHECK PAYMENT DATA
      // =================================================

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Payment details are missing",
        });
      }

      // =================================================
      // FIND ORDER IN MONGODB
      // =================================================

      const order =
        await Order.findOne({
          orderId:
            razorpay_order_id,
        });

      if (!order) {
        console.error(
          "ORDER NOT FOUND:",
          razorpay_order_id
        );

        return res.status(404).json({
          success: false,
          error:
            "Order not found",
        });
      }

      // =================================================
      // CREATE EXPECTED RAZORPAY SIGNATURE
      // =================================================

      const body =
        `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_KEY_SECRET
          )
          .update(body)
          .digest("hex");

      // =================================================
      // SAFE SIGNATURE COMPARISON
      // =================================================

      let isValid = false;

      try {
        const expectedBuffer =
          Buffer.from(
            expectedSignature,
            "hex"
          );

        const receivedBuffer =
          Buffer.from(
            razorpay_signature,
            "hex"
          );

        if (
          expectedBuffer.length ===
          receivedBuffer.length
        ) {
          isValid =
            crypto.timingSafeEqual(
              expectedBuffer,
              receivedBuffer
            );
        }
      } catch (error) {
        isValid = false;
      }

      // =================================================
      // INVALID SIGNATURE
      // =================================================

      if (!isValid) {
        console.error(
          "INVALID PAYMENT SIGNATURE"
        );

        return res.status(400).json({
          success: false,
          error:
            "Invalid payment signature",
        });
      }

      // =================================================
      // UPDATE ORDER IN MONGODB
      // =================================================

      order.paid = true;

      order.paymentId =
        razorpay_payment_id;

      order.verifiedAt =
        new Date();

      await order.save();

      // =================================================
      // LOG
      // =================================================

      console.log("");
      console.log(
        "================================="
      );

      console.log(
        "PAYMENT VERIFIED SUCCESSFULLY"
      );

      console.log(
        "Order ID:",
        razorpay_order_id
      );

      console.log(
        "Payment ID:",
        razorpay_payment_id
      );

      console.log(
        "User ID:",
        order.userId.toString()
      );

      console.log(
        "Note ID:",
        order.noteId
      );

      console.log(
        "ORDER UPDATED IN MONGODB"
      );

      console.log(
        "================================="
      );

      console.log("");

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success: true,

        message:
          "Payment verified successfully",

        orderId:
          razorpay_order_id,

        userId:
          order.userId.toString(),

        noteId:
          order.noteId,

        readUrl:
          `/read-note/${order.noteId}?orderId=${encodeURIComponent(
            razorpay_order_id
          )}`,

        downloadUrl:
          `/api/pdf/download/${encodeURIComponent(
            razorpay_order_id
          )}`,
      });
    } catch (error) {
      console.error(
        "MongoDB payment verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Payment verification failed",
      });
    }
  }
);
// ======================================================
// MY PURCHASED NOTES - MONGODB
// Logged-in user ke sirf paid notes
// ======================================================

app.get(
  "/api/my-notes",
  async (req, res) => {
    try {
      // =================================================
      // AUTH TOKEN
      // =================================================

      const authHeader =
        req.headers.authorization;

      const token =
        authHeader &&
        authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

      if (!token) {
        return res.status(401).json({
          success: false,
          error:
            "Please log in to view your notes",
        });
      }

      // =================================================
      // VERIFY JWT
      // =================================================

      let decoded;

      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );
      } catch (error) {
        return res.status(401).json({
          success: false,
          error:
            "Your session has expired. Please log in again.",
        });
      }

      const userId =
        String(
          decoded?.userId || ""
        ).trim();

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid login session",
        });
      }

      // =================================================
      // VERIFY USER EXISTS
      // =================================================

      const user =
        await User.findById(
          userId
        )
          .select("_id isActive")
          .lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          error:
            "User account not found",
        });
      }

      // =================================================
      // LOAD PAID ORDERS FROM MONGODB
      // =================================================

      const orders =
        await Order.find({
          userId:
            user._id,
          paid:
            true,
        })
          .sort({
            verifiedAt: -1,
            createdAt: -1,
          })
          .lean();

      // =================================================
      // GET NOTE IDS
      // =================================================

      const noteIds =
        [
          ...new Set(
            orders.map(
              (order) =>
                Number(
                  order.noteId
                )
            )
          ),
        ].filter(
          (noteId) =>
            Number.isInteger(
              noteId
            ) &&
            noteId > 0
        );

      // =================================================
      // LOAD NOTES FROM MONGODB
      // =================================================

      const noteDocuments =
        noteIds.length > 0
          ? await Note.find({
              id: {
                $in:
                  noteIds,
              },
            }).lean()
          : [];

      const notesById =
        new Map(
          noteDocuments.map(
            (note) => [
              Number(
                note.id
              ),
              note,
            ]
          )
        );

      // =================================================
      // FORMAT RESPONSE
      // =================================================

      const notes =
        orders.map(
          (order) => {
            const note =
              notesById.get(
                Number(
                  order.noteId
                )
              );

            const hasContent =
              Boolean(
                String(
                  note?.content || ""
                ).trim()
              );

            return {
              orderId:
                order.orderId,

              noteId:
                order.noteId,

              title:
                order.title,

              price:
                Number(
                  order.price
                ) || 0,

              categoryTitle:
                note?.categoryTitle ||
                "",

              subcategoryTitle:
                note?.subcategoryTitle ||
                "",

              hasContent,

              paymentId:
                order.paymentId ||
                "",

              purchasedAt:
                order.verifiedAt ||
                order.createdAt,

              readUrl:
                `/read-note/${order.noteId}?orderId=${encodeURIComponent(
                  order.orderId
                )}`,
            };
          }
        );

      return res.json({
        success: true,
        count:
          notes.length,
        notes,
      });
    } catch (error) {
      console.error(
        "MongoDB purchased notes error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to load purchased notes",
      });
    }
  }
);
// ======================================================
// PAID NOTE CONTENT - MONGODB
// Only the user who purchased the note can read it
// ======================================================

app.get(
  "/api/orders/:orderId/note-content",
  async (req, res) => {
    try {
      const orderId =
        String(
          req.params.orderId || ""
        ).trim();

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error:
            "Order ID is required",
        });
      }

      // =================================================
      // AUTH TOKEN
      // =================================================

      const authHeader =
        req.headers.authorization;

      const token =
        authHeader &&
        authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

      if (!token) {
        return res.status(401).json({
          success: false,
          error:
            "Please log in to read this note",
        });
      }

      // =================================================
      // VERIFY JWT
      // =================================================

      let decoded;

      try {
        decoded =
          jwt.verify(
            token,
            process.env.JWT_SECRET
          );
      } catch (error) {
        return res.status(401).json({
          success: false,
          error:
            "Your session has expired. Please log in again.",
        });
      }

      const userId =
        String(
          decoded?.userId || ""
        ).trim();

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid login session",
        });
      }

      // =================================================
      // FIND ORDER IN MONGODB
      // =================================================

      const order =
        await Order.findOne({
          orderId:
            orderId,
        }).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          error:
            "Order not found",
        });
      }

      // =================================================
      // ORDER OWNER CHECK
      // =================================================

      if (
        String(order.userId) !==
        userId
      ) {
        return res.status(403).json({
          success: false,
          error:
            "You are not authorized to read this note",
        });
      }

      // =================================================
      // PAYMENT CHECK
      // =================================================

      if (!order.paid) {
        return res.status(403).json({
          success: false,
          error:
            "Payment is required before reading this note",
        });
      }

      // =================================================
      // LOAD NOTE FROM MONGODB
      // =================================================

      const note =
        await Note.findOne({
          id:
            Number(
              order.noteId
            ),
        }).lean();

      if (!note) {
        return res.status(404).json({
          success: false,
          error:
            "Note not found",
        });
      }

      // =================================================
      // CONTENT CHECK
      // =================================================

      const content =
        String(
          note.content || ""
        ).trim();

      if (!content) {
        return res.status(404).json({
          success: false,
          error:
            "Note content is not available",
        });
      }

      // =================================================
      // SUCCESS
      // =================================================

      return res.json({
        success: true,

        note: {
          id:
            note.id,

          title:
            note.title,

          categoryTitle:
            note.categoryTitle,

          subcategoryTitle:
            note.subcategoryTitle,

          content,
        },

        order: {
          orderId:
            order.orderId,

          paymentId:
            order.paymentId || "",

          verifiedAt:
            order.verifiedAt,
        },
      });
    } catch (error) {
      console.error(
        "MongoDB paid note content error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to load note content",
      });
    }
  }
);

// ======================================================
// DOWNLOAD PDF - MONGODB
// ======================================================

app.get(
  "/api/pdf/download/:orderId",
  async (req, res) => {
    try {
      const orderId =
        String(
          req.params.orderId || ""
        ).trim();

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error:
            "Order ID is required",
        });
      }

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "PDF DOWNLOAD REQUEST"
      );
      console.log(
        "Order ID:",
        orderId
      );

      // =================================================
      // FIND ORDER IN MONGODB
      // =================================================

      const order =
        await Order.findOne({
          orderId:
            orderId,
        }).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          error:
            "Order not found",
        });
      }

      // =================================================
      // AUTH TOKEN
      // Header token preferred.
      // Query token kept for current frontend compatibility.
      // =================================================

      const authHeader =
        req.headers.authorization;

      const headerToken =
        authHeader &&
        authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

      const token =
        headerToken ||
        req.query.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          error:
            "Please log in to download this file",
        });
      }

      // =================================================
      // VERIFY JWT
      // =================================================

      let decoded;

      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );
      } catch (error) {
        return res.status(401).json({
          success: false,
          error:
            "Your session has expired. Please log in again",
        });
      }

      const userId =
        String(
          decoded?.userId || ""
        ).trim();

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid login session",
        });
      }

      // =================================================
      // ORDER OWNER CHECK
      // =================================================

      if (
        !order.userId ||
        String(order.userId) !==
          userId
      ) {
        return res.status(403).json({
          success: false,
          error:
            "You are not authorized to download this file",
        });
      }

      // =================================================
      // PAYMENT CHECK
      // =================================================

      if (!order.paid) {
        return res.status(403).json({
          success: false,
          error:
            "Payment required before downloading PDF",
        });
      }

      // =================================================
      // PDF FILE CHECK
      // =================================================

      const pdfFileName =
        String(
          order.pdf || ""
        ).trim();

      if (!pdfFileName) {
        return res.status(404).json({
          success: false,
          error:
            "PDF file is not available for this note",
        });
      }

      // Only file name use karenge
      // path traversal se protection
      const safePdfFileName =
        path.basename(
          pdfFileName
        );

      const pdfPath =
        path.join(
          pdfFolder,
          safePdfFileName
        );

      console.log(
        "MongoDB User ID:",
        String(order.userId)
      );

      console.log(
        "Paid:",
        order.paid
      );

      console.log(
        "PDF:",
        safePdfFileName
      );

      console.log(
        "PDF Path:",
        pdfPath
      );

      // =================================================
      // CHECK FILE EXISTS
      // =================================================

      if (
        !fs.existsSync(
          pdfPath
        )
      ) {
        console.error(
          "PDF FILE NOT FOUND:",
          pdfPath
        );

        return res.status(404).json({
          success: false,
          error:
            "PDF file not found on server",
        });
      }

      // =================================================
      // DOWNLOAD
      // =================================================

      console.log(
        "PDF DOWNLOAD STARTED"
      );

      console.log(
        "================================="
      );

      return res.download(
        pdfPath,
        safePdfFileName,
        (error) => {
          if (error) {
            console.error(
              "PDF download error:",
              error
            );
          }
        }
      );
    } catch (error) {
      console.error(
        "MongoDB PDF download error:",
        error
      );

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error:
            "Unable to download PDF",
        });
      }
    }
  }
);
// ======================================================
// CHECK ORDER STATUS - MONGODB
// ======================================================

app.get(
  "/api/payment/order/:orderId",
  async (req, res) => {
    try {
      const orderId =
        String(
          req.params.orderId || ""
        ).trim();

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error:
            "Order ID is required",
        });
      }

      // =================================================
      // FIND ORDER IN MONGODB
      // =================================================

      const order =
        await Order.findOne({
          orderId:
            orderId,
        }).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          error:
            "Order not found",
        });
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success: true,

        order: {
          id:
            order._id.toString(),

          orderId:
            order.orderId,

          userId:
            order.userId
              ? String(order.userId)
              : "",

          noteId:
            order.noteId,

          title:
            order.title,

          price:
            Number(
              order.price
            ) || 0,

          paid:
            Boolean(
              order.paid
            ),

          paymentId:
            order.paymentId || "",

          createdAt:
            order.createdAt,

          verifiedAt:
            order.verifiedAt || null,
        },
      });
    } catch (error) {
      console.error(
        "MongoDB order status error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to check order status",
      });
    }
  }
);
// ======================================================
// ADMIN DASHBOARD API - MONGODB
// ======================================================

app.get(
  "/api/admin/dashboard",
  requireAdmin,
  async (req, res) => {
    try {
      // =================================================
      // ADMIN SECURITY
      // =================================================


      // =================================================
      // TOTAL USERS - MONGODB
      // =================================================

      const totalUsers =
        await User.countDocuments();

      // =================================================
      // TOTAL NOTES - MONGODB
      // =================================================

      const totalNotes =
        await Note.countDocuments();

      // =================================================
      // ORDER / REVENUE STATS - MONGODB
      // =================================================

      const orderStats =
        await Order.aggregate([
          {
            $group: {
              _id: null,

              paidOrders: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$paid",
                        true,
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              totalRevenue: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$paid",
                        true,
                      ],
                    },
                    "$price",
                    0,
                  ],
                },
              },
            },
          },
        ]);

      const paidOrders =
        Number(
          orderStats[0]
            ?.paidOrders
        ) || 0;

      const totalRevenue =
        Number(
          orderStats[0]
            ?.totalRevenue
        ) || 0;

      // =================================================
      // RECENT PAID ORDERS - MONGODB
      // =================================================

      const recentOrderDocs =
        await Order.find({
          paid: true,
        })
          .sort({
            verifiedAt: -1,
            createdAt: -1,
          })
          .limit(5)
          .populate(
            "userId",
            "fullName email"
          )
          .lean();

      const recentOrders =
        recentOrderDocs.map(
          (order) => {
            const user =
              order.userId &&
              typeof order.userId ===
                "object"
                ? order.userId
                : null;

            return {
              id:
                order._id.toString(),

              orderId:
                order.orderId,

              userId:
                user?._id
                  ? user._id.toString()
                  : order.userId
                    ? String(
                        order.userId
                      )
                    : "",

              userName:
                user?.fullName ||
                "Unknown User",

              userEmail:
                user?.email ||
                "",

              noteId:
                order.noteId,

              title:
                order.title,

              price:
                Number(
                  order.price
                ) || 0,

              paid:
                Boolean(
                  order.paid
                ),

              paymentId:
                order.paymentId ||
                "",

              createdAt:
                order.createdAt,

              verifiedAt:
                order.verifiedAt ||
                null,
            };
          }
        );

      // =================================================
// TEST COUNT - MONGODB
// =================================================

const totalTests =
  await Test.countDocuments({
    isActive: true,
  });

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success: true,

        stats: {
          totalUsers,
          totalNotes,
          totalTests,
          paidOrders,
          totalRevenue,
        },

        recentOrders,
      });
    } catch (error) {
      console.error(
        "MongoDB admin dashboard error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load admin dashboard",
      });
    }
  }
);

// ======================================================
// ADMIN ORDER SUMMARY - MONGODB
// ======================================================

app.get(
  "/api/admin/orders-summary",
  requireAdmin,
  async (req, res) => {
    try {

      const totalOrders =
        await Order.countDocuments();

      const paidOrders =
        await Order.countDocuments({
          paid: true,
        });

      const pendingOrders =
        await Order.countDocuments({
          paid: false,
        });

      const revenueResult =
        await Order.aggregate([
          {
            $match: {
              paid: true,
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: "$price",
              },
            },
          },
        ]);

      const totalRevenue =
        Number(
          revenueResult[0]
            ?.totalRevenue
        ) || 0;

      return res.json({
        success: true,

        summary: {
          totalOrders,
          paidOrders,
          pendingOrders,
          totalRevenue,
        },
      });
    } catch (error) {
      console.error(
        "MongoDB admin order summary error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load order summary",
      });
    }
  }
);

// ======================================================
// ADMIN ORDERS LIST - MONGODB
// ======================================================

app.get(
  "/api/admin/orders",
  requireAdmin,
  async (req, res) => {
    try {
      // =================================================
      // ADMIN SECURITY
      // =================================================


      // =================================================
      // FILTERS
      // =================================================

      const status =
        String(
          req.query.status || "all"
        )
          .trim()
          .toLowerCase();

      const search =
        String(
          req.query.search || ""
        ).trim();

      const orderQuery = {};

      if (status === "paid") {
        orderQuery.paid = true;
      } else if (
        status === "unpaid"
      ) {
        orderQuery.paid = false;
      }

      // =================================================
      // SEARCH
      // =================================================

      if (search) {
        const escapedSearch =
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        const searchRegex =
          new RegExp(
            escapedSearch,
            "i"
          );

        // User name/email matching IDs
        const matchingUsers =
          await User.find({
            $or: [
              {
                fullName:
                  searchRegex,
              },
              {
                email:
                  searchRegex,
              },
            ],
          })
            .select("_id")
            .lean();

        const userIds =
          matchingUsers.map(
            (user) =>
              user._id
          );

        orderQuery.$or = [
          {
            title:
              searchRegex,
          },
          {
            orderId:
              searchRegex,
          },
          {
            paymentId:
              searchRegex,
          },
        ];

        if (userIds.length > 0) {
          orderQuery.$or.push({
            userId: {
              $in:
                userIds,
            },
          });
        }
      }

      // =================================================
      // LOAD ORDERS
      // =================================================

      const orderDocs =
        await Order.find(
          orderQuery
        )
          .sort({
            verifiedAt: -1,
            createdAt: -1,
          })
          .populate(
            "userId",
            "fullName email"
          )
          .lean();

      // =================================================
      // FORMAT RESPONSE
      // =================================================

      const orders =
        orderDocs.map(
          (order) => {
            const user =
              order.userId &&
              typeof order.userId ===
                "object"
                ? order.userId
                : null;

            return {
              id:
                order._id.toString(),

              orderId:
                order.orderId,

              userId:
                user?._id
                  ? user._id.toString()
                  : order.userId
                    ? String(
                        order.userId
                      )
                    : "",

              userName:
                user?.fullName ||
                "Unknown User",

              userEmail:
                user?.email ||
                "",

              noteId:
                order.noteId,

              title:
                order.title,

              price:
                Number(
                  order.price
                ) || 0,

              paid:
                Boolean(
                  order.paid
                ),

              paymentId:
                order.paymentId ||
                "",

              createdAt:
                order.createdAt,

              verifiedAt:
                order.verifiedAt ||
                null,
            };
          }
        );

      return res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error(
        "MongoDB admin orders error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load orders",
      });
    }
  }
);

// =====================================================
// ADMIN TESTS - GET ALL TESTS - MONGODB
// =====================================================

app.get(
  "/api/admin/tests",
  requireAdmin,
  async (req, res) => {
    try {

      // MongoDB se saare tests
      const testDocuments =
        await Test.find({})
          .sort({
            category: 1,
            title: 1,
          })
          .lean();

      // Har test ke questions count
      const questionCounts =
        await Question.aggregate([
          {
            $group: {
              _id: "$testId",
              totalQuestions: {
                $sum: 1,
              },
            },
          },
        ]);

      const questionCountMap =
        new Map(
          questionCounts.map(
            (item) => [
              String(item._id),
              Number(
                item.totalQuestions
              ) || 0,
            ]
          )
        );

      const tests =
        testDocuments.map(
          (test) => ({
            testId:
              test.testId,

            category:
              test.category,

            title:
              test.title,

            subject:
              test.subject,

            duration:
              Number(
                test.duration
              ) || 0,

            marksPerCorrect:
              Number(
                test.marksPerCorrect
              ) || 0,

            negativeMarking:
              Number(
                test.negativeMarking
              ) || 0,

            topCategory:
              test.topCategory,

            subExam:
              test.subExam,

            totalQuestions:
              questionCountMap.get(
                String(test.testId)
              ) || 0,
          })
        );

      return res.json({
        success: true,
        count: tests.length,
        tests,
      });
    } catch (error) {
      console.error(
        "MongoDB admin tests error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load tests",
      });
    }
  }
);
// =====================================================
// ADMIN - CREATE NEW MOCK TEST - MONGODB
// =====================================================

app.post(
  "/api/admin/tests",
  requireAdmin,
  async (req, res) => {
    try {
      // ===============================================
      // ADMIN SECURITY
      // ===============================================


      // ===============================================
      // FORM DATA
      // ===============================================

      const {
        testId,
        category,
        title,
        subject,
        duration,
        marksPerCorrect,
        negativeMarking,
        topCategory,
        subExam,
      } = req.body;

      const cleanTestId =
        String(testId || "")
          .trim()
          .toLowerCase();

      const cleanCategory =
        String(category || "").trim();

      const cleanTitle =
        String(title || "").trim();

      const cleanSubject =
        String(subject || "").trim();

      const cleanTopCategory =
        String(topCategory || "").trim();

      const cleanSubExam =
        String(subExam || "").trim();

      // ===============================================
      // REQUIRED FIELDS
      // ===============================================

      if (
        !cleanTestId ||
        !cleanCategory ||
        !cleanTitle ||
        !cleanSubject ||
        !cleanTopCategory ||
        !cleanSubExam
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please fill all required fields.",
        });
      }

      // ===============================================
      // TEST ID VALIDATION
      // ===============================================

      if (
        !/^[a-z0-9-]+$/.test(
          cleanTestId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Test ID can contain only lowercase letters, numbers and hyphens.",
        });
      }

      // ===============================================
      // NUMBER VALIDATION
      // ===============================================

      const durationNumber =
        Number(duration);

      const marksNumber =
        Number(marksPerCorrect);

      const negativeNumber =
        Number(negativeMarking);

      if (
        !Number.isFinite(
          durationNumber
        ) ||
        durationNumber <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duration must be greater than 0.",
        });
      }

      if (
        !Number.isFinite(
          marksNumber
        ) ||
        marksNumber <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Marks per correct answer must be greater than 0.",
        });
      }

      if (
        !Number.isFinite(
          negativeNumber
        ) ||
        negativeNumber < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Negative marking cannot be less than 0.",
        });
      }

      // ===============================================
      // DUPLICATE TEST ID CHECK
      // ===============================================

      const existingTest =
        await Test.findOne({
          testId:
            cleanTestId,
        })
          .select("_id")
          .lean();

      if (existingTest) {
        return res.status(409).json({
          success: false,
          message:
            "A test with this Test ID already exists.",
        });
      }

      // ===============================================
      // CREATE TEST IN MONGODB
      // ===============================================

      const newTest =
        await Test.create({
          testId:
            cleanTestId,

          category:
            cleanCategory,

          title:
            cleanTitle,

          subject:
            cleanSubject,

          duration:
            Math.round(
              durationNumber
            ),

          marksPerCorrect:
            marksNumber,

          negativeMarking:
            negativeNumber,

          topCategory:
            cleanTopCategory,

          subExam:
            cleanSubExam,

          isActive:
            true,
        });

      // ===============================================
      // RESPONSE
      // ===============================================

      return res.status(201).json({
        success: true,
        message:
          "Test created successfully.",

        test: {
          testId:
            newTest.testId,

          category:
            newTest.category,

          title:
            newTest.title,

          subject:
            newTest.subject,

          duration:
            Number(
              newTest.duration
            ) || 0,

          marksPerCorrect:
            Number(
              newTest.marksPerCorrect
            ) || 0,

          negativeMarking:
            Number(
              newTest.negativeMarking
            ) || 0,

          topCategory:
            newTest.topCategory,

          subExam:
            newTest.subExam,

          totalQuestions: 0,
        },
      });
    } catch (error) {
      console.error(
        "MongoDB admin create test error:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A test with this Test ID already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to create test.",
      });
    }
  }
);

// =====================================================
// ADMIN - UPDATE MOCK TEST - MONGODB
// =====================================================

app.put(
  "/api/admin/tests/:testId",
  requireAdmin,
  async (req, res) => {
    try {
      // ===============================================
      // ADMIN SECURITY
      // ===============================================


      // ===============================================
      // TEST ID
      // ===============================================

      const currentTestId =
        String(
          req.params.testId || ""
        )
          .trim()
          .toLowerCase();

      const {
        category,
        title,
        subject,
        duration,
        marksPerCorrect,
        negativeMarking,
        topCategory,
        subExam,
      } = req.body;

      const cleanCategory =
        String(category || "").trim();

      const cleanTitle =
        String(title || "").trim();

      const cleanSubject =
        String(subject || "").trim();

      const cleanTopCategory =
        String(topCategory || "").trim();

      const cleanSubExam =
        String(subExam || "").trim();

      // ===============================================
      // REQUIRED FIELDS
      // ===============================================

      if (
        !currentTestId ||
        !cleanCategory ||
        !cleanTitle ||
        !cleanSubject ||
        !cleanTopCategory ||
        !cleanSubExam
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please fill all required fields.",
        });
      }

      // ===============================================
      // NUMBER VALIDATION
      // ===============================================

      const durationNumber =
        Number(duration);

      const marksNumber =
        Number(marksPerCorrect);

      const negativeNumber =
        Number(negativeMarking);

      if (
        !Number.isFinite(
          durationNumber
        ) ||
        durationNumber <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duration must be greater than 0.",
        });
      }

      if (
        !Number.isFinite(
          marksNumber
        ) ||
        marksNumber <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Marks per correct answer must be greater than 0.",
        });
      }

      if (
        !Number.isFinite(
          negativeNumber
        ) ||
        negativeNumber < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Negative marking cannot be less than 0.",
        });
      }

      // ===============================================
      // FIND TEST
      // ===============================================

      const test =
        await Test.findOne({
          testId:
            currentTestId,
        });

      if (!test) {
        return res.status(404).json({
          success: false,
          message:
            "Test not found.",
        });
      }

      // ===============================================
      // UPDATE TEST
      // Test ID intentionally unchanged
      // ===============================================

      test.category =
        cleanCategory;

      test.title =
        cleanTitle;

      test.subject =
        cleanSubject;

      test.duration =
        Math.round(
          durationNumber
        );

      test.marksPerCorrect =
        marksNumber;

      test.negativeMarking =
        negativeNumber;

      test.topCategory =
        cleanTopCategory;

      test.subExam =
        cleanSubExam;

      await test.save();

      // ===============================================
      // RESPONSE
      // ===============================================

      return res.json({
        success: true,

        message:
          "Test updated successfully.",

        test: {
          testId:
            test.testId,

          category:
            test.category,

          title:
            test.title,

          subject:
            test.subject,

          duration:
            Number(
              test.duration
            ) || 0,

          marksPerCorrect:
            Number(
              test.marksPerCorrect
            ) || 0,

          negativeMarking:
            Number(
              test.negativeMarking
            ) || 0,

          topCategory:
            test.topCategory,

          subExam:
            test.subExam,
        },
      });
    } catch (error) {
      console.error(
        "MongoDB admin update test error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update test.",
      });
    }
  }
);
// =====================================================
// ADMIN - GET QUESTIONS OF A TEST - MONGODB
// =====================================================

app.get(
  "/api/admin/tests/:testId/questions",
  requireAdmin,
  async (req, res) => {
    try {

      const testId =
        String(
          req.params.testId || ""
        )
          .trim()
          .toLowerCase();

      if (!testId) {
        return res.status(400).json({
          success: false,
          message:
            "Test ID is required.",
        });
      }

      // ===============================================
      // FIND TEST
      // ===============================================

      const test =
        await Test.findOne({
          testId,
        }).lean();

      if (!test) {
        return res.status(404).json({
          success: false,
          message:
            "Test not found.",
        });
      }

      // ===============================================
      // LOAD QUESTIONS
      // ===============================================

      const questionDocuments =
        await Question.find({
          testId,
        })
          .sort({
            questionId: 1,
          })
          .lean();

      // ===============================================
      // FORMAT QUESTIONS
      // ===============================================

      const questions =
        questionDocuments.map(
          (question) => ({
            questionId:
              question.questionId,

            testId:
              question.testId,

            questionText:
              question.questionText,

            optionA:
              question.optionA,

            optionB:
              question.optionB,

            optionC:
              question.optionC,

            optionD:
              question.optionD,

            correctAnswer:
              Number(
                question.correctAnswer
              ),

            questionTextHi:
              question.questionTextHi ||
              "",

            optionAHi:
              question.optionAHi ||
              "",

            optionBHi:
              question.optionBHi ||
              "",

            optionCHi:
              question.optionCHi ||
              "",

            optionDHi:
              question.optionDHi ||
              "",
          })
        );

      // ===============================================
      // RESPONSE
      // ===============================================

      return res.json({
        success: true,

        test: {
          testId:
            test.testId,

          category:
            test.category,

          title:
            test.title,

          subject:
            test.subject,

          duration:
            Number(
              test.duration
            ) || 0,

          marksPerCorrect:
            Number(
              test.marksPerCorrect
            ) || 0,

          negativeMarking:
            Number(
              test.negativeMarking
            ) || 0,

          topCategory:
            test.topCategory,

          subExam:
            test.subExam,
        },

        count:
          questions.length,

        questions,
      });
    } catch (error) {
      console.error(
        "MongoDB admin get questions error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load questions.",
      });
    }
  }
);

// =====================================================
// ADMIN - BULK IMPORT QUESTIONS (EXCEL) - MONGODB
// =====================================================
app.post(
  "/api/admin/tests/:testId/questions/bulk",
  requireAdmin,
  createBulkImportHandler({ mode: "test" })
);

// =====================================================
// ADMIN - ADD QUESTION TO TEST - MONGODB
// =====================================================

app.post(
  "/api/admin/tests/:testId/questions",
  requireAdmin,
  async (req, res) => {
    try {
      // ===============================================
      // ADMIN SECURITY
      // ===============================================


      // ===============================================
      // TEST ID
      // ===============================================

      const testId =
        String(
          req.params.testId || ""
        )
          .trim()
          .toLowerCase();

      const {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        questionTextHi,
        optionAHi,
        optionBHi,
        optionCHi,
        optionDHi,
      } = req.body;

      // ===============================================
      // CLEAN VALUES
      // ===============================================

      const cleanQuestionText =
        String(
          questionText || ""
        ).trim();

      const cleanOptionA =
        String(
          optionA || ""
        ).trim();

      const cleanOptionB =
        String(
          optionB || ""
        ).trim();

      const cleanOptionC =
        String(
          optionC || ""
        ).trim();

      const cleanOptionD =
        String(
          optionD || ""
        ).trim();

      const correctAnswerNumber =
        Number(
          correctAnswer
        );

      const cleanQuestionTextHi =
        String(
          questionTextHi || ""
        ).trim();

      const cleanOptionAHi =
        String(
          optionAHi || ""
        ).trim();

      const cleanOptionBHi =
        String(
          optionBHi || ""
        ).trim();

      const cleanOptionCHi =
        String(
          optionCHi || ""
        ).trim();

      const cleanOptionDHi =
        String(
          optionDHi || ""
        ).trim();

      // ===============================================
      // VALIDATION
      // ===============================================

      if (!testId) {
        return res.status(400).json({
          success: false,
          message:
            "Test ID is required.",
        });
      }

      if (
        !cleanQuestionText ||
        !cleanOptionA ||
        !cleanOptionB ||
        !cleanOptionC ||
        !cleanOptionD
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Question and all four options are required.",
        });
      }

      if (
        !Number.isInteger(
          correctAnswerNumber
        ) ||
        correctAnswerNumber < 1 ||
        correctAnswerNumber > 4
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Correct answer must be between 1 and 4.",
        });
      }

      // ===============================================
      // CHECK TEST EXISTS
      // ===============================================

      const test =
        await Test.findOne({
          testId,
        })
          .select("_id testId")
          .lean();

      if (!test) {
        return res.status(404).json({
          success: false,
          message:
            "Test not found.",
        });
      }

      // ===============================================
      // GENERATE NEXT QUESTION ID
      // ===============================================

      const lastQuestion =
        await Question.findOne({})
          .sort({
            questionId: -1,
          })
          .select("questionId")
          .lean();

      const newQuestionId =
        Number(
          lastQuestion?.questionId
        ) + 1 || 1;

      // ===============================================
      // CREATE QUESTION
      // ===============================================

      const newQuestion =
        await Question.create({
          questionId:
            newQuestionId,

          testId,

          questionText:
            cleanQuestionText,

          optionA:
            cleanOptionA,

          optionB:
            cleanOptionB,

          optionC:
            cleanOptionC,

          optionD:
            cleanOptionD,

          correctAnswer:
            correctAnswerNumber,

          questionTextHi:
            cleanQuestionTextHi,

          optionAHi:
            cleanOptionAHi,

          optionBHi:
            cleanOptionBHi,

          optionCHi:
            cleanOptionCHi,

          optionDHi:
            cleanOptionDHi,
        });

      // ===============================================
      // RESPONSE
      // ===============================================

      return res.status(201).json({
        success: true,
        message:
          "Question added successfully.",

        question: {
          questionId:
            newQuestion.questionId,

          testId:
            newQuestion.testId,

          questionText:
            newQuestion.questionText,

          optionA:
            newQuestion.optionA,

          optionB:
            newQuestion.optionB,

          optionC:
            newQuestion.optionC,

          optionD:
            newQuestion.optionD,

          correctAnswer:
            Number(
              newQuestion.correctAnswer
            ),

          questionTextHi:
            newQuestion.questionTextHi ||
            "",

          optionAHi:
            newQuestion.optionAHi ||
            "",

          optionBHi:
            newQuestion.optionBHi ||
            "",

          optionCHi:
            newQuestion.optionCHi ||
            "",

          optionDHi:
            newQuestion.optionDHi ||
            "",
        },
      });
    } catch (error) {
      console.error(
        "MongoDB admin add question error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to add question.",
      });
    }
  }
);

// =====================================================
// ADMIN - UPDATE QUESTION - MONGODB
// =====================================================

app.put(
  "/api/admin/tests/:testId/questions/:questionId",
  requireAdmin,
  async (req, res) => {
    try {
      // ===============================================
      // ADMIN SECURITY
      // ===============================================


      // ===============================================
      // PARAMS
      // ===============================================

      const testId =
        String(
          req.params.testId || ""
        )
          .trim()
          .toLowerCase();

      const questionId =
        Number(
          req.params.questionId
        );

      const {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        questionTextHi,
        optionAHi,
        optionBHi,
        optionCHi,
        optionDHi,
      } = req.body;

      // ===============================================
      // CLEAN VALUES
      // ===============================================

      const cleanQuestionText =
        String(
          questionText || ""
        ).trim();

      const cleanOptionA =
        String(
          optionA || ""
        ).trim();

      const cleanOptionB =
        String(
          optionB || ""
        ).trim();

      const cleanOptionC =
        String(
          optionC || ""
        ).trim();

      const cleanOptionD =
        String(
          optionD || ""
        ).trim();

      const correctAnswerNumber =
        Number(
          correctAnswer
        );

      const cleanQuestionTextHi =
        String(
          questionTextHi || ""
        ).trim();

      const cleanOptionAHi =
        String(
          optionAHi || ""
        ).trim();

      const cleanOptionBHi =
        String(
          optionBHi || ""
        ).trim();

      const cleanOptionCHi =
        String(
          optionCHi || ""
        ).trim();

      const cleanOptionDHi =
        String(
          optionDHi || ""
        ).trim();

      // ===============================================
      // VALIDATION
      // ===============================================

      if (!testId) {
        return res.status(400).json({
          success: false,
          message:
            "Test ID is required.",
        });
      }

      if (
        !Number.isInteger(
          questionId
        ) ||
        questionId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Question ID.",
        });
      }

      if (
        !cleanQuestionText ||
        !cleanOptionA ||
        !cleanOptionB ||
        !cleanOptionC ||
        !cleanOptionD
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Question and all four options are required.",
        });
      }

      if (
        !Number.isInteger(
          correctAnswerNumber
        ) ||
        correctAnswerNumber < 1 ||
        correctAnswerNumber > 4
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Correct answer must be between 1 and 4.",
        });
      }

      // ===============================================
      // FIND QUESTION
      // ===============================================

      const question =
        await Question.findOne({
          questionId,
          testId,
        });

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found.",
        });
      }

      // ===============================================
      // UPDATE QUESTION
      // ===============================================

      question.questionText =
        cleanQuestionText;

      question.optionA =
        cleanOptionA;

      question.optionB =
        cleanOptionB;

      question.optionC =
        cleanOptionC;

      question.optionD =
        cleanOptionD;

      question.correctAnswer =
        correctAnswerNumber;

      question.questionTextHi =
        cleanQuestionTextHi;

      question.optionAHi =
        cleanOptionAHi;

      question.optionBHi =
        cleanOptionBHi;

      question.optionCHi =
        cleanOptionCHi;

      question.optionDHi =
        cleanOptionDHi;

      await question.save();

      // ===============================================
      // RESPONSE
      // ===============================================

      return res.json({
        success: true,

        message:
          "Question updated successfully.",

        question: {
          questionId:
            question.questionId,

          testId:
            question.testId,

          questionText:
            question.questionText,

          optionA:
            question.optionA,

          optionB:
            question.optionB,

          optionC:
            question.optionC,

          optionD:
            question.optionD,

          correctAnswer:
            Number(
              question.correctAnswer
            ),

          questionTextHi:
            question.questionTextHi ||
            "",

          optionAHi:
            question.optionAHi ||
            "",

          optionBHi:
            question.optionBHi ||
            "",

          optionCHi:
            question.optionCHi ||
            "",

          optionDHi:
            question.optionDHi ||
            "",
        },
      });
    } catch (error) {
      console.error(
        "MongoDB admin update question error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update question.",
      });
    }
  }
);

// =====================================================
// ADMIN - DELETE QUESTION - MONGODB
// =====================================================

app.delete(
  "/api/admin/tests/:testId/questions/:questionId",
  requireAdmin,
  async (req, res) => {
    try {
      // ===============================================
      // ADMIN SECURITY
      // ===============================================


      // ===============================================
      // PARAMS
      // ===============================================

      const testId =
        String(
          req.params.testId || ""
        )
          .trim()
          .toLowerCase();

      const questionId =
        Number(
          req.params.questionId
        );

      // ===============================================
      // VALIDATION
      // ===============================================

      if (!testId) {
        return res.status(400).json({
          success: false,
          message:
            "Test ID is required.",
        });
      }

      if (
        !Number.isInteger(
          questionId
        ) ||
        questionId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Question ID.",
        });
      }

      // ===============================================
      // FIND QUESTION
      // ===============================================

      const question =
        await Question.findOne({
          questionId,
          testId,
        });

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found.",
        });
      }

      // ===============================================
      // DELETE QUESTION
      // ===============================================

      await Question.deleteOne({
        _id: question._id,
      });

      // ===============================================
      // RESPONSE
      // ===============================================

      return res.json({
        success: true,
        message:
          "Question deleted successfully.",
        questionId,
      });
    } catch (error) {
      console.error(
        "MongoDB admin delete question error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete question.",
      });
    }
  }
);

// =====================================================
// ADMIN - DELETE TEST - MONGODB
// =====================================================

app.delete(
  "/api/admin/tests/:testId",
  requireAdmin,
  async (req, res) => {
    try {
      // ===============================================
      // ADMIN SECURITY
      // ===============================================


      // ===============================================
      // TEST ID
      // ===============================================

      const testId =
        String(
          req.params.testId || ""
        )
          .trim()
          .toLowerCase();

      if (!testId) {
        return res.status(400).json({
          success: false,
          message:
            "Test ID is required.",
        });
      }

      // ===============================================
      // CHECK TEST EXISTS
      // ===============================================

      const test =
        await Test.findOne({
          testId,
        })
          .select(
            "_id testId title"
          )
          .lean();

      if (!test) {
        return res.status(404).json({
          success: false,
          message:
            "Test not found.",
        });
      }

      // ===============================================
      // DELETE QUESTIONS OF THIS TEST
      // ===============================================

      const questionsDeleteResult =
        await Question.deleteMany({
          testId,
        });

      const deletedQuestions =
        Number(
          questionsDeleteResult
            .deletedCount
        ) || 0;

      // ===============================================
      // DELETE TEST
      // ===============================================

      const testDeleteResult =
        await Test.deleteOne({
          _id: test._id,
        });

      if (
        testDeleteResult
          .deletedCount !== 1
      ) {
        throw new Error(
          "Test could not be deleted."
        );
      }

      // ===============================================
      // RESPONSE
      // ===============================================

      return res.json({
        success: true,

        message:
          "Test deleted successfully.",

        testId,

        deletedQuestions,
      });
    } catch (error) {
      console.error(
        "MongoDB admin delete test error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete test.",
      });
    }
  }
);
// ======================================================
// 404 ROUTE
// ======================================================

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      error:
        "Route not found",

    });

  }
);

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

const server =
  app.listen(
    PORT,
    () => {

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "Disha The Academy Backend"
      );
      console.log(
        "================================="
      );
      console.log(
        `Server running on http://localhost:${PORT}`
      );
      console.log(
        "PDF folder:",
        pdfFolder
      );
      console.log(
        "================================="
      );
      console.log("");

    }
  );

// ======================================================
// SERVER ERROR
// ======================================================

server.on(
  "error",
  (error) => {

    if (
      error.code ===
      "EADDRINUSE"
    ) {

      console.error("");
      console.error(
        `ERROR: Port ${PORT} is already in use.`
      );
      console.error(
        "Backend is probably already running."
      );
      console.error("");

    } else {

      console.error(
        "Server error:",
        error
      );

    }

  }
);

// ======================================================
// UNCAUGHT EXCEPTION
// ======================================================

process.on(
  "uncaughtException",
  (error) => {

    console.error(
      "Uncaught Exception:",
      error
    );

  }
);

// ======================================================
// UNHANDLED REJECTION
// ======================================================

process.on(
  "unhandledRejection",
  (error) => {

    console.error(
      "Unhandled Rejection:",
      error
    );

  }
);