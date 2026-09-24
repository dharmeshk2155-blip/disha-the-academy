const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // TODO: apne db.js ke through user find/create karo
    // let user = await findUserByEmail(email);
    // if (!user) user = await createUser({ email, name, picture, googleId });

    const authToken = jwt.sign(
      { email, name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token: authToken });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
});

module.exports = router;