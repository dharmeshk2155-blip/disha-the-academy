const express = require("express");
const rateLimit = require("express-rate-limit");

const requireAuth = require("../middleware/requireAuth");
const User = require("../models/User");
const Test = require("../models/Test");
const Question = require("../models/Question");
const CurrentAffair = require("../models/CurrentAffair");
const Blog = require("../models/Blog");
const Note = require("../models/Note");
const {
  WINDOW_DAYS,
  buildNotifications,
} = require("../utils/notifications");

const router = express.Router();

// The bell asks for updates every few minutes, so this is generous
// but still protects the database from a runaway client.
const notificationsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again in a few minutes.",
  },
});

router.use(notificationsLimiter);

// A note only counts once it has something students can open
const NOTE_HAS_CONTENT = {
  $or: [
    { pdf: { $exists: true, $nin: [null, ""] } },
    { content: { $exists: true, $nin: [null, ""] } },
  ],
};

// ======================================================
// GET /api/notifications
// What is new on the site, and how many the user has not seen.
// ======================================================

router.get("/", requireAuth, async (req, res) => {
  try {
    const since = new Date(
      Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    const recent = { createdAt: { $gte: since } };

    const [user, testDocs, affairs, blogs, notes] = await Promise.all([
      User.findById(req.user.id)
        .select("createdAt notificationsSeenAt")
        .lean(),

      Test.find({ isActive: true, ...recent })
        .select("testId title isFree createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      CurrentAffair.find(recent)
        .select("title createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      Blog.find({ status: "Published", ...recent })
        .select("title createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      Note.find({ isActive: true, ...recent, ...NOTE_HAS_CONTENT })
        .select("title categorySlug categoryTitle createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    // A test is created first and its questions are added afterwards,
    // so only announce tests that already have questions.
    let tests = [];

    if (testDocs.length) {
      const withQuestions = new Set(
        await Question.distinct("testId", {
          testId: { $in: testDocs.map((test) => test.testId) },
        })
      );

      tests = testDocs.filter((test) => withQuestions.has(test.testId));
    }

    // "Seen" = last time the user opened the bell. Before the first
    // time, only things added after the account was created count as new.
    const seenAt =
      user?.notificationsSeenAt || user?.createdAt || since;

    const { items, unreadCount } = buildNotifications({
      tests,
      affairs,
      blogs,
      notes,
      seenAt,
    });

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      items,
      unreadCount,
      windowDays: WINDOW_DAYS,
    });
  } catch (error) {
    console.error("Notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
});

// ======================================================
// POST /api/notifications/seen   { upTo: <ISO date> }
// Marks everything up to "upTo" as seen. $max means the marker only
// ever moves forward, so a late or repeated request cannot make
// already-seen items look new again. "upTo" is the newest item the
// user actually saw, so an item added a second later is not lost.
// ======================================================

router.post("/seen", requireAuth, async (req, res) => {
  try {
    const now = new Date();

    let upTo = new Date(req.body?.upTo);

    if (Number.isNaN(upTo.getTime()) || upTo > now) {
      upTo = now;
    }

    await User.updateOne(
      { _id: req.user.id },
      { $max: { notificationsSeenAt: upTo } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Notifications seen error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
});

module.exports = router;