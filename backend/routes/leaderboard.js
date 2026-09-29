const express = require("express");

const Result = require("../models/Result");
const User = require("../models/User");

const router = express.Router();

// =====================================================
// GET /api/leaderboard
// Top 10 users by total score across all attempts
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
        // GROUP RESULTS BY USER
        // -----------------------------------------
        {
          $group: {
            _id: "$userId",

            totalScore: {
              $sum: "$score",
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
        {
          $sort: {
            totalScore: -1,
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