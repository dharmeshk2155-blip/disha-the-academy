const express = require("express");
const cors = require("cors");
require("dotenv").config();
const testsRouter = require("./routes/tests");
const leaderboardRouter = require("./routes/leaderboard");
const contactRouter = require("./routes/contact");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const { sql, connectDB } = require("./db");

const app = express();

// ======================================================
// BASIC SETUP
// ======================================================

app.use(cors());
app.use(express.json());
app.use("/api/tests", testsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/contact", contactRouter);
app.use("/api/auth", authRoutes);

// ======================================================
// FILE PATHS
// ======================================================

const pdfFolder = path.join(__dirname, "pdfs");

// ======================================================
// PASSWORD HASHING
// ======================================================

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
}

// ======================================================
// PASSWORD VERIFICATION
// ======================================================

function verifyPassword(password, storedPassword) {
  try {
    const parts = storedPassword.split(":");

    if (parts.length !== 2) {
      return false;
    }

    const salt = parts[0];
    const storedHash = parts[1];

    const hash = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");

    const storedHashBuffer = Buffer.from(
      storedHash,
      "hex"
    );

    const hashBuffer = Buffer.from(
      hash,
      "hex"
    );

    if (
      storedHashBuffer.length !==
      hashBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      hashBuffer,
      storedHashBuffer
    );

  } catch (error) {
    console.error(
      "Password verification error:",
      error
    );

    return false;
  }
}

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