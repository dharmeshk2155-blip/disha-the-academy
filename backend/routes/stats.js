const express = require("express");

const User = require("../models/User");
const Test = require("../models/Test");
const Question = require("../models/Question");

const router = express.Router();

// =====================================================
// GET /api/stats
// Live public statistics from MongoDB
// =====================================================

router.get("/", async (req, res) => {
  try {
    const [
      registeredStudents,
      mockTestsCount,
      questionsCount,
    ] = await Promise.all([
      User.countDocuments({
        isActive: true,
      }),

      Test.countDocuments({
        isActive: true,
      }),

      Question.countDocuments(),
    ]);

    return res.json({
      registeredStudents,
      mockTestsCount,
      questionsCount,
    });
  } catch (error) {
    console.error(
      "MongoDB stats error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to load stats",
    });
  }
});

module.exports = router;