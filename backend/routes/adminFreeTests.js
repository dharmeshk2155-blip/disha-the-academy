const express = require("express");

const Test = require("../models/Test");
const Question = require("../models/Question");
const { createBulkImportHandler } = require("../utils/bulkQuestions");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

/* =====================================================
   ADMIN SECURITY
===================================================== */

// Same login as every other admin page:
//   Authorization: Bearer <admin token>   (JWT)
// The old ADMIN_KEY header is no longer used.
router.use(requireAdmin);

/* =====================================================
   HELPERS
===================================================== */

function clean(value) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeTestId(value) {
  return clean(value)
    .toLowerCase();
}

function formatTest(
  test,
  totalQuestions = 0
) {
  return {
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

    subExam:
      test.subExam,

    isFree:
      test.isFree === true,

    isActive:
      test.isActive !== false,

    totalQuestions:
      Number(
        totalQuestions
      ) || 0,

    createdAt:
      test.createdAt,

    updatedAt:
      test.updatedAt,
  };
}

function validateTestBody(body) {
  const testId =
    normalizeTestId(
      body.testId
    );

  const category =
    clean(
      body.category
    );

  const title =
    clean(
      body.title
    );

  const subject =
    clean(
      body.subject
    );

  const topCategory =
    clean(
      body.topCategory
    );

  const subExam =
    clean(
      body.subExam
    );

  const duration =
    Number(
      body.duration
    );

  const marksPerCorrect =
    Number(
      body.marksPerCorrect
    );

  const negativeMarking =
    Number(
      body.negativeMarking
    );

  if (
    !testId ||
    !category ||
    !title ||
    !subject ||
    !topCategory ||
    !subExam
  ) {
    return {
      error:
        "Please fill all required fields.",
    };
  }

  if (
    !/^[a-z0-9-]+$/.test(
      testId
    )
  ) {
    return {
      error:
        "Test ID can contain only lowercase letters, numbers and hyphens.",
    };
  }

  if (
    !Number.isFinite(
      duration
    ) ||
    duration <= 0
  ) {
    return {
      error:
        "Duration must be greater than 0.",
    };
  }

  if (
    !Number.isFinite(
      marksPerCorrect
    ) ||
    marksPerCorrect <= 0
  ) {
    return {
      error:
        "Marks per correct answer must be greater than 0.",
    };
  }

  if (
    !Number.isFinite(
      negativeMarking
    ) ||
    negativeMarking < 0
  ) {
    return {
      error:
        "Negative marking cannot be less than 0.",
    };
  }

  return {
    values: {
      testId,
      category,
      title,
      subject,
      duration:
        Math.round(
          duration
        ),
      marksPerCorrect,
      negativeMarking,
      topCategory,
      subExam,

      isActive:
        body.isActive !==
        false,
    },
  };
}

/* =====================================================
   GET /api/admin/free-tests

   ALL FREE TESTS
===================================================== */

router.get(
  "/",
  async (req, res) => {
    try {
      const tests =
        await Test.find({
          isFree: true,
        })
          .sort({
            topCategory: 1,
            subExam: 1,
            title: 1,
          })
          .lean();

      const testIds =
        tests.map(
          (test) =>
            test.testId
        );

      let countMap =
        new Map();

      if (
        testIds.length > 0
      ) {
        const counts =
          await Question.aggregate([
            {
              $match: {
                testId: {
                  $in:
                    testIds,
                },
              },
            },

            {
              $group: {
                _id:
                  "$testId",

                count: {
                  $sum: 1,
                },
              },
            },
          ]);

        countMap =
          new Map(
            counts.map(
              (item) => [
                String(
                  item._id
                ),
                Number(
                  item.count
                ) || 0,
              ]
            )
          );
      }

      const formatted =
        tests.map(
          (test) =>
            formatTest(
              test,
              countMap.get(
                String(
                  test.testId
                )
              ) || 0
            )
        );

      return res.json({
        success: true,
        count:
          formatted.length,
        tests:
          formatted,
      });
    } catch (error) {
      console.error(
        "Admin free tests load error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load free tests.",
        });
    }
  }
);

/* =====================================================
   POST /api/admin/free-tests

   CREATE FREE TEST
===================================================== */

router.post(
  "/",
  async (req, res) => {
    try {
      const validation =
        validateTestBody(
          req.body || {}
        );

      if (
        validation.error
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              validation.error,
          });
      }

      const values =
        validation.values;

      const existing =
        await Test.findOne({
          testId:
            values.testId,
        }).lean();

      if (existing) {
        return res
          .status(409)
          .json({
            success:
              false,
            message:
              "A test with this Test ID already exists.",
          });
      }

      const created =
        await Test.create({
          ...values,

          /*
            IMPORTANT:
            Admin panel se create hone wala
            har test FREE hoga.
          */
          isFree: true,
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Free test created successfully.",

          test:
            formatTest(
              created.toObject(),
              0
            ),
        });
    } catch (error) {
      console.error(
        "Admin create free test error:",
        error
      );

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success:
              false,
            message:
              "Test ID already exists.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to create free test.",
        });
    }
  }
);

/* =====================================================
   PUT /api/admin/free-tests/:testId

   UPDATE FREE TEST
===================================================== */

router.put(
  "/:testId",
  async (req, res) => {
    try {
      const testId =
        normalizeTestId(
          req.params.testId
        );

      const existing =
        await Test.findOne({
          testId,
          isFree: true,
        });

      if (!existing) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Free test not found.",
          });
      }

      /*
        Edit ke time Test ID
        change nahi karenge.
      */

      const validation =
        validateTestBody({
          ...req.body,
          testId,
        });

      if (
        validation.error
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              validation.error,
          });
      }

      const values =
        validation.values;

      existing.category =
        values.category;

      existing.title =
        values.title;

      existing.subject =
        values.subject;

      existing.duration =
        values.duration;

      existing.marksPerCorrect =
        values.marksPerCorrect;

      existing.negativeMarking =
        values.negativeMarking;

      existing.topCategory =
        values.topCategory;

      existing.subExam =
        values.subExam;

      existing.isActive =
        values.isActive;

      /*
        Isko free hi rehna hai.
      */
      existing.isFree =
        true;

      await existing.save();

      const totalQuestions =
        await Question.countDocuments({
          testId,
        });

      return res.json({
        success: true,

        message:
          "Free test updated successfully.",

        test:
          formatTest(
            existing.toObject(),
            totalQuestions
          ),
      });
    } catch (error) {
      console.error(
        "Admin update free test error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update free test.",
        });
    }
  }
);

/* =====================================================
   DELETE /api/admin/free-tests/:testId

   DELETE TEST + QUESTIONS
===================================================== */

router.delete(
  "/:testId",
  async (req, res) => {
    try {
      const testId =
        normalizeTestId(
          req.params.testId
        );

      const test =
        await Test.findOne({
          testId,
          isFree: true,
        }).lean();

      if (!test) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Free test not found.",
          });
      }

      const questionResult =
        await Question.deleteMany({
          testId,
        });

      await Test.deleteOne({
        testId,
        isFree: true,
      });

      return res.json({
        success: true,

        message:
          "Free test deleted successfully.",

        testId,

        deletedQuestions:
          questionResult.deletedCount ||
          0,
      });
    } catch (error) {
      console.error(
        "Admin delete free test error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to delete free test.",
        });
    }
  }
);

/* =====================================================
   GET QUESTIONS
===================================================== */

router.get(
  "/:testId/questions",

  async (req, res) => {
    try {
      const testId =
        normalizeTestId(
          req.params.testId
        );

      const test =
        await Test.findOne({
          testId,
          isFree: true,
        }).lean();

      if (!test) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Free test not found.",
          });
      }

      const questions =
        await Question.find({
          testId,
        })
          .sort({
            questionId: 1,
          })
          .lean();

      return res.json({
        success: true,

        test:
          formatTest(
            test,
            questions.length
          ),

        count:
          questions.length,

        questions:
          questions.map(
            (question) => ({
              questionId:
                question.questionId,

              testId:
                question.testId,

              questionText:
                question.questionText,

              optionA:
                question.optionA,

              optionB:
                question.optionB,

              optionC:
                question.optionC,

              optionD:
                question.optionD,

              correctAnswer:
                Number(
                  question.correctAnswer
                ),

              questionTextHi:
                question.questionTextHi ||
                "",

              optionAHi:
                question.optionAHi ||
                "",

              optionBHi:
                question.optionBHi ||
                "",

              optionCHi:
                question.optionCHi ||
                "",

              optionDHi:
                question.optionDHi ||
                "",
            })
          ),
      });
    } catch (error) {
      console.error(
        "Admin free questions load error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load questions.",
        });
    }
  }
);

/* =====================================================
   BULK IMPORT QUESTIONS (EXCEL) - FREE TEST
===================================================== */
router.post(
  "/:testId/questions/bulk",
  createBulkImportHandler({ mode: "free" })
);

/* =====================================================
   ADD QUESTION
===================================================== */

router.post(
  "/:testId/questions",

  async (req, res) => {
    try {
      const testId =
        normalizeTestId(
          req.params.testId
        );

      const test =
        await Test.findOne({
          testId,
          isFree: true,
        }).lean();

      if (!test) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Free test not found.",
          });
      }

      const {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,

        questionTextHi,
        optionAHi,
        optionBHi,
        optionCHi,
        optionDHi,
      } =
        req.body || {};

      const cleanQuestion =
        clean(
          questionText
        );

      const cleanA =
        clean(optionA);

      const cleanB =
        clean(optionB);

      const cleanC =
        clean(optionC);

      const cleanD =
        clean(optionD);

      const answer =
        Number(
          correctAnswer
        );

      if (
        !cleanQuestion ||
        !cleanA ||
        !cleanB ||
        !cleanC ||
        !cleanD
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Question and all four English options are required.",
          });
      }

      if (
        !Number.isInteger(
          answer
        ) ||
        answer < 1 ||
        answer > 4
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Correct answer must be between 1 and 4.",
          });
      }

      /*
        Global maximum Question ID
        use kar rahe hain taaki duplicate
        questionId ka risk kam rahe.
      */

      const lastQuestion =
        await Question.findOne({})
          .sort({
            questionId: -1,
          })
          .select(
            "questionId"
          )
          .lean();

      const newQuestionId =
        (Number(
          lastQuestion
            ?.questionId
        ) || 0) + 1;

      const created =
        await Question.create({
          questionId:
            newQuestionId,

          testId,

          questionText:
            cleanQuestion,

          optionA:
            cleanA,

          optionB:
            cleanB,

          optionC:
            cleanC,

          optionD:
            cleanD,

          correctAnswer:
            answer,

          questionTextHi:
            clean(
              questionTextHi
            ),

          optionAHi:
            clean(
              optionAHi
            ),

          optionBHi:
            clean(
              optionBHi
            ),

          optionCHi:
            clean(
              optionCHi
            ),

          optionDHi:
            clean(
              optionDHi
            ),
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Question added successfully.",

          question:
            created,
        });
    } catch (error) {
      console.error(
        "Admin add free question error:",
        error
      );

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success:
              false,
            message:
              "Question could not be created because of a duplicate ID. Try again.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to add question.",
        });
    }
  }
);

/* =====================================================
   UPDATE QUESTION
===================================================== */

router.put(
  "/:testId/questions/:questionId",

  async (req, res) => {
    try {
      const testId =
        normalizeTestId(
          req.params.testId
        );

      const questionId =
        Number(
          req.params
            .questionId
        );

      const test =
        await Test.findOne({
          testId,
          isFree: true,
        }).lean();

      if (!test) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Free test not found.",
          });
      }

      if (
        !Number.isFinite(
          questionId
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Invalid question ID.",
          });
      }

      const {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,

        questionTextHi,
        optionAHi,
        optionBHi,
        optionCHi,
        optionDHi,
      } =
        req.body || {};

      const answer =
        Number(
          correctAnswer
        );

      if (
        !clean(
          questionText
        ) ||
        !clean(optionA) ||
        !clean(optionB) ||
        !clean(optionC) ||
        !clean(optionD)
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Question and all four English options are required.",
          });
      }

      if (
        !Number.isInteger(
          answer
        ) ||
        answer < 1 ||
        answer > 4
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Correct answer must be between 1 and 4.",
          });
      }

      const updated =
        await Question.findOneAndUpdate(
          {
            testId,
            questionId,
          },

          {
            $set: {
              questionText:
                clean(
                  questionText
                ),

              optionA:
                clean(
                  optionA
                ),

              optionB:
                clean(
                  optionB
                ),

              optionC:
                clean(
                  optionC
                ),

              optionD:
                clean(
                  optionD
                ),

              correctAnswer:
                answer,

              questionTextHi:
                clean(
                  questionTextHi
                ),

              optionAHi:
                clean(
                  optionAHi
                ),

              optionBHi:
                clean(
                  optionBHi
                ),

              optionCHi:
                clean(
                  optionCHi
                ),

              optionDHi:
                clean(
                  optionDHi
                ),
            },
          },

          {
            new: true,
            runValidators:
              true,
          }
        );

      if (!updated) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Question not found.",
          });
      }

      return res.json({
        success: true,

        message:
          "Question updated successfully.",

        question:
          updated,
      });
    } catch (error) {
      console.error(
        "Admin update free question error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update question.",
        });
    }
  }
);

/* =====================================================
   DELETE QUESTION
===================================================== */

router.delete(
  "/:testId/questions/:questionId",

  async (req, res) => {
    try {
      const testId =
        normalizeTestId(
          req.params.testId
        );

      const questionId =
        Number(
          req.params
            .questionId
        );

      const test =
        await Test.findOne({
          testId,
          isFree: true,
        }).lean();

      if (!test) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Free test not found.",
          });
      }

      const deleted =
        await Question.deleteOne({
          testId,
          questionId,
        });

      if (
        deleted.deletedCount !==
        1
      ) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Question not found.",
          });
      }

      return res.json({
        success: true,

        message:
          "Question deleted successfully.",

        questionId,
      });
    } catch (error) {
      console.error(
        "Admin delete free question error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to delete question.",
        });
    }
  }
);

module.exports =
  router;