const express =
  require("express");

const Result =
  require("../models/Result");

const User =
  require("../models/User");

const Test =
  require("../models/Test");

const router =
  express.Router();

/*
=====================================================
GET /api/leaderboard

FREE + PREMIUM TESTS DONO COUNT HONGE

Rules:
1. Sirf logged-in registered users
2. Same test multiple times diya ho:
   highest score only count hoga
3. Free + Premium dono same Result collection se
4. Har user ke different tests ke best scores add honge
=====================================================
*/

router.get(
  "/",
  async (req, res) => {
    try {

      const leaderboard =
        await Result.aggregate([

          /*
          =========================================
          VALID USERS ONLY
          =========================================
          */

          {
            $match: {
              userId: {
                $type: "string",

                $regex:
                  /^[0-9a-fA-F]{24}$/,
              },
            },
          },

          /*
          =========================================
          STEP 1
          BEST ATTEMPT OF EACH TEST
          =========================================

          User same test 10 times de sakta hai.

          Leaderboard me us test ka
          sirf highest score count hoga.
          */

          {
            $group: {

              _id: {
                userId:
                  "$userId",

                testId:
                  "$testId",
              },

              bestScore: {
                $max:
                  "$score",
              },

              /*
              Total marks bhi rakho
              percentage ke liye.
              */

              totalMarks: {
                $max:
                  "$totalMarks",
              },
            },
          },

          /*
          =========================================
          TEST INFORMATION LOAD
          =========================================
          */

          {
            $lookup: {

              from:
                Test.collection.name,

              localField:
                "_id.testId",

              foreignField:
                "testId",

              as:
                "test",
            },
          },

          /*
          test missing ho tab bhi
          old results leaderboard me rahen.
          */

          {
            $unwind: {
              path:
                "$test",

              preserveNullAndEmptyArrays:
                true,
            },
          },

          /*
          =========================================
          CALCULATE TEST PERCENTAGE
          =========================================
          */

          {
            $addFields: {

              percentage: {

                $cond: [

                  {
                    $gt: [
                      "$totalMarks",
                      0,
                    ],
                  },

                  {
                    $multiply: [

                      {
                        $divide: [
                          "$bestScore",
                          "$totalMarks",
                        ],
                      },

                      100,
                    ],
                  },

                  0,
                ],
              },

              /*
              Exam information.

              Priority:
              subExam
              category
              topCategory
              */

              examName: {

                $ifNull: [

                  "$test.subExam",

                  {
                    $ifNull: [

                      "$test.category",

                      {
                        $ifNull: [
                          "$test.topCategory",
                          "General",
                        ],
                      },
                    ],
                  },
                ],
              },

              isFreeTest: {
                $ifNull: [
                  "$test.isFree",
                  false,
                ],
              },
            },
          },

          /*
          =========================================
          STEP 2
          GROUP BY USER
          =========================================
          */

          {
            $group: {

              _id:
                "$_id.userId",

              /*
              Total leaderboard points
              */

              totalScore: {
                $sum:
                  "$bestScore",
              },

              /*
              Different tests attempted
              */

              testsTaken: {
                $sum: 1,
              },

              /*
              User ka best percentage
              */

              bestPercentage: {
                $max:
                  "$percentage",
              },

              /*
              Exams list
              */

              exams: {
                $addToSet:
                  "$examName",
              },

              /*
              Free tests count
              */

              freeTestsTaken: {

                $sum: {

                  $cond: [
                    "$isFreeTest",
                    1,
                    0,
                  ],
                },
              },

              /*
              Premium tests count
              */

              premiumTestsTaken: {

                $sum: {

                  $cond: [
                    "$isFreeTest",
                    0,
                    1,
                  ],
                },
              },
            },
          },

          /*
          =========================================
          CONVERT USER STRING → OBJECT ID
          =========================================
          */

          {
            $addFields: {

              userObjectId: {
                $toObjectId:
                  "$_id",
              },
            },
          },

          /*
          =========================================
          LOAD USER
          =========================================
          */

          {
            $lookup: {

              from:
                User.collection.name,

              localField:
                "userObjectId",

              foreignField:
                "_id",

              as:
                "user",
            },
          },

          /*
          User must exist
          */

          {
            $unwind:
              "$user",
          },

          /*
          =========================================
          ACTIVE USERS ONLY
          =========================================
          */

          {
            $match: {

              "user.isActive": {
                $ne: false,
              },
            },
          },

          /*
          =========================================
          SORT RANKING
          =========================================

          Higher total score first.

          Same score:
          fewer tests ranks higher.
          */

          {
            $sort: {

              totalScore:
                -1,

              testsTaken:
                1,

              _id:
                1,
            },
          },

          /*
          =========================================
          TOP 10
          =========================================
          */

          {
            $limit: 10,
          },

          /*
          =========================================
          FINAL RESPONSE
          =========================================
          */

          {
            $project: {

              _id:
                0,

              /*
              Useful for frontend
              */

              id:
                "$_id",

              userId:
                "$_id",

              name:
                "$user.fullName",

              /*
              Leaderboard total
              */

              totalScore: {

                $round: [
                  "$totalScore",
                  2,
                ],
              },

              testsTaken:
                1,

              /*
              Frontend getBestScore()
              isko directly read karega.
              */

              bestScore: {

                $round: [
                  "$bestPercentage",
                  0,
                ],
              },

              bestPercentage: {

                $round: [
                  "$bestPercentage",
                  0,
                ],
              },

              /*
              All exams attempted
              */

              exams:
                1,

              /*
              Frontend table ke liye
              */

              exam: {

                $reduce: {

                  input:
                    "$exams",

                  initialValue:
                    "",

                  in: {

                    $cond: [

                      {
                        $eq: [
                          "$$value",
                          "",
                        ],
                      },

                      "$$this",

                      {
                        $concat: [
                          "$$value",
                          ", ",
                          "$$this",
                        ],
                      },
                    ],
                  },
                },
              },

              freeTestsTaken:
                1,

              premiumTestsTaken:
                1,
            },
          },
        ]);

      /*
      =============================================
      ADD RANK + CURRENT USER FIELD
      =============================================
      */

      const formatted =
        leaderboard.map(
          (row, index) => ({
            ...row,

            rank:
              index + 1,
          })
        );

      return res.json(
        formatted
      );

    } catch (error) {

      console.error(
        "MongoDB leaderboard error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to load leaderboard",
        });
    }
  }
);

module.exports =
  router;