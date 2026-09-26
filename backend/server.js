const express = require("express");
const cors = require("cors");
require("dotenv").config();
const testsRouter = require("./routes/tests");
const leaderboardRouter = require("./routes/leaderboard");
const contactRouter = require("./routes/contact");
const passwordRouter = require("./routes/password");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const { sql, connectDB } = require("./db");

const app = express();
const statsRoutes = require("./routes/stats");
const currentAffairsRoutes = require("./routes/currentAffairs");

// ======================================================
// BASIC SETUP
// ======================================================

app.use(cors());
app.use(express.json());
app.use("/api/tests", testsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/contact", contactRouter);
app.use("/api/stats", statsRoutes);
app.use("/api/current-affairs", currentAffairsRoutes);
app.use("/api", passwordRouter);

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
// NOTES
// ======================================================

// ======================================================
// NOTES (flat list of all topics — must stay in sync with
// frontend/src/data/notesContent.js, same ids/prices/pdf names)
// ======================================================

const notes = [
  { id: 1, title: "HP History Notes", subject: "Himachal Pradesh History", price: 49, pdf: "HP High Court Process Server Syllabus.pdf" },
  { id: 2, title: "HP Geography Notes", subject: "Himachal Pradesh Geography", price: 49, pdf: null },
  { id: 3, title: "HP Polity Notes", subject: "HP Polity", price: 49, pdf: null },
  { id: 4, title: "HP Current Affairs Notes", subject: "HP Current Affairs", price: 49, pdf: null },
  { id: 5, title: "HP GK Important MCQs", subject: "Important MCQs", price: 49, pdf: null },

  { id: 6, title: "GK for HP Police Constable", subject: "General Knowledge", price: 99, pdf: "All One Word Substitution asked in SSC Exam 2025(P).pdf" },
  { id: 7, title: "Science for HP Police Constable", subject: "General Science", price: 99, pdf: null },
  { id: 8, title: "Maths for HP Police Constable", subject: "Mathematics", price: 99, pdf: null },
  { id: 9, title: "Reasoning for HP Police Constable", subject: "Reasoning", price: 99, pdf: null },
  { id: 10, title: "Current Affairs for HP Police Constable", subject: "Current Affairs", price: 99, pdf: null },

  { id: 11, title: "Percentage Notes", subject: "Percentage", price: 49, pdf: "Formula Cheat-Sheet(P).pdf" },
  { id: 12, title: "Profit & Loss Notes", subject: "Profit & Loss", price: 49, pdf: null },
  { id: 13, title: "Ratio & Proportion Notes", subject: "Ratio & Proportion", price: 49, pdf: null },
  { id: 14, title: "Average Notes", subject: "Average", price: 49, pdf: null },
  { id: 15, title: "Time & Work Notes", subject: "Time & Work", price: 49, pdf: null },

  { id: 16, title: "Analogy Notes", subject: "Analogy", price: 49, pdf: "Adverbs & Adjectives Revision Notes.pdf" },
  { id: 17, title: "Series Notes", subject: "Series", price: 49, pdf: null },
  { id: 18, title: "Coding-Decoding Notes", subject: "Coding-Decoding", price: 49, pdf: null },
  { id: 19, title: "Blood Relations Notes", subject: "Blood Relations", price: 49, pdf: null },
  { id: 20, title: "Direction Test Notes", subject: "Direction Test", price: 49, pdf: null },

  { id: 21, title: "Physics Notes", subject: "Physics", price: 59, pdf: "May 2026 current affairs_compressed.pdf" },
  { id: 22, title: "Chemistry Notes", subject: "Chemistry", price: 59, pdf: null },
  { id: 23, title: "Biology Notes", subject: "Biology", price: 59, pdf: null },
  { id: 24, title: "Human Body Notes", subject: "Human Body", price: 59, pdf: null },
  { id: 25, title: "Science Important MCQs", subject: "Important Science MCQs", price: 59, pdf: null },

  { id: 26, title: "Parts of Speech Notes", subject: "Parts of Speech", price: 49, pdf: "1000+ Idioms and Phrases Notes(P).pdf" },
  { id: 27, title: "Tenses Notes", subject: "Tenses", price: 49, pdf: null },
  { id: 28, title: "Articles Notes", subject: "Articles", price: 49, pdf: null },
  { id: 29, title: "Prepositions Notes", subject: "Prepositions", price: 49, pdf: null },
  { id: 30, title: "Vocabulary Notes", subject: "Vocabulary", price: 49, pdf: null },

  { id: 31, title: "Indian Constitution Notes", subject: "Indian Constitution", price: 59, pdf: "January CA class-compressed.pdf" },
  { id: 32, title: "Fundamental Rights Notes", subject: "Fundamental Rights", price: 59, pdf: null },
  { id: 33, title: "Parliament Notes", subject: "Parliament", price: 59, pdf: null },
  { id: 34, title: "President Notes", subject: "President", price: 59, pdf: null },
  { id: 35, title: "Supreme Court Notes", subject: "Supreme Court", price: 59, pdf: null },

  { id: 36, title: "National Affairs Notes", subject: "National Affairs", price: 39, pdf: "March+April CA_compressed.pdf" },
  { id: 37, title: "International Affairs Notes", subject: "International Affairs", price: 39, pdf: null },
  { id: 38, title: "Sports Notes", subject: "Sports", price: 39, pdf: null },
  { id: 39, title: "Awards Notes", subject: "Awards", price: 39, pdf: null },
  { id: 40, title: "Important Events Notes", subject: "Important Events", price: 39, pdf: null },

  { id: 41, title: "संधि Notes", subject: "संधि", price: 49, pdf: "Hindi_TESTBOOK NEWS BULLETIN_08 Jul testbook_pass.pdf" },
  { id: 42, title: "समास Notes", subject: "समास", price: 49, pdf: null },
  { id: 43, title: "पर्यायवाची शब्द Notes", subject: "पर्यायवाची शब्द", price: 49, pdf: null },
  { id: 44, title: "विलोम शब्द Notes", subject: "विलोम शब्द", price: 49, pdf: null },
  { id: 45, title: "मुहावरे Notes", subject: "मुहावरे", price: 49, pdf: null },
];
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
// ======================================================

app.get("/api/notes", (req, res) => {

  res.json(notes);

});

// ======================================================
// SINGLE NOTE
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
// GOOGLE LOGIN
// ======================================================

app.post("/api/auth/google", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token is required",
      });
    }

    // Verify the token actually belongs to our app
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
    );
    const tokenInfo = await tokenInfoRes.json();

    if (!tokenInfoRes.ok || tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token",
      });
    }

    // Get the user's profile info from Google
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const profile = await profileRes.json();

    if (!profile.email) {
      return res.status(400).json({
        success: false,
        message: "Could not get email from Google",
      });
    }

    const normalizedEmail = profile.email.trim().toLowerCase();
    const pool = await connectDB();

    // Check if this user already exists
    let userResult = await pool
      .request()
      .input("Email", sql.NVarChar(150), normalizedEmail)
      .query(`SELECT Id, Name, Email, Mobile FROM dbo.Users WHERE Email = @Email`);

    let user;

    if (userResult.recordset.length > 0) {
      // Existing user - just log them in
      user = userResult.recordset[0];
    } else {
      // New user - create an account (no password needed for Google users)
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = hashPassword(randomPassword);

      const insertResult = await pool
        .request()
        .input("Name", sql.NVarChar(100), profile.name || "Google User")
        .input("Email", sql.NVarChar(150), normalizedEmail)
        .input("Mobile", sql.NVarChar(20), "")
        .input("PasswordHash", sql.NVarChar(255), passwordHash)
        .query(`
          INSERT INTO dbo.Users (Name, Email, Mobile, PasswordHash)
          OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.Mobile
          VALUES (@Name, @Email, @Mobile, @PasswordHash)
        `);

      user = insertResult.recordset[0];
    }

    const token = jwt.sign(
      { userId: user.Id, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("");
    console.log("=================================");
    console.log("GOOGLE LOGIN SUCCESSFUL");
    console.log("USER ID:", user.Id);
    console.log("EMAIL:", user.Email);
    console.log("=================================");
    console.log("");

    return res.json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user.Id,
        fullName: user.Name,
        email: user.Email,
        mobile: user.Mobile,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      success: false,
      message: "Google login failed",
    });
  }
});

// ======================================================
// USER REGISTRATION
// ======================================================

app.post("/api/register", async (req, res) => {

  try {

    const {
      name,
      fullName,
      email,
      mobile,
      password,
      confirmPassword,
    } = req.body;

    const finalName = name || fullName;

    // -----------------------------
    // CHECK FIELDS
    // -----------------------------

       if (
      !finalName ||
      !email ||
      !mobile ||
      !password
    ) {

      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });

    }

    // -----------------------------
    // NAME VALIDATION
    // -----------------------------

    if (finalName.trim().length < 2) {

      return res.status(400).json({
        success: false,
        message: "Please enter a valid full name",
      });

    }

    // -----------------------------
    // EMAIL FORMAT VALIDATION
    // -----------------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {

      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });

    }

    // -----------------------------
    // MOBILE NUMBER VALIDATION (10-digit Indian number)
    // -----------------------------

    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobileRegex.test(mobile.trim())) {

      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });

    }

    // -----------------------------
    // PASSWORD STRENGTH VALIDATION
    // -----------------------------

    if (password.length < 6) {

      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });

    }

    // -----------------------------
    // PASSWORD CONFIRM
    // -----------------------------

    if (
      confirmPassword !== undefined &&
      password !== confirmPassword
    ) {

      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });

    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // -----------------------------
    // CONNECT DATABASE
    // -----------------------------

    const pool = await connectDB();

    // -----------------------------
    // CHECK EMAIL
    // -----------------------------

    const existingUser = await pool
      .request()
      .input(
        "Email",
        sql.NVarChar(150),
        normalizedEmail
      )
      .query(`
        SELECT Id
        FROM dbo.Users
        WHERE Email = @Email
      `);

    if (
      existingUser.recordset.length > 0
    ) {

      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });

    }

    // -----------------------------
    // HASH PASSWORD
    // -----------------------------

    const passwordHash =
      hashPassword(password);

    // -----------------------------
    // INSERT USER
    // -----------------------------

    const result = await pool
      .request()
      .input(
        "Name",
        sql.NVarChar(100),
        finalName.trim()
      )
      .input(
        "Email",
        sql.NVarChar(150),
        normalizedEmail
      )
      .input(
        "Mobile",
        sql.NVarChar(20),
        mobile.trim()
      )
      .input(
        "PasswordHash",
        sql.NVarChar(255),
        passwordHash
      )
      .query(`
        INSERT INTO dbo.Users
        (
          Name,
          Email,
          Mobile,
          PasswordHash
        )

        OUTPUT
          INSERTED.Id,
          INSERTED.Name,
          INSERTED.Email,
          INSERTED.Mobile,
          INSERTED.CreatedAt

        VALUES
        (
          @Name,
          @Email,
          @Mobile,
          @PasswordHash
        )
      `);

    const user =
      result.recordset[0];

    console.log("");
    console.log(
      "================================="
    );
    console.log(
      "NEW USER REGISTERED"
    );
    console.log(
      "User ID:",
      user.Id
    );
    console.log(
      "Name:",
      user.Name
    );
    console.log(
      "Email:",
      user.Email
    );
    console.log(
      "================================="
    );
    console.log("");

    return res.status(201).json({

      success: true,

      message:
        "Account created successfully",

      user: {
        id: user.Id,
        fullName: user.Name,
        email: user.Email,
        mobile: user.Mobile,
      },

    });

  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Registration failed",

    });

  }

});

// ======================================================
// USER LOGIN
// ======================================================

app.post("/api/login", async (req, res) => {

  try {

    const {
      email,
      password,
    } = req.body;

    // -----------------------------
    // CHECK REQUIRED FIELDS
    // -----------------------------

    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Email and password are required",

      });

    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // -----------------------------
    // CONNECT SQL SERVER
    // -----------------------------

    const pool =
      await connectDB();

    // -----------------------------
    // FIND USER
    // -----------------------------

    const result = await pool
      .request()
      .input(
        "Email",
        sql.NVarChar(150),
        normalizedEmail
      )
      .query(`
        SELECT
          Id,
          Name,
          Email,
          Mobile,
          PasswordHash
        FROM dbo.Users
        WHERE Email = @Email
      `);

    // -----------------------------
    // USER NOT FOUND
    // -----------------------------

    if (
      result.recordset.length === 0
    ) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password",

      });

    }

    const user =
      result.recordset[0];

    // -----------------------------
    // VERIFY PASSWORD
    // -----------------------------

    const passwordCorrect =
      verifyPassword(
        password,
        user.PasswordHash
      );

    if (!passwordCorrect) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password",

      });

    }

    // ==================================================
    // CREATE JWT TOKEN
    // ==================================================

    const token = jwt.sign(

      {
        userId: user.Id,
        email: user.Email,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      }

    );

    // -----------------------------
    // LOGIN SUCCESS LOG
    // -----------------------------

    console.log("");

    console.log(
      "================================="
    );

    console.log(
      "USER LOGIN SUCCESSFUL"
    );

    console.log(
      "USER ID:",
      user.Id
    );

    console.log(
      "EMAIL:",
      user.Email
    );

    console.log(
      "JWT TOKEN CREATED"
    );

    console.log(
      "================================="
    );

    console.log("");

    // ==================================================
    // LOGIN RESPONSE
    // ==================================================

    return res.json({

      success: true,

      message:
        "Login successful",

      token:

        token,

      user: {

        id:
          user.Id,

        fullName:
          user.Name,

        email:
          user.Email,

        mobile:
          user.Mobile,

      },

    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Login failed",

    });

  }

});
// ======================================================
// CREATE RAZORPAY ORDER
// ======================================================

app.post(
  "/api/payment/create-order",
  async (req, res) => {

    try {

      const {
        noteId,
        userId,
      } = req.body;

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "CREATE ORDER REQUEST"
      );
      console.log(
        "Note ID:",
        noteId
      );
      console.log(
        "User ID:",
        userId
      );

      // -----------------------------
      // CHECK NOTE ID
      // -----------------------------

      if (!noteId) {

        return res.status(400).json({

          success: false,

          error:
            "Note ID is required",

        });

      }

      // -----------------------------
      // CHECK USER ID
      // -----------------------------

      if (!userId) {

        return res.status(400).json({

          success: false,

          error:
            "User ID is required",

        });

      }

      // -----------------------------
      // FIND NOTE
      // -----------------------------

      const note =
        notes.find(
          (item) =>
            item.id ===
            Number(noteId)
        );

      if (!note) {

        return res.status(404).json({

          success: false,

          error:
            "Note not found",

        });

      }

      if (!note.pdf) {

        return res.status(400).json({

          success: false,

          error:
            "This note is not available for purchase yet",

        });

      }

      // -----------------------------
      // CHECK USER IN SQL
      // -----------------------------

      const pool =
        await connectDB();

      const userResult =
  await pool
    .request()
    .input(
      "UserId",
      sql.Int,
      Number(userId)
    )
    .query(`
      SELECT
        Id
      FROM dbo.Users
      WHERE Id = @UserId
    `);

      if (
        userResult.recordset.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error:
            "User not found",

        });

      }

      // -----------------------------
      // PRICE
      // -----------------------------

      const amount =
        Number(note.price);

      // -----------------------------
      // CREATE RAZORPAY ORDER
      // -----------------------------

      const razorpayOrder =
        await razorpay.orders.create({

          amount:
            amount * 100,

          currency:
            "INR",

          receipt:
            `receipt_${Date.now()}`,

        });
// =================================================
// SAVE ORDER TO SQL SERVER
// =================================================

await pool
  .request()

  // ORDER ID
  .input(
    "OrderId",
    sql.NVarChar(100),
    razorpayOrder.id
  )

  // USER ID
  .input(
    "UserId",
    sql.Int,
    Number(userId)
  )

  // NOTE ID
  .input(
    "NoteId",
    sql.Int,
    note.id
  )

  // TITLE
  .input(
    "Title",
    sql.NVarChar(255),
    note.title
  )

  // PRICE
  .input(
    "Price",
    sql.Decimal(10, 2),
    note.price
  )

  // PDF
  .input(
    "Pdf",
    sql.NVarChar(500),
    note.pdf
  )

  // PAID
  .input(
    "Paid",
    sql.Bit,
    false
  )

  .query(`
    INSERT INTO dbo.Orders
    (
      OrderId,
      UserId,
      NoteId,
      Title,
      Price,
      Pdf,
      Paid
    )
    VALUES
    (
      @OrderId,
      @UserId,
      @NoteId,
      @Title,
      @Price,
      @Pdf,
      @Paid
    )
  `);

      // -----------------------------
      // LOG
      // -----------------------------

      console.log(
        "Razorpay Order ID:",
        razorpayOrder.id
      );

      console.log(
        "Note:",
        note.title
      );

      console.log(
        "Price:",
        note.price
      );

      console.log(
        "User ID:",
        userId
      );

      console.log(
        "ORDER SAVED TO SQL SERVER"
      );

      console.log(
        "================================="
      );
      console.log("");

      // -----------------------------
      // RESPONSE
      // -----------------------------

      return res.json({

        success: true,

        ...razorpayOrder,

      });

    } catch (error) {

      console.error(
        "Razorpay order error:",
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
// VERIFY RAZORPAY PAYMENT
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

      // -----------------------------
      // CHECK PAYMENT DATA
      // -----------------------------

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

      // -----------------------------
      // CONNECT SQL
      // -----------------------------

      const pool =
        await connectDB();

      // =================================================
      // FIND ORDER
      // =================================================

      const orderResult =
        await pool
          .request()
          .input(
            "OrderId",
            sql.NVarChar(100),
            razorpay_order_id
          )
          .query(`

            SELECT
              Id,
              OrderId,
              UserId,
              NoteId,
              Title,
              Price,
              Pdf,
              Paid,
              PaymentId,
              CreatedAt,
              VerifiedAt

            FROM dbo.Orders

            WHERE OrderId = @OrderId

          `);

      // -----------------------------
      // ORDER NOT FOUND
      // -----------------------------

      if (
        orderResult.recordset.length === 0
      ) {

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

      const order =
        orderResult.recordset[0];

      // =================================================
      // CREATE RAZORPAY SIGNATURE
      // =================================================

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

      // -----------------------------
      // COMPARE SIGNATURE
      // -----------------------------

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

      let isValid = false;

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

      // -----------------------------
      // INVALID SIGNATURE
      // -----------------------------

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
      // UPDATE ORDER
      // =================================================

      await pool
        .request()

        .input(
          "OrderId",
          sql.NVarChar(100),
          razorpay_order_id
        )

        .input(
          "PaymentId",
          sql.NVarChar(100),
          razorpay_payment_id
        )

        .query(`

          UPDATE dbo.Orders

          SET
            Paid = 1,
            PaymentId = @PaymentId,
            VerifiedAt = GETDATE()

          WHERE OrderId = @OrderId

        `);

      // -----------------------------
      // LOG
      // -----------------------------

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
        order.UserId
      );
      console.log(
        "Note ID:",
        order.NoteId
      );
      console.log(
        "PDF:",
        order.Pdf
      );
      console.log(
        "ORDER UPDATED IN SQL SERVER"
      );
      console.log(
        "================================="
      );
      console.log("");

      // -----------------------------
      // RESPONSE
      // -----------------------------

      return res.json({

        success: true,

        message:
          "Payment verified successfully",

        orderId:
          razorpay_order_id,

        userId:
          order.UserId,

        noteId:
          order.NoteId,

        downloadUrl:
          `/api/pdf/download/${encodeURIComponent(
            razorpay_order_id
          )}`,

      });

    } catch (error) {

      console.error(
        "Payment verification error:",
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
// DOWNLOAD PDF
// ======================================================

app.get(
  "/api/pdf/download/:orderId",
  async (req, res) => {

    try {

      const orderId =
        req.params.orderId;

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

      const pool =
        await connectDB();

      // -----------------------------
      // FIND ORDER
      // -----------------------------

      const result =
        await pool
          .request()
          .input(
            "OrderId",
            sql.NVarChar(100),
            orderId
          )
          .query(`

            SELECT
              Id,
              OrderId,
              UserId,
              NoteId,
              Title,
              Price,
              Pdf,
              Paid,
              PaymentId,
              CreatedAt,
              VerifiedAt

            FROM dbo.Orders

            WHERE OrderId = @OrderId

          `);

      // -----------------------------
      // ORDER NOT FOUND
      // -----------------------------

      if (
        result.recordset.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error:
            "Order not found",

        });

      }

      const order =
        result.recordset[0];

      console.log(
        "Order found:",
        order.OrderId
      );

      console.log(
        "User ID:",
        order.UserId
      );

      console.log(
        "Paid:",
        order.Paid
      );

      // -----------------------------
      // PAYMENT CHECK
      // -----------------------------

      if (!order.Paid) {

        return res.status(403).json({

          success: false,

          error:
            "Payment required before downloading PDF",

        });

      }

      // -----------------------------
      // PDF FILE
      // -----------------------------

      const pdfFileName =
        order.Pdf;

      const pdfPath =
        path.join(
          pdfFolder,
          pdfFileName
        );

      console.log(
        "PDF:",
        pdfFileName
      );

      console.log(
        "PDF Path:",
        pdfPath
      );

      // -----------------------------
      // CHECK FILE
      // -----------------------------

      if (
        !fs.existsSync(pdfPath)
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

      // -----------------------------
      // DOWNLOAD
      // -----------------------------

      console.log(
        "PDF DOWNLOAD STARTED"
      );

      console.log(
        "================================="
      );

      return res.download(
        pdfPath,
        pdfFileName,
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
        "PDF download error:",
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
// CHECK ORDER STATUS
// ======================================================

app.get(
  "/api/payment/order/:orderId",
  async (req, res) => {

    try {

      const orderId =
        req.params.orderId;

      const pool =
        await connectDB();

      const result =
        await pool
          .request()
          .input(
            "OrderId",
            sql.NVarChar(100),
            orderId
          )
          .query(`

            SELECT
              Id,
              OrderId,
              UserId,
              NoteId,
              Title,
              Price,
              Pdf,
              Paid,
              PaymentId,
              CreatedAt,
              VerifiedAt

            FROM dbo.Orders

            WHERE OrderId = @OrderId

          `);

      if (
        result.recordset.length === 0
      ) {

        return res.status(404).json({

          success: false,

          error:
            "Order not found",

        });

      }

      const order =
        result.recordset[0];

      return res.json({

        success: true,

        order: {

          id:
            order.Id,

          orderId:
            order.OrderId,

          userId:
            order.UserId,

          noteId:
            order.NoteId,

          title:
            order.Title,

          price:
            order.Price,

          paid:
            order.Paid,

          paymentId:
            order.PaymentId,

          createdAt:
            order.CreatedAt,

          verifiedAt:
            order.VerifiedAt,

        },

      });

    } catch (error) {

      console.error(
        "Order status error:",
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
// ADMIN DASHBOARD API
// ======================================================

app.get("/api/admin/dashboard", async (req, res) => {
  try {
    // -----------------------------------
    // ADMIN KEY CHECK
    // -----------------------------------

    const adminKey = req.header("x-admin-key");

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // -----------------------------------
    // DATABASE CONNECTION
    // -----------------------------------

    const pool = await connectDB();

    // -----------------------------------
    // TOTAL USERS
    // -----------------------------------

    const usersResult = await pool.request().query(`
      SELECT COUNT(*) AS totalUsers
      FROM dbo.Users
    `);

    // -----------------------------------
    // ORDER / REVENUE STATS
    // -----------------------------------

    const ordersResult = await pool.request().query(`
      SELECT
        COUNT(CASE WHEN Paid = 1 THEN 1 END) AS paidOrders,
        ISNULL(
          SUM(
            CASE
              WHEN Paid = 1 THEN Price
              ELSE 0
            END
          ),
          0
        ) AS totalRevenue
      FROM dbo.Orders
    `);

    // -----------------------------------
    // RECENT PAID ORDERS
    // -----------------------------------

    const recentOrdersResult = await pool.request().query(`
      SELECT TOP 5
        o.Id,
        o.OrderId,
        o.UserId,
        o.NoteId,
        o.Title,
        o.Price,
        o.Paid,
        o.PaymentId,
        o.CreatedAt,
        o.VerifiedAt,
        u.Name AS UserName,
        u.Email AS UserEmail
      FROM dbo.Orders o
      LEFT JOIN dbo.Users u
        ON o.UserId = u.Id
      WHERE o.Paid = 1
      ORDER BY
        COALESCE(o.VerifiedAt, o.CreatedAt) DESC
    `);

    // -----------------------------------
    // NOTES
    // Currently notes are stored in
    // server.js array, not SQL database.
    // -----------------------------------

    const totalNotes = notes.length;

    // -----------------------------------
    // TEST COUNT
    // -----------------------------------

    const testsResult = await pool.request().query(`
      SELECT COUNT(*) AS totalTests
      FROM dbo.Tests
    `);

    const totalTests =
      Number(testsResult.recordset[0]?.totalTests) || 0;

    // -----------------------------------
    // RESPONSE
    // -----------------------------------

    return res.json({
      success: true,

      stats: {
        totalUsers:
          Number(usersResult.recordset[0]?.totalUsers) || 0,

        totalNotes,

        totalTests,

        paidOrders:
          Number(ordersResult.recordset[0]?.paidOrders) || 0,

        totalRevenue:
          Number(ordersResult.recordset[0]?.totalRevenue) || 0,
      },

      recentOrders:
        recentOrdersResult.recordset.map((order) => ({
          id: order.Id,
          orderId: order.OrderId,
          userId: order.UserId,
          userName: order.UserName || "Unknown User",
          userEmail: order.UserEmail || "",
          noteId: order.NoteId,
          title: order.Title,
          price: Number(order.Price) || 0,
          paid: Boolean(order.Paid),
          paymentId: order.PaymentId,
          createdAt: order.CreatedAt,
          verifiedAt: order.VerifiedAt,
        })),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
});

// ======================================================
// ADMIN ORDERS API (full list, for the "View all" page)
// ======================================================

app.get("/api/admin/orders", async (req, res) => {
  try {
    const adminKey = req.header("x-admin-key");

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const pool = await connectDB();

    const status = (req.query.status || "all").toLowerCase();
    const search = (req.query.search || "").trim();

    let whereClauses = [];

    if (status === "paid") {
      whereClauses.push("o.Paid = 1");
    } else if (status === "unpaid") {
      whereClauses.push("o.Paid = 0");
    }

    if (search) {
      whereClauses.push(
        "(u.Name LIKE @search OR u.Email LIKE @search OR o.Title LIKE @search OR o.OrderId LIKE @search)"
      );
    }

    const whereSql =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    const request = pool.request();

    if (search) {
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    const ordersResult = await request.query(`
      SELECT
        o.Id,
        o.OrderId,
        o.UserId,
        o.NoteId,
        o.Title,
        o.Price,
        o.Paid,
        o.PaymentId,
        o.CreatedAt,
        o.VerifiedAt,
        u.Name AS UserName,
        u.Email AS UserEmail
      FROM dbo.Orders o
      LEFT JOIN dbo.Users u
        ON o.UserId = u.Id
      ${whereSql}
      ORDER BY
        COALESCE(o.VerifiedAt, o.CreatedAt) DESC
    `);

    return res.json({
      success: true,

      orders: ordersResult.recordset.map((order) => ({
        id: order.Id,
        orderId: order.OrderId,
        userId: order.UserId,
        userName: order.UserName || "Unknown User",
        userEmail: order.UserEmail || "",
        noteId: order.NoteId,
        title: order.Title,
        price: Number(order.Price) || 0,
        paid: Boolean(order.Paid),
        paymentId: order.PaymentId,
        createdAt: order.CreatedAt,
        verifiedAt: order.VerifiedAt,
      })),
    });
  } catch (error) {
    console.error("Admin orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load orders",
    });
  }
});

// =====================================================
// ADMIN TESTS - GET ALL TESTS
// =====================================================

app.get("/api/admin/tests", async (req, res) => {
  try {
    const adminKey = req.header("x-admin-key");

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        t.TestId,
        t.Category,
        t.Title,
        t.Subject,
        t.Duration,
        t.MarksPerCorrect,
        t.NegativeMarking,
        t.TopCategory,
        t.SubExam,
        COUNT(q.QuestionId) AS TotalQuestions
      FROM dbo.Tests t
      LEFT JOIN dbo.Questions q
        ON t.TestId = q.TestId
      GROUP BY
        t.TestId,
        t.Category,
        t.Title,
        t.Subject,
        t.Duration,
        t.MarksPerCorrect,
        t.NegativeMarking,
        t.TopCategory,
        t.SubExam
      ORDER BY t.Category, t.Title
    `);

    const tests = result.recordset.map((test) => ({
      testId: test.TestId,
      category: test.Category,
      title: test.Title,
      subject: test.Subject,
      duration: Number(test.Duration) || 0,
      marksPerCorrect: Number(test.MarksPerCorrect) || 0,
      negativeMarking: Number(test.NegativeMarking) || 0,
      topCategory: test.TopCategory,
      subExam: test.SubExam,
      totalQuestions: Number(test.TotalQuestions) || 0,
    }));

    return res.json({
      success: true,
      count: tests.length,
      tests,
    });
  } catch (error) {
    console.error("Admin tests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load tests",
    });
  }
});
// =====================================================
// ADMIN - CREATE NEW MOCK TEST
// =====================================================

app.post("/api/admin/tests", async (req, res) => {
  try {
    // -----------------------------------------
    // ADMIN SECURITY
    // -----------------------------------------
    const adminKey = req.header("x-admin-key");

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // -----------------------------------------
    // GET FORM DATA
    // -----------------------------------------
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

    // -----------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------
    const cleanTestId = String(testId || "").trim();
    const cleanCategory = String(category || "").trim();
    const cleanTitle = String(title || "").trim();
    const cleanSubject = String(subject || "").trim();
    const cleanTopCategory = String(topCategory || "").trim();
    const cleanSubExam = String(subExam || "").trim();

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
        message: "Please fill all required fields.",
      });
    }

    // TestId URL-safe rakhenge
    if (!/^[a-z0-9-]+$/.test(cleanTestId)) {
      return res.status(400).json({
        success: false,
        message:
          "Test ID can contain only lowercase letters, numbers and hyphens.",
      });
    }

    const durationNumber = Number(duration);
    const marksNumber = Number(marksPerCorrect);
    const negativeNumber = Number(negativeMarking);

    if (
      !Number.isFinite(durationNumber) ||
      durationNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be greater than 0.",
      });
    }

    if (
      !Number.isFinite(marksNumber) ||
      marksNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Marks per correct answer must be greater than 0.",
      });
    }

    if (
      !Number.isFinite(negativeNumber) ||
      negativeNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Negative marking cannot be less than 0.",
      });
    }

    const pool = await connectDB();

    // -----------------------------------------
    // CHECK DUPLICATE TEST ID
    // -----------------------------------------
    const existingTest = await pool
      .request()
      .input("TestId", sql.NVarChar, cleanTestId)
      .query(`
        SELECT TOP 1 TestId
        FROM dbo.Tests
        WHERE TestId = @TestId
      `);

    if (existingTest.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A test with this Test ID already exists.",
      });
    }

    // -----------------------------------------
    // INSERT TEST
    // -----------------------------------------
    await pool
      .request()
      .input("TestId", sql.NVarChar, cleanTestId)
      .input("Category", sql.NVarChar, cleanCategory)
      .input("Title", sql.NVarChar, cleanTitle)
      .input("Subject", sql.NVarChar, cleanSubject)
      .input("Duration", sql.Int, Math.round(durationNumber))
      .input("MarksPerCorrect", sql.Decimal(10, 2), marksNumber)
      .input("NegativeMarking", sql.Decimal(10, 2), negativeNumber)
      .input("TopCategory", sql.NVarChar, cleanTopCategory)
      .input("SubExam", sql.NVarChar, cleanSubExam)
      .query(`
        INSERT INTO dbo.Tests
        (
          TestId,
          Category,
          Title,
          Subject,
          Duration,
          MarksPerCorrect,
          NegativeMarking,
          TopCategory,
          SubExam
        )
        VALUES
        (
          @TestId,
          @Category,
          @Title,
          @Subject,
          @Duration,
          @MarksPerCorrect,
          @NegativeMarking,
          @TopCategory,
          @SubExam
        )
      `);

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------
    return res.status(201).json({
      success: true,
      message: "Test created successfully.",
      test: {
        testId: cleanTestId,
        category: cleanCategory,
        title: cleanTitle,
        subject: cleanSubject,
        duration: Math.round(durationNumber),
        marksPerCorrect: marksNumber,
        negativeMarking: negativeNumber,
        topCategory: cleanTopCategory,
        subExam: cleanSubExam,
        totalQuestions: 0,
      },
    });
  } catch (error) {
    console.error("Admin create test error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create test.",
    });
  }
});

// =====================================================
// ADMIN - UPDATE MOCK TEST
// =====================================================

app.put("/api/admin/tests/:testId", async (req, res) => {
  try {
    const adminKey = req.header("x-admin-key");

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const currentTestId = String(req.params.testId || "").trim();

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

    const cleanCategory = String(category || "").trim();
    const cleanTitle = String(title || "").trim();
    const cleanSubject = String(subject || "").trim();
    const cleanTopCategory = String(topCategory || "").trim();
    const cleanSubExam = String(subExam || "").trim();

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
        message: "Please fill all required fields.",
      });
    }

    const durationNumber = Number(duration);
    const marksNumber = Number(marksPerCorrect);
    const negativeNumber = Number(negativeMarking);

    if (
      !Number.isFinite(durationNumber) ||
      durationNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be greater than 0.",
      });
    }

    if (
      !Number.isFinite(marksNumber) ||
      marksNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Marks per correct answer must be greater than 0.",
      });
    }

    if (
      !Number.isFinite(negativeNumber) ||
      negativeNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Negative marking cannot be less than 0.",
      });
    }

    const pool = await connectDB();

    // Check whether the test actually exists
    const existingTest = await pool
      .request()
      .input("TestId", sql.NVarChar, currentTestId)
      .query(`
        SELECT TOP 1 TestId
        FROM dbo.Tests
        WHERE TestId = @TestId
      `);

    if (existingTest.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    // TestId itself is intentionally not changed.
    await pool
      .request()
      .input("TestId", sql.NVarChar, currentTestId)
      .input("Category", sql.NVarChar, cleanCategory)
      .input("Title", sql.NVarChar, cleanTitle)
      .input("Subject", sql.NVarChar, cleanSubject)
      .input(
        "Duration",
        sql.Int,
        Math.round(durationNumber)
      )
      .input(
        "MarksPerCorrect",
        sql.Decimal(10, 2),
        marksNumber
      )
      .input(
        "NegativeMarking",
        sql.Decimal(10, 2),
        negativeNumber
      )
      .input(
        "TopCategory",
        sql.NVarChar,
        cleanTopCategory
      )
      .input(
        "SubExam",
        sql.NVarChar,
        cleanSubExam
      )
      .query(`
        UPDATE dbo.Tests
        SET
          Category = @Category,
          Title = @Title,
          Subject = @Subject,
          Duration = @Duration,
          MarksPerCorrect = @MarksPerCorrect,
          NegativeMarking = @NegativeMarking,
          TopCategory = @TopCategory,
          SubExam = @SubExam
        WHERE TestId = @TestId
      `);

    return res.json({
      success: true,
      message: "Test updated successfully.",
      test: {
        testId: currentTestId,
        category: cleanCategory,
        title: cleanTitle,
        subject: cleanSubject,
        duration: Math.round(durationNumber),
        marksPerCorrect: marksNumber,
        negativeMarking: negativeNumber,
        topCategory: cleanTopCategory,
        subExam: cleanSubExam,
      },
    });
  } catch (error) {
    console.error("Admin update test error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update test.",
    });
  }
});

// =====================================================
// ADMIN - GET QUESTIONS OF A TEST
// =====================================================

app.get("/api/admin/tests/:testId/questions", async (req, res) => {
  try {
    const adminKey = req.header("x-admin-key");

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const testId = String(req.params.testId || "").trim();

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "Test ID is required.",
      });
    }

    const pool = await connectDB();

    // First check that test exists
    const testResult = await pool
      .request()
      .input("TestId", sql.NVarChar, testId)
      .query(`
        SELECT
          TestId,
          Category,
          Title,
          Subject,
          Duration,
          MarksPerCorrect,
          NegativeMarking,
          TopCategory,
          SubExam
        FROM dbo.Tests
        WHERE TestId = @TestId
      `);

    if (testResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    // Get questions belonging to this test
    const questionsResult = await pool
      .request()
      .input("TestId", sql.NVarChar, testId)
      .query(`
        SELECT
          QuestionId,
          TestId,
          QuestionText,
          OptionA,
          OptionB,
          OptionC,
          OptionD,
          CorrectAnswer,
          QuestionTextHi,
          OptionAHi,
          OptionBHi,
          OptionCHi,
          OptionDHi
        FROM dbo.Questions
        WHERE TestId = @TestId
        ORDER BY QuestionId ASC
      `);

    const test = testResult.recordset[0];

    const questions = questionsResult.recordset.map((question) => ({
      questionId: question.QuestionId,
      testId: question.TestId,

      questionText: question.QuestionText,

      optionA: question.OptionA,
      optionB: question.OptionB,
      optionC: question.OptionC,
      optionD: question.OptionD,

      correctAnswer: Number(question.CorrectAnswer),

      questionTextHi: question.QuestionTextHi || "",
      optionAHi: question.OptionAHi || "",
      optionBHi: question.OptionBHi || "",
      optionCHi: question.OptionCHi || "",
      optionDHi: question.OptionDHi || "",
    }));

    return res.json({
      success: true,

      test: {
        testId: test.TestId,
        category: test.Category,
        title: test.Title,
        subject: test.Subject,
        duration: Number(test.Duration) || 0,
        marksPerCorrect: Number(test.MarksPerCorrect) || 0,
        negativeMarking: Number(test.NegativeMarking) || 0,
        topCategory: test.TopCategory,
        subExam: test.SubExam,
      },

      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Admin get questions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load questions.",
    });
  }
});

// =====================================================
// ADMIN - ADD QUESTION TO TEST
// =====================================================

app.post("/api/admin/tests/:testId/questions", async (req, res) => {
  try {
    const adminKey = req.header("x-admin-key");

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const testId = String(req.params.testId || "").trim();

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

    // -----------------------------
    // Clean required fields
    // -----------------------------

    const cleanQuestionText = String(questionText || "").trim();
    const cleanOptionA = String(optionA || "").trim();
    const cleanOptionB = String(optionB || "").trim();
    const cleanOptionC = String(optionC || "").trim();
    const cleanOptionD = String(optionD || "").trim();

    const correctAnswerNumber = Number(correctAnswer);

    // -----------------------------
    // Validation
    // -----------------------------

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "Test ID is required.",
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
        message: "Question and all four options are required.",
      });
    }

    if (
      !Number.isInteger(correctAnswerNumber) ||
      correctAnswerNumber < 1 ||
      correctAnswerNumber > 4
    ) {
      return res.status(400).json({
        success: false,
        message: "Correct answer must be between 1 and 4.",
      });
    }

    const pool = await connectDB();

    // -----------------------------
    // Check test exists
    // -----------------------------

    const testResult = await pool
      .request()
      .input("TestId", sql.NVarChar, testId)
      .query(`
        SELECT TOP 1 TestId
        FROM dbo.Tests
        WHERE TestId = @TestId
      `);

    if (testResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    // -----------------------------
    // Generate next QuestionId
    // -----------------------------

   

    // -----------------------------
    // Insert question
    // -----------------------------

   const insertResult = await pool
  .request()
  .input("TestId", sql.NVarChar, testId)
  .input("QuestionText", sql.NVarChar, cleanQuestionText)
  .input("OptionA", sql.NVarChar, cleanOptionA)
  .input("OptionB", sql.NVarChar, cleanOptionB)
  .input("OptionC", sql.NVarChar, cleanOptionC)
  .input("OptionD", sql.NVarChar, cleanOptionD)
  .input("CorrectAnswer", sql.Int, correctAnswerNumber)
  .input(
    "QuestionTextHi",
    sql.NVarChar,
    String(questionTextHi || "").trim() || null
  )
  .input(
    "OptionAHi",
    sql.NVarChar,
    String(optionAHi || "").trim() || null
  )
  .input(
    "OptionBHi",
    sql.NVarChar,
    String(optionBHi || "").trim() || null
  )
  .input(
    "OptionCHi",
    sql.NVarChar,
    String(optionCHi || "").trim() || null
  )
  .input(
    "OptionDHi",
    sql.NVarChar,
    String(optionDHi || "").trim() || null
  )
  .query(`
    INSERT INTO dbo.Questions
    (
      TestId,
      QuestionText,
      OptionA,
      OptionB,
      OptionC,
      OptionD,
      CorrectAnswer,
      QuestionTextHi,
      OptionAHi,
      OptionBHi,
      OptionCHi,
      OptionDHi
    )
    OUTPUT INSERTED.QuestionId
    VALUES
    (
      @TestId,
      @QuestionText,
      @OptionA,
      @OptionB,
      @OptionC,
      @OptionD,
      @CorrectAnswer,
      @QuestionTextHi,
      @OptionAHi,
      @OptionBHi,
      @OptionCHi,
      @OptionDHi
    )
  `);

const newQuestionId =
  insertResult.recordset[0].QuestionId;
    // -----------------------------
    // Success
    // -----------------------------

    return res.status(201).json({
      success: true,
      message: "Question added successfully.",

      question: {
        questionId: nextQuestionId,
        testId,
        questionText: cleanQuestionText,
        optionA: cleanOptionA,
        optionB: cleanOptionB,
        optionC: cleanOptionC,
        optionD: cleanOptionD,
        correctAnswer: correctAnswerNumber,

        questionTextHi: String(questionTextHi || "").trim(),
        optionAHi: String(optionAHi || "").trim(),
        optionBHi: String(optionBHi || "").trim(),
        optionCHi: String(optionCHi || "").trim(),
        optionDHi: String(optionDHi || "").trim(),
      },
    });
  } catch (error) {
    console.error("Admin add question error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add question.",
    });
  }
});

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