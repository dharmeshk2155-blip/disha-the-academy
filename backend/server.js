const express = require("express");
const cors = require("cors");
require("dotenv").config();

const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const app = express();

// ======================================================
// BASIC SETUP
// ======================================================

app.use(cors());
app.use(express.json());

// PDF folder
const pdfFolder = path.join(__dirname, "pdfs");

// ======================================================
// RAZORPAY
// ======================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ======================================================
// ORDERS
// ======================================================

// Temporary order storage
// Note: Server restart hone par ye data reset ho jayega.
const orders = new Map();

// ======================================================
// NOTES + PDF MAPPING
// ======================================================

const notes = [
  {
    id: 1,
    title: "HP General Knowledge",
    subject: "Himachal Pradesh GK",
    price: 49,
    pdf: "HP High Court Process Server Syllabus.pdf",
  },

  {
    id: 2,
    title: "HP Police Constable",
    subject: "Complete Exam Preparation",
    price: 99,
    pdf: "All One Word Substitution asked in SSC Exam 2025(P).pdf",
  },

  {
    id: 3,
    title: "Mathematics Notes",
    subject: "Quantitative Aptitude",
    price: 49,
    pdf: "Formula Cheat-Sheet(P).pdf",
  },

  {
    id: 4,
    title: "Reasoning Notes",
    subject: "Verbal & Non-Verbal Reasoning",
    price: 49,
    pdf: "Adverbs & Adjectives Revision Notes.pdf",
  },

  {
    id: 5,
    title: "General Science",
    subject: "Physics, Chemistry & Biology",
    price: 59,
    pdf: "May 2026 current affairs_compressed.pdf",
  },

  {
    id: 6,
    title: "English Notes",
    subject: "Grammar & Vocabulary",
    price: 49,
    pdf: "1000+ Idioms and Phrases Notes(P).pdf",
  },

  {
    id: 7,
    title: "Indian Polity",
    subject: "Constitution & Government",
    price: 59,
    pdf: "January CA class-compressed.pdf",
  },

  {
    id: 8,
    title: "Current Affairs",
    subject: "Important Current Affairs",
    price: 39,
    pdf: "March+April CA_compressed.pdf",
  },

  {
    id: 9,
    title: "General Hindi",
    subject: "Hindi Grammar & Vocabulary",
    price: 49,
    pdf: "Hindi_TESTBOOK NEWS BULLETIN_08 Jul testbook_pass.pdf",
  },
];

// ======================================================
// HOME ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.send("Disha The Academy Backend is Running!");
});

// ======================================================
// TEST ROUTE
// ======================================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Frontend and Backend are connected!",
  });
});

// ======================================================
// NOTES API
// ======================================================

app.get("/api/notes", (req, res) => {
  res.json(notes);
});

// ======================================================
// GET SINGLE NOTE
// ======================================================

app.get("/api/notes/:id", (req, res) => {
  const noteId = Number(req.params.id);

  const note = notes.find(
    (item) => item.id === noteId
  );

  if (!note) {
    return res.status(404).json({
      success: false,
      error: "Note not found",
    });
  }

  res.json(note);
});

// ======================================================
// CREATE RAZORPAY ORDER
// ======================================================

app.post(
  "/api/payment/create-order",
  async (req, res) => {
    try {
      const { noteId } = req.body;

      // Check note ID
      if (!noteId) {
        return res.status(400).json({
          success: false,
          error: "Note ID is required",
        });
      }

      // Find note
      const note = notes.find(
        (item) =>
          item.id === Number(noteId)
      );

      if (!note) {
        return res.status(404).json({
          success: false,
          error: "Note not found",
        });
      }

      // IMPORTANT:
      // Price backend se liya ja raha hai.
      // Frontend ke amount par trust nahi kiya ja raha.
      const amount = Number(note.price);

      // Create Razorpay order
      const razorpayOrder =
        await razorpay.orders.create({
          amount: amount * 100,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        });

      // Save order information
      orders.set(
        razorpayOrder.id,
        {
          orderId: razorpayOrder.id,
          noteId: note.id,
          title: note.title,
          price: note.price,
          pdf: note.pdf,
          paid: false,
          paymentId: null,
          createdAt: new Date().toISOString(),
        }
      );

      console.log(
        "================================="
      );

      console.log(
        "RAZORPAY ORDER CREATED"
      );

      console.log(
        "Order ID:",
        razorpayOrder.id
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
        note.price
      );

      console.log(
        "PDF:",
        note.pdf
      );

      console.log(
        "================================="
      );

      res.json({
        success: true,
        ...razorpayOrder,
      });

    } catch (error) {
      console.error(
        "Razorpay order error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to create payment order",
      });
    }
  }
);

// ======================================================
// VERIFY RAZORPAY PAYMENT
// ======================================================

app.post(
  "/api/payment/verify",
  (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      // Check payment details
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

      // Find our order
      const order = orders.get(
        razorpay_order_id
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      // Create signature
      const body =
        razorpay_order_id +
        "|" +
        razorpay_payment_id;

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET
          )
          .update(body)
          .digest("hex");

      // Compare signatures
      const isValid =
        expectedSignature ===
        razorpay_signature;

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

      // Payment successful
      order.paid = true;

      order.paymentId =
        razorpay_payment_id;

      order.verifiedAt =
        new Date().toISOString();

      orders.set(
        razorpay_order_id,
        order
      );

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
        "Note ID:",
        order.noteId
      );

      console.log(
        "PDF:",
        order.pdf
      );

      console.log(
        "================================="
      );

      // Send success response
      res.json({
        success: true,

        message:
          "Payment verified successfully",

        orderId:
          razorpay_order_id,

        noteId:
          order.noteId,

        downloadUrl:
          `/api/pdf/download/${razorpay_order_id}`,
      });

    } catch (error) {
      console.error(
        "Payment verification error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Payment verification failed",
      });
    }
  }
);

// ======================================================
// DOWNLOAD PDF AFTER PAYMENT
// ======================================================

app.get(
  "/api/pdf/download/:orderId",
  (req, res) => {
    try {
      const {
        orderId,
      } = req.params;

      // Find order
      const order =
        orders.get(orderId);

      // Payment check
      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      if (!order.paid) {
        return res.status(403).json({
          success: false,
          error:
            "Payment required before downloading PDF",
        });
      }

      // Find note
      const note = notes.find(
        (item) =>
          item.id === order.noteId
      );

      if (!note) {
        return res.status(404).json({
          success: false,
          error: "Note not found",
        });
      }

      // PDF filename
      const pdfFileName =
        note.pdf;

      // Full PDF path
      const pdfPath =
        path.join(
          pdfFolder,
          pdfFileName
        );

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

      console.log(
        "Note:",
        note.title
      );

      console.log(
        "PDF:",
        pdfFileName
      );

      console.log(
        "PDF Path:",
        pdfPath
      );

      console.log(
        "================================="
      );

      // Check file exists
      if (!fs.existsSync(pdfPath)) {
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

      // Download PDF
      res.download(
        pdfPath,
        pdfFileName,
        (error) => {
          if (error) {
            console.error(
              "PDF download error:",
              error
            );

            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                error:
                  "PDF could not be downloaded",
              });
            }
          }
        }
      );

    } catch (error) {
      console.error(
        "PDF access error:",
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error:
            "Unable to access PDF",
        });
      }
    }
  }
);

// ======================================================
// CHECK ORDER STATUS
// ======================================================

app.get(
  "/api/payment/order/:orderId",
  (req, res) => {
    try {
      const {
        orderId,
      } = req.params;

      const order =
        orders.get(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      res.json({
        success: true,
        order: {
          orderId:
            order.orderId,

          noteId:
            order.noteId,

          title:
            order.title,

          price:
            order.price,

          paid:
            order.paid,

          paymentId:
            order.paymentId,
        },
      });

    } catch (error) {
      console.error(
        "Order status error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to check order status",
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
      error: "Route not found",
    });
  }
);

// ======================================================
// SERVER
// ======================================================

const PORT = 5000;

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
    if (error.code === "EADDRINUSE") {
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