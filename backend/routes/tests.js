const express = require("express");

const Test =
  require("../models/Test");

const Question =
  require("../models/Question");

const Result =
  require("../models/Result");

const User =
  require("../models/User");
const {
  accuracyOf,
  loadFirstAttempts,
  percentile,
  round2,
  summarise,
} = require("../utils/testAnalytics");
const requireAuth =
  require("../middleware/requireAuth");

const requireTestAccess =
  require("../middleware/requireTestAccess");

const router =
  express.Router();

/* =====================================================
   GET /api/tests

   Public test list.

   Examples:

   /api/tests
   = all active tests

   /api/tests?free=true
   = free tests only

   /api/tests?free=false
   = premium tests only
===================================================== */

router.get(
  "/",
  async (req, res) => {
    try {
      const filter = {
        isActive: true,
      };

      // ==============================
      // FREE FILTER
      // ==============================

      if (
        req.query.free === "true"
      ) {
        filter.isFree = true;
      }

      if (
        req.query.free === "false"
      ) {
        filter.isFree = {
          $ne: true,
        };
      }

      // ==============================
      // LOAD TESTS
      // ==============================

      const testDocuments =
        await Test.find(filter)
          .sort({
            topCategory: 1,
            subExam: 1,
            title: 1,
          })
          .lean();

      // ==============================
      // QUESTION COUNTS
      // ==============================

      const testIds =
        testDocuments.map(
          (test) =>
            test.testId
        );

      let questionCountMap =
        new Map();

      // testId -> ["en", "hi"]  (languages students can use)
      const languageMap =
        new Map();

      if (testIds.length > 0) {
        const questionCounts =
          await Question.aggregate([
            {
              $match: {
                testId: {
                  $in: testIds,
                },
              },
            },

            {
              $group: {
                _id: "$testId",

                totalQuestions: {
                  $sum: 1,
                },

                /*
                  Language of each question:
                    Hindi text empty         -> English only
                    Hindi text same as main  -> Hindi only
                                                (bulk import copies it)
                    Hindi text different     -> both languages
                */
                englishOnlyCount: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          {
                            $strLenCP: {
                              $ifNull: ["$questionTextHi", ""],
                            },
                          },
                          0,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },

                hindiOnlyCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $strLenCP: {
                                  $ifNull: ["$questionTextHi", ""],
                                },
                              },
                              0,
                            ],
                          },
                          { $eq: ["$questionTextHi", "$questionText"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ]);

        questionCountMap =
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

        questionCounts.forEach((item) => {
          const total = Number(item.totalQuestions) || 0;
          const englishOnly = Number(item.englishOnlyCount) || 0;
          const hindiOnly = Number(item.hindiOnlyCount) || 0;
          const both = total - englishOnly - hindiOnly;

          const languages = [];

          if (englishOnly + both > 0) languages.push("en");
          if (hindiOnly + both > 0) languages.push("hi");

          languageMap.set(String(item._id), languages);
        });
      }

      // ==============================
      // RESPONSE
      // ==============================

      const tests =
        testDocuments.map(
          (test) => ({
            id:
              test.testId,

            testId:
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
            testCategory: test.testCategory || "",

            subExam:
              test.subExam,

            isFree:
              test.isFree === true,

            testType:
              test.isFree === true
                ? "Free Test"
                : "Mock Test",

            totalQuestions:
              questionCountMap.get(
                String(
                  test.testId
                )
              ) || 0,

            languages:
              languageMap.get(String(test.testId)) || [],

            createdAt: test.createdAt,
          })
        );

      return res.json(
        tests
      );
    } catch (error) {
      console.error(
        "MongoDB public tests error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to load tests",
        });
    }
  }
);

/* =====================================================
   GET /api/tests/results/:userId

   My Results

   Free + premium results both returned.
===================================================== */

/* =====================================================
   GET /api/tests/result/:resultId
   Full result page data for the logged-in student:
   overview, comparison with topper / average, and the solutions.

   Rank, percentile, topper and average always use the student's
   FIRST attempt of this test (later attempts only change the
   solutions that are shown).
===================================================== */
router.get(
  "/result/:resultId",
  requireAuth,
  async (req, res) => {
    try {
      const resultId = Number(req.params.resultId);

      if (!Number.isInteger(resultId) || resultId < 1) {
        return res.status(400).json({ error: "Invalid result." });
      }

      const result = await Result.findOne({ resultId }).lean();

      if (!result) {
        return res.status(404).json({ error: "Result not found." });
      }

      if (String(result.userId) !== String(req.user.id)) {
        return res
          .status(403)
          .json({ error: "This result belongs to another account." });
      }

      const testId = result.testId;

      const [test, questions, firstAttempts, myAttempts] =
        await Promise.all([
          Test.findOne({ testId })
            .select(
              "title subject duration marksPerCorrect negativeMarking isFree"
            )
            .lean(),
          Question.find({ testId }).sort({ questionId: 1 }).lean(),
          loadFirstAttempts(testId),
          Result.find({ testId, userId: String(req.user.id) })
            .sort({ submittedAt: 1, resultId: 1 })
            .select("resultId score submittedAt")
            .lean(),
        ]);

      const attemptNumber =
        myAttempts.findIndex((a) => a.resultId === resultId) + 1 || 1;

      const official =
        firstAttempts.find((r) => r.userId === String(req.user.id)) || null;

      const total = firstAttempts.length;
      const { topper, average } = summarise(firstAttempts);

      // how many students answered each question correctly (first attempts)
      const correctBy = {};

      if (firstAttempts.length) {
        const reviews = await Result.find({
          resultId: { $in: firstAttempts.map((r) => r.resultId) },
        })
          .select("review.questionId review.status")
          .lean();

        reviews.forEach((doc) => {
          (doc.review || []).forEach((item) => {
            if (item.status === "correct") {
              correctBy[item.questionId] =
                (correctBy[item.questionId] || 0) + 1;
            }
          });
        });
      }

      const byId = new Map(questions.map((q) => [q.questionId, q]));
      const hasTimes =
        result.questionTimes && typeof result.questionTimes === "object";

      const solutions = (result.review || []).map((item, index) => {
        const q = byId.get(item.questionId);

        return {
          number: index + 1,
          questionId: item.questionId,
          question: {
            en: q ? q.questionText : item.question || "",
            hi: q ? q.questionTextHi || "" : "",
          },
          options: {
            en: q
              ? [q.optionA, q.optionB, q.optionC, q.optionD]
              : item.options || [],
            hi: q
              ? [q.optionAHi, q.optionBHi, q.optionCHi, q.optionDHi]
              : [],
          },
          selected: item.selected ?? null,
          correctAnswer: Number(q?.correctAnswer ?? item.correctAnswer),
          status: item.status,
          explanation: {
            en: q?.explanationEn || "",
            hi: q?.explanationHi || "",
          },
          timeSpent: hasTimes
            ? Number(result.questionTimes[String(item.questionId)]) || 0
            : null,
          percentCorrect: total
            ? round2(((correctBy[item.questionId] || 0) / total) * 100)
            : null,
        };
      });

      // the language switch only makes sense when Hindi really differs
      const bilingual = solutions.some(
        (s) => s.question.hi && s.question.hi !== s.question.en
      );

      return res.json({
        success: true,

        test: {
          testId,
          title: result.testTitle || test?.title || "",
          subject: test?.subject || "",
          isFree: test?.isFree === true,
          durationSeconds: Number(test?.duration) || 0,
          marksPerCorrect: Number(test?.marksPerCorrect) || 0,
          negativeMarking: Number(test?.negativeMarking) || 0,
          totalQuestions: solutions.length,
        },

        // the attempt that is being viewed
        attempt: {
          resultId: result.resultId,
          attemptNumber,
          totalAttempts: myAttempts.length,
          isFirstAttempt: attemptNumber === 1,
          firstResultId: myAttempts[0]?.resultId || result.resultId,
          score: result.score,
          totalMarks: result.totalMarks,
          correct: result.correctCount,
          wrong: result.wrongCount,
          unanswered: result.unansweredCount,
          attempted: result.correctCount + result.wrongCount,
          accuracy: accuracyOf(result.correctCount, result.wrongCount),
          timeTakenSeconds: result.timeTakenSeconds ?? null,
          submittedAt: result.submittedAt,
        },

        // the OFFICIAL result = first attempt (rank counts only this)
        official: official && {
          resultId: official.resultId,
          score: official.score,
          totalMarks: official.totalMarks,
          correct: official.correct,
          wrong: official.wrong,
          unanswered: official.unanswered,
          attempted: official.correct + official.wrong,
          accuracy: official.accuracy,
          timeTakenSeconds: official.timeTakenSeconds,
          rank: official.rank,
          totalParticipants: total,
          percentile: percentile(official.rank, total),
        },

        comparison: {
          topper: topper && {
            score: topper.score,
            accuracy: topper.accuracy,
            correct: topper.correct,
            wrong: topper.wrong,
            timeTakenSeconds: topper.timeTakenSeconds,
          },
          average,
        },

        bilingual,
        solutions,
      });
    } catch (error) {
      console.error("Result detail error:", error);
      return res.status(500).json({ error: "Failed to load the result." });
    }
  }
);

/* =====================================================
   GET /api/tests/:testId/leaderboard
   Leaderboard of ONE test. Only each student's first attempt counts.
===================================================== */
router.get(
  "/:testId/leaderboard",
  requireAuth,
  async (req, res) => {
    try {
      const testId = String(req.params.testId || "")
        .trim()
        .toLowerCase();

      const rows = await loadFirstAttempts(testId);

      const TOP = 10;
      const me = String(req.user.id);
      const myIndex = rows.findIndex((r) => r.userId === me);

      const show = rows.slice(0, TOP);

      if (myIndex >= TOP) show.push(rows[myIndex]);

      const users = await User.find({
        _id: { $in: show.map((r) => r.userId) },
      })
        .select("fullName")
        .lean();

      const nameOf = new Map(
        users.map((u) => [String(u._id), u.fullName || "Student"])
      );

      const toEntry = (r) => ({
        rank: r.rank,
        name: nameOf.get(r.userId) || "Student",
        score: r.score,
        totalMarks: r.totalMarks,
        accuracy: r.accuracy,
        timeTakenSeconds: r.timeTakenSeconds,
        isMe: r.userId === me,
      });

      return res.json({
        success: true,
        testId,
        totalParticipants: rows.length,
        myRank: myIndex >= 0 ? rows[myIndex].rank : null,
        entries: rows.slice(0, TOP).map(toEntry),
        // your row when you are outside the top 10
        me: myIndex >= TOP ? toEntry(rows[myIndex]) : null,
      });
    } catch (error) {
      console.error("Test leaderboard error:", error);
      return res.status(500).json({ error: "Failed to load the leaderboard." });
    }
  }
);

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
        return res
          .status(400)
          .json({
            error:
              "User ID is required",
          });
      }

      // ==============================
      // USER CAN ONLY READ OWN RESULT
      // ==============================

      if (
        userId !==
        req.user.id
      ) {
        return res
          .status(403)
          .json({
            error:
              "You can only view your own results.",
          });
      }

      // ==============================
      // LOAD RESULTS
      // ==============================

      const resultDocuments =
        await Result.find({
          userId,
        })
          .sort({
            submittedAt: -1,
          })
          .lean();

      // ==============================
      // FIND TEST METADATA
      // ==============================

      const testIds = [
        ...new Set(
          resultDocuments
            .map(
              (result) =>
                result.testId
            )
            .filter(Boolean)
        ),
      ];

      const testDocuments =
        testIds.length
          ? await Test.find({
              testId: {
                $in: testIds,
              },
            })
              .select(
                [
                  "testId",
                  "category",
                  "subject",
                  "duration",
                  "topCategory",
                  "testCategory",
                  "subExam",
                  "isFree",
                ].join(" ")
              )
              .lean()
          : [];

      const testMap =
        new Map(
          testDocuments.map(
            (test) => [
              String(
                test.testId
              ),
              test,
            ]
          )
        );

      // ==============================
      // FORMAT RESULTS
      // ==============================

      const results =
        resultDocuments.map(
          (result) => {
            const test =
              testMap.get(
                String(
                  result.testId
                )
              );

            const isFree =
              test?.isFree === true;

            return {
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

              isFree,

              testType:
                isFree
                  ? "Free Test"
                  : "Mock Test",

              type:
                isFree
                  ? "Free Test"
                  : "Mock Test",

              exam:
                test?.subExam ||
                test?.category ||
                "General",

              examName:
                test?.subExam ||
                test?.category ||
                "General",

              category:
                test?.topCategory ||
                test?.category ||
                "General",

              testCategory:
                test?.testCategory || "",

              subject:
                test?.subject ||
                "",

              duration:
                test?.duration
                  ? Math.ceil(
                      Number(
                        test.duration
                      ) / 60
                    )
                  : null,
            };
          }
        );

      return res.json(
        results
      );
    } catch (error) {
      console.error(
        "MongoDB test history error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to load results",
        });
    }
  }
);

/* =====================================================
   GET /api/tests/:id?lang=en|hi

   Login required.

   FREE TEST:
   subscription not required.

   PREMIUM TEST:
   subscription required.

   Correct answers are NOT sent to frontend.
===================================================== */

router.get(
  "/:id",

  requireAuth,

  requireTestAccess,

  async (req, res) => {
    try {
      /*
        requireTestAccess already
        loaded the test.
      */

      const test =
        req.testDocument;

      const testId =
        test.testId;

      const lang =
        req.query.lang === "hi"
          ? "hi"
          : "en";

      // ==============================
      // LOAD QUESTIONS
      // ==============================

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

      // ==============================
      // FORMAT LANGUAGE
      // ==============================

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

      // ==============================
      // RESPONSE
      // ==============================

      return res.json({
        id:
          test.testId,

        testId:
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
        testCategory: test.testCategory || "",

        subExam:
          test.subExam,

        isFree:
          test.isFree === true,

        testType:
          test.isFree === true
            ? "Free Test"
            : "Mock Test",

        language:
          lang,

        questions,
      });
    } catch (error) {
      console.error(
        "MongoDB load test error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to load test",
        });
    }
  }
);

/* =====================================================
   POST /api/tests/:id/submit?lang=en|hi

   Login required.

   Free tests:
   no subscription required.

   Premium tests:
   subscription required.

   Score is calculated ONLY on backend.
===================================================== */

router.post(
  "/:id/submit",

  requireAuth,

  requireTestAccess,

  async (req, res) => {
    try {
      const test =
        req.testDocument;

      const testId =
        test.testId;

      // ==============================
      // ANSWERS
      // ==============================

      const answers =
        req.body &&
        typeof req.body.answers ===
          "object" &&
        req.body.answers !==
          null
          ? req.body.answers
          : {};

      /*
        IMPORTANT:

        Browser-sent userId is ignored.
        Logged-in user's ID is used.
      */

      const userId =
        req.user.id;

      const lang =
        req.query.lang === "hi"
          ? "hi"
          : "en";

      // ==============================
      // LOAD QUESTIONS + CORRECT ANSWERS
      // ==============================

      const questions =
        await Question.find({
          testId,
        })
          .sort({
            questionId: 1,
          })
          .lean();

      if (
        questions.length === 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "No questions available in this test",
          });
      }

      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount =
        0;

      // ==============================
      // CHECK ANSWERS
      // ==============================

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

            /*
              Frontend sends:

              1 = A
              2 = B
              3 = C
              4 = D
            */

            const rawSelected =
              answers[
                question.questionId
              ];

            const selected =
              rawSelected ===
                undefined ||
              rawSelected ===
                null ||
              rawSelected ===
                ""
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
              unansweredCount +=
                1;
            } else if (
              selected ===
              correctAnswer
            ) {
              correctCount +=
                1;

              status =
                "correct";
            } else {
              wrongCount += 1;

              status =
                "wrong";
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

      // ==============================
      // CALCULATE SCORE
      // ==============================

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

      // ==============================
      // RESULT ID
      // ==============================

      const lastResult =
        await Result.findOne({})
          .sort({
            resultId: -1,
          })
          .select(
            "resultId"
          )
          .lean();

      const newResultId =
        (Number(
          lastResult?.resultId
        ) || 0) + 1;

      // time spent (sent by the test page; clamped so it cannot be abused)
      const durationLimit =
        Math.max(Number(test.duration) || 0, 0);

      const toSeconds = (value) => {
        const n = Math.round(Number(value));
        if (!Number.isFinite(n) || n < 0) return null;
        return durationLimit > 0 ? Math.min(n, durationLimit) : n;
      };

      const timeTakenSeconds =
        toSeconds(req.body?.timeTakenSeconds);

      let questionTimes;

      if (
        req.body?.questionTimes &&
        typeof req.body.questionTimes === "object"
      ) {
        questionTimes = {};

        questions.forEach((q) => {
          const secs = toSeconds(
            req.body.questionTimes[q.questionId]
          );

          if (secs !== null) {
            questionTimes[String(q.questionId)] = secs;
          }
        });
      }

      const cleanUserId =
        userId === null ||
        userId === undefined
          ? null
          : String(
              userId
            ).trim() || null;

      const submittedAt =
        new Date();

      // ==============================
      // SAVE RESULT
      // ==============================

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


          timeTakenSeconds,

          questionTimes,
          submittedAt,
        });

      // ==============================
      // RESPONSE
      // ==============================

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

        isFree:
          test.isFree === true,

        testType:
          test.isFree === true
            ? "Free Test"
            : "Mock Test",

        exam:
          test.subExam ||
          test.category,

        category:
          test.topCategory ||
          test.category,
      });
    } catch (error) {
      console.error(
        "MongoDB submit test error:",
        error
      );

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            error:
              "Result could not be saved. Please submit again.",
          });
      }

      return res
        .status(500)
        .json({
          error:
            "Failed to submit test",
        });
    }
  }
);

module.exports =
  router;