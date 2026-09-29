const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const {
  hashPassword,
  verifyPassword,
} = require("../utils/password");

const router = express.Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// ======================================================
// CREATE JWT
// ======================================================

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

// ======================================================
// FORMAT USER
// ======================================================

function formatUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile || "",
    picture: user.picture || "",
  };
}

// ======================================================
// REGISTER
// POST /api/register
// ======================================================

router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        name,
        fullName,
        email,
        mobile,
        password,
        confirmPassword,
      } = req.body;

      const finalName = String(
        name || fullName || ""
      ).trim();

      const normalizedEmail = String(
        email || ""
      )
        .trim()
        .toLowerCase();

      const cleanMobile = String(
        mobile || ""
      ).trim();

      // REQUIRED FIELDS
      if (
        !finalName ||
        !normalizedEmail ||
        !cleanMobile ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      // NAME VALIDATION
      if (finalName.length < 2) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid full name",
        });
      }

      // EMAIL VALIDATION
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(normalizedEmail)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address",
        });
      }

      // MOBILE VALIDATION
      const mobileRegex =
        /^[6-9]\d{9}$/;

      if (
        !mobileRegex.test(cleanMobile)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid 10-digit mobile number",
        });
      }

      // PASSWORD VALIDATION
      if (
        String(password).length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters long",
        });
      }

      // CONFIRM PASSWORD
      if (
        confirmPassword !== undefined &&
        password !== confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Passwords do not match",
        });
      }

      // CHECK EXISTING USER
      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "Email already registered",
        });
      }

      // HASH PASSWORD
      const passwordHash =
        hashPassword(
          String(password)
        );

      // CREATE USER
      const user =
        await User.create({
          fullName: finalName,
          email: normalizedEmail,
          mobile: cleanMobile,
          passwordHash,
          authProvider: "local",
        });

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "NEW MONGODB USER REGISTERED"
      );
      console.log(
        "USER ID:",
        user._id.toString()
      );
      console.log(
        "EMAIL:",
        user.email
      );
      console.log(
        "================================="
      );
      console.log("");

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Account created successfully",
          user:
            formatUser(user),
        });
    } catch (error) {
      console.error(
        "MongoDB registration error:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Email already registered",
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Registration failed",
        });
    }
  }
);

// ======================================================
// LOGIN
// POST /api/login
// ======================================================

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (
        !user ||
        !user.isActive ||
        !user.passwordHash
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      const passwordCorrect =
        verifyPassword(
          String(password),
          user.passwordHash
        );

      if (!passwordCorrect) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      const token =
        createToken(user);

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "MONGODB LOGIN SUCCESSFUL"
      );
      console.log(
        "USER ID:",
        user._id.toString()
      );
      console.log(
        "EMAIL:",
        user.email
      );
      console.log(
        "================================="
      );
      console.log("");

      return res.json({
        success: true,
        message:
          "Login successful",
        token,
        user:
          formatUser(user),
      });
    } catch (error) {
      console.error(
        "MongoDB login error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Login failed",
        });
    }
  }
);

// ======================================================
// GOOGLE LOGIN
// POST /api/auth/google
//
// Supports:
// 1. token
// 2. credential
// 3. idToken
// 4. accessToken
// ======================================================

router.post(
  "/auth/google",
  async (req, res) => {
    try {
      const {
        token,
        credential,
        idToken,
        accessToken,
      } = req.body;

      let profile = null;

      const googleIdToken =
        token ||
        credential ||
        idToken;

      // ==================================================
      // GOOGLE ID TOKEN
      // ==================================================

      if (googleIdToken) {
        const expectedClientId =
          String(
            process.env
              .GOOGLE_CLIENT_ID ||
              ""
          ).trim();

        if (!expectedClientId) {
          console.error(
            "GOOGLE_CLIENT_ID is missing"
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                "Google login is not configured",
            });
        }

        const ticket =
          await googleClient.verifyIdToken({
            idToken:
              googleIdToken,
            audience:
              expectedClientId,
          });

        const payload =
          ticket.getPayload();

        profile = {
          email:
            payload.email,
          name:
            payload.name,
          picture:
            payload.picture,
          googleId:
            payload.sub,
        };
      }

      // ==================================================
      // GOOGLE ACCESS TOKEN
      // Used by current frontend initTokenClient flow
      // ==================================================

      else if (accessToken) {
        const expectedClientId =
          String(
            process.env
              .GOOGLE_CLIENT_ID ||
              ""
          ).trim();

        if (!expectedClientId) {
          console.error(
            "GOOGLE_CLIENT_ID is missing"
          );

          return res
            .status(500)
            .json({
              success: false,
              message:
                "Google login is not configured",
            });
        }

        // -----------------------------------------------
        // VERIFY ACCESS TOKEN
        // -----------------------------------------------

        const tokenInfoRes =
          await fetch(
            `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(
              accessToken
            )}`
          );

        const tokenInfo =
          await tokenInfoRes
            .json()
            .catch(() => ({}));

        if (!tokenInfoRes.ok) {
          console.error(
            "Google tokeninfo error:",
            tokenInfo
          );

          return res
            .status(401)
            .json({
              success: false,
              message:
                "Invalid Google token",
            });
        }

        // Google access-token tokeninfo can expose
        // the client id under different field names.
        const tokenAudience =
          String(
            tokenInfo.audience ||
              tokenInfo.aud ||
              tokenInfo.issued_to ||
              tokenInfo.azp ||
              ""
          ).trim();

        console.log(
          "Google token audience:",
          tokenAudience
        );

        console.log(
          "Expected Google Client ID:",
          expectedClientId
        );

        if (
          !tokenAudience ||
          tokenAudience !==
            expectedClientId
        ) {
          console.error(
            "Google Client ID mismatch"
          );

          return res
            .status(401)
            .json({
              success: false,
              message:
                "Invalid Google token",
            });
        }

        // -----------------------------------------------
        // GET GOOGLE PROFILE
        // -----------------------------------------------

        const profileRes =
          await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );

        if (!profileRes.ok) {
          const profileError =
            await profileRes
              .json()
              .catch(() => ({}));

          console.error(
            "Google profile error:",
            profileError
          );

          return res
            .status(401)
            .json({
              success: false,
              message:
                "Unable to get Google profile",
            });
        }

        const googleProfile =
          await profileRes.json();

        profile = {
          email:
            googleProfile.email,
          name:
            googleProfile.name,
          picture:
            googleProfile.picture,
          googleId:
            googleProfile.sub,
        };
      }

      // ==================================================
      // NO TOKEN
      // ==================================================

      else {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Google token is required",
          });
      }

      // ==================================================
      // VALIDATE GOOGLE PROFILE
      // ==================================================

      if (!profile?.email) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Could not get email from Google",
          });
      }

      const normalizedEmail =
        String(
          profile.email
        )
          .trim()
          .toLowerCase();

      // ==================================================
      // FIND EXISTING USER
      // ==================================================

      let user =
        await User.findOne({
          email:
            normalizedEmail,
        });

      // ==================================================
      // CREATE GOOGLE USER
      // ==================================================

      if (!user) {
        user =
          await User.create({
            fullName:
              profile.name ||
              "Google User",

            email:
              normalizedEmail,

            mobile: "",

            passwordHash: "",

            googleId:
              profile.googleId ||
              "",

            picture:
              profile.picture ||
              "",

            authProvider:
              "google",
          });
      } else {
        // Existing local user can also use Google.
        // Never remove existing password.

        let changed = false;

        if (
          profile.googleId &&
          user.googleId !==
            profile.googleId
        ) {
          user.googleId =
            profile.googleId;

          changed = true;
        }

        if (
          profile.picture &&
          user.picture !==
            profile.picture
        ) {
          user.picture =
            profile.picture;

          changed = true;
        }

        if (
          profile.name &&
          !user.fullName
        ) {
          user.fullName =
            profile.name;

          changed = true;
        }

        if (changed) {
          await user.save();
        }
      }

      // ==================================================
      // ACTIVE ACCOUNT CHECK
      // ==================================================

      if (!user.isActive) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "This account is currently disabled",
          });
      }

      // ==================================================
      // CREATE JWT
      // ==================================================

      const authToken =
        createToken(user);

      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "GOOGLE MONGODB LOGIN SUCCESSFUL"
      );
      console.log(
        "USER ID:",
        user._id.toString()
      );
      console.log(
        "EMAIL:",
        user.email
      );
      console.log(
        "================================="
      );
      console.log("");

      return res.json({
        success: true,
        message:
          "Google login successful",
        token:
          authToken,
        user:
          formatUser(user),
      });
    } catch (error) {
      console.error(
        "Google MongoDB auth error:",
        error
      );

      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid Google token",
        });
    }
  }
);

module.exports = router;