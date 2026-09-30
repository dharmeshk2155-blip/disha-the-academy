const express = require("express");

const Test = require("../models/Test");
const Question = require("../models/Question");
const Result = require("../models/Result");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// =====================================================
// GET /api/tests
// Public test list - metadata only
// =====================================================

router.get("/", async (req, res) => {
  try {
    // -----------------------------------------
    // LOAD ACTIVE TESTS
    // -----------------------------------------

    const testDocuments =
      await Test.find({
        isActive: true,
      })
        .sort({
          category: 1,
          title: 1,
        })
        .lean();

    // -----------------------------------------
    // COUNT QUESTIONS
    // -----------------------------------------

    const questionCounts =
      await Question.aggregate([
        {
          $group: {
            _id: "$testId",

            totalQuestions: {
              $sum: 1,
            },
          },
        },
      ]);

    const questionCountMap =
      new Map(
        questionCounts.map(
          (item) => [
            String(item._id),
            Number(
              item.totalQuestions
            ) || 0,
          ]
        )
      );

    // -----------------------------------------
    // FORMAT RESPONSE
    // Same structure as old SQL API
    // -----------------------------------------

    const tests =
      testDocuments.map(
        (test) => ({
          id:
            test.testId,

          category:
            test.category,

          title:
            test.title,

          subject:
            test.subject,

          duration:
            Number(
              test.duration
            ) || 0,

          marksPerCorrect:
            Number(
              test.marksPerCorrect
            ) || 0,

          negativeMarking:
            Number(
              test.negativeMarking
            ) || 0,

          topCategory:
            test.topCategory,

          subExam:
            test.subExam,

          totalQuestions:
            questionCountMap.get(
              String(test.testId)
            ) || 0,
        })
      );

    return res.json(tests);
  } catch (error) {
    console.error(
      "MongoDB public tests error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to load tests",
    });
  }
});

// =====================================================
// GET /api/tests/results/:userId
// User test history
// =====================================================

router.get(
  "/results/:userId",
  requireAuth,
  async (req, res) => {
    try {
      const userId =
        String(
          req.params.userId || ""
        ).trim();

      if (!userId) {
        return res.status(400).json({
          error:
            "User ID is required",
        });
      }

      // Users can only read their OWN results
      if (userId !== req.user.id) {
        return res.status(403).json({
          error:
            "You can only view your own results.",
        });
      }

      const resultDocuments =
        await Result.find({
          userId,
        })
          .sort({
            submittedAt: -1,
          })
          .lean();

      const results =
        resultDocuments.map(
          (result) => ({
            resultId:
              result.resultId,

            testId:
              result.testId,

            testTitle:
              result.testTitle,

            userId:
              result.userId,

            submittedAt:
              result.submittedAt,

            correctCount:
              Number(
                result.correctCount
              ) || 0,

            wrongCount:
              Number(
                result.wrongCount
              ) || 0,

            unansweredCount:
              Number(
                result.unansweredCount
              ) || 0,

            score:
              Number(
                result.score
              ) || 0,

            totalMarks:
              Number(
                result.totalMarks
              ) || 0,

            review:
              Array.isArray(
                result.review
              )
                ? result.review
                : [],
          })
        );

      return res.json(results);
    } catch (error) {
      console.error(
        "MongoDB test history error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load results",
      });
    }
  }
);

// =====================================================
// GET /api/tests/:id?lang=en|hi
// Full test WITHOUT correct answers
// =====================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const testId =
        String(
          req.params.id || ""
        )
          .trim()
          .toLowerCase();

      const lang =
        req.query.lang === "hi"
          ? "hi"
          : "en";

      if (!testId) {
        return res.status(400).json({
          error:
            "Test ID is required",
        });
      }

      // -----------------------------------------
      // FIND TEST
      // -----------------------------------------

      const test =
        await Test.findOne({
          testId,
          isActive: true,
        }).lean();

      if (!test) {
        return res.status(404).json({
          error:
            "Test not found",
        });
      }

      // -----------------------------------------
      // LOAD QUESTIONS
      // Correct answer frontend ko nahi bhejna
      // -----------------------------------------

      const questionDocuments =
        await Question.find({
          testId,
        })
          .sort({
            questionId: 1,
          })
          .select(
            [
              "questionId",
              "questionText",
              "optionA",
              "optionB",
              "optionC",
              "optionD",
              "questionTextHi",
              "optionAHi",
              "optionBHi",
              "optionCHi",
              "optionDHi",
            ].join(" ")
          )
          .lean();

      // -----------------------------------------
      // LANGUAGE FORMAT
      // -----------------------------------------

      const questions =
        questionDocuments.map(
          (question) => {
            const useHindi =
              lang === "hi" &&
              Boolean(
                String(
                  question.questionTextHi ||
                    ""
                ).trim()
              );

            if (useHindi) {
              return {
                id:
                  question.questionId,

                question:
                  question.questionTextHi,

                options: [
                  question.optionAHi,
                  question.optionBHi,
                  question.optionCHi,
                  question.optionDHi,
                ],
              };
            }

            // Hindi unavailable ho to English fallback
            return {
              id:
                question.questionId,

              question:
                question.questionText,

              options: [
                question.optionA,
                question.optionB,
                question.optionC,
                question.optionD,
              ],
            };
          }
        );

      // -----------------------------------------
      // RESPONSE
      // -----------------------------------------

      return res.json({
        id:
          test.testId,

        category:
          test.category,

        title:
          test.title,

        subject:
          test.subject,

        duration:
          Number(
            test.duration
          ) || 0,

        marksPerCorrect:
          Number(
            test.marksPerCorrect
          ) || 0,

        negativeMarking:
          Number(
            test.negativeMarking
          ) || 0,

        language:
          lang,

        questions,
      });
    } catch (error) {
      console.error(
        "MongoDB public test error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load test",
      });
    }
  }
);

// =====================================================
// POST /api/tests/:id/submit?lang=en|hi
// Submit test and save result in MongoDB
// =====================================================

router.post(
  "/:id/submit",
  requireAuth,
  async (req, res) => {
    try {
      const testId =
        String(
          req.params.id || ""
        )
          .trim()
          .toLowerCase();

      const answers =
        req.body &&
        typeof req.body.answers ===
          "object" &&
        req.body.answers !== null
          ? req.body.answers
          : {};

      // NEVER trust a userId sent by the browser.
      // The result is always saved for the logged-in user.
      const userId = req.user.id;

      const lang =
        req.query.lang === "hi"
          ? "hi"
          : "en";

      if (!testId) {
        return res.status(400).json({
          error:
            "Test ID is required",
        });
      }

      // -----------------------------------------
      // FIND TEST
      // -----------------------------------------

      const test =
        await Test.findOne({
          testId,
          isActive: true,
        }).lean();

      if (!test) {
        return res.status(404).json({
          error:
            "Test not found",
        });
      }

      // -----------------------------------------
      // LOAD QUESTIONS WITH CORRECT ANSWERS
      // Correct answers sirf backend use karega
      // -----------------------------------------

      const questions =
        await Question.find({
          testId,
        })
          .sort({
            questionId: 1,
          })
          .lean();

      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      // -----------------------------------------
      // CHECK ANSWERS
      // -----------------------------------------

      const review =
        questions.map(
          (question) => {
            const useHindi =
              lang === "hi" &&
              Boolean(
                String(
                  question.questionTextHi ||
                    ""
                ).trim()
              );

            const questionText =
              useHindi
                ? question.questionTextHi
                : question.questionText;

            const options =
              useHindi
                ? [
                    question.optionAHi,
                    question.optionBHi,
                    question.optionCHi,
                    question.optionDHi,
                  ]
                : [
                    question.optionA,
                    question.optionB,
                    question.optionC,
                    question.optionD,
                  ];

            const rawSelected =
              answers[
                question.questionId
              ];

            const selected =
              rawSelected === undefined ||
              rawSelected === null ||
              rawSelected === ""
                ? null
                : Number(
                    rawSelected
                  );

            const correctAnswer =
              Number(
                question.correctAnswer
              );

            let status =
              "unanswered";

            if (
              selected === null ||
              !Number.isInteger(
                selected
              )
            ) {
              unansweredCount++;
            } else if (
              selected ===
              correctAnswer
            ) {
              correctCount++;
              status = "correct";
            } else {
              wrongCount++;
              status = "wrong";
            }

            return {
              questionId:
                question.questionId,

              question:
                questionText,

              options,

              selected,

              correctAnswer,

              status,
            };
          }
        );

      // -----------------------------------------
      // CALCULATE SCORE
      // -----------------------------------------

      const marksPerCorrect =
        Number(
          test.marksPerCorrect
        ) || 0;

      const negativeMarking =
        Number(
          test.negativeMarking
        ) || 0;

      const score =
        correctCount *
          marksPerCorrect -
        wrongCount *
          negativeMarking;

      const totalMarks =
        questions.length *
        marksPerCorrect;

      const roundedScore =
        Math.round(
          score * 100
        ) / 100;

      // -----------------------------------------
      // GENERATE NEXT RESULT ID
      // -----------------------------------------

      const lastResult =
        await Result.findOne({})
          .sort({
            resultId: -1,
          })
          .select("resultId")
          .lean();

      const newResultId =
        (Number(
          lastResult?.resultId
        ) || 0) + 1;

      const cleanUserId =
        userId === null ||
        userId === undefined
          ? null
          : String(
              userId
            ).trim() || null;

      const submittedAt =
        new Date();

      // -----------------------------------------
      // SAVE RESULT
      // -----------------------------------------

      const savedResult =
        await Result.create({
          resultId:
            newResultId,

          testId:
            test.testId,

          testTitle:
            test.title,

          userId:
            cleanUserId,

          correctCount,

          wrongCount,

          unansweredCount,

          score:
            roundedScore,

          totalMarks,

          review,

          submittedAt,
        });

      // -----------------------------------------
      // RESPONSE
      // Same structure as old API
      // -----------------------------------------

      return res.json({
        resultId:
          savedResult.resultId,

        testId:
          savedResult.testId,

        testTitle:
          savedResult.testTitle,

        userId:
          savedResult.userId,

        submittedAt:
          savedResult.submittedAt,

        correctCount:
          savedResult.correctCount,

        wrongCount:
          savedResult.wrongCount,

        unansweredCount:
          savedResult.unansweredCount,

        score:
          savedResult.score,

        totalMarks:
          savedResult.totalMarks,

        review:
          savedResult.review,
      });
    } catch (error) {
      console.error(
        "MongoDB submit test error:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          error:
            "Result could not be saved. Please submit again.",
        });
      }

      return res.status(500).json({
        error:
          "Failed to submit test",
      });
    }
  }
);

module.exports = router;