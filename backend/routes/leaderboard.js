const express = require("express");

const Result = require("../models/Result");
const User = require("../models/User");

const router = express.Router();

// =====================================================
// GET /api/leaderboard
// Top 10 users by total of their BEST score in each test.
// Retaking the same test many times cannot raise a rank:
// only the highest attempt per test counts.
// =====================================================

router.get("/", async (req, res) => {
  try {
    const leaderboard =
      await Result.aggregate([
        // -----------------------------------------
        // ONLY LOGGED-IN USERS
        // Valid MongoDB ObjectId userId
        // -----------------------------------------
        {
          $match: {
            userId: {
              $type: "string",
              $regex:
                /^[0-9a-fA-F]{24}$/,
            },
          },
        },

        // -----------------------------------------
        // STEP 1: BEST SCORE PER USER PER TEST
        // Many attempts of the same test collapse
        // into a single row (the highest score).
        // -----------------------------------------
        {
          $group: {
            _id: {
              userId: "$userId",
              testId: "$testId",
            },

            bestScore: {
              $max: "$score",
            },
          },
        },

        // -----------------------------------------
        // STEP 2: TOTAL OF THOSE BEST SCORES PER USER
        // testsTaken = number of DIFFERENT tests
        // -----------------------------------------
        {
          $group: {
            _id: "$_id.userId",

            totalScore: {
              $sum: "$bestScore",
            },

            testsTaken: {
              $sum: 1,
            },
          },
        },

        // -----------------------------------------
        // CONVERT STRING USER ID TO OBJECT ID
        // -----------------------------------------
        {
          $addFields: {
            userObjectId: {
              $toObjectId: "$_id",
            },
          },
        },

        // -----------------------------------------
        // JOIN USERS COLLECTION
        // -----------------------------------------
        {
          $lookup: {
            from:
              User.collection.name,

            localField:
              "userObjectId",

            foreignField:
              "_id",

            as: "user",
          },
        },

        // -----------------------------------------
        // USER MUST EXIST
        // -----------------------------------------
        {
          $unwind: "$user",
        },

        // -----------------------------------------
        // SORT HIGHEST SCORE FIRST
        // -----------------------------------------
        // Same score: fewer tests = ranked higher.
        // _id keeps the order stable between requests.
        {
          $sort: {
            totalScore: -1,
            testsTaken: 1,
            _id: 1,
          },
        },

        // -----------------------------------------
        // TOP 10
        // -----------------------------------------
        {
          $limit: 10,
        },

        // -----------------------------------------
        // SAME RESPONSE SHAPE AS OLD API
        // -----------------------------------------
        {
          $project: {
            _id: 0,

            name:
              "$user.fullName",

            totalScore: {
              $round: [
                "$totalScore",
                2,
              ],
            },

            testsTaken: 1,
          },
        },
      ]);

    return res.json(
      leaderboard
    );
  } catch (error) {
    console.error(
      "MongoDB leaderboard error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to load leaderboard",
    });
  }
});

module.exports = router;