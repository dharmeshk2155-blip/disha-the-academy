const express = require("express");
const { sql, connectDB } = require("../db"); // adjust path if db.js is elsewhere

const router = express.Router();

// --- GET /api/tests ---
// Returns metadata only (no questions) grouped by category, for the selection page
router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT
        t.TestId AS id,
        t.Category AS category,
        t.Title AS title,
        t.Subject AS subject,
        t.Duration AS duration,
        t.MarksPerCorrect AS marksPerCorrect,
        t.NegativeMarking AS negativeMarking,
        t.TopCategory AS topCategory,
        t.SubExam AS subExam,
        (SELECT COUNT(*) FROM Questions q WHERE q.TestId = t.TestId) AS totalQuestions
      FROM Tests t
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load tests" });
  }
});

// --- GET /api/tests/:id?lang=en|hi ---
// Returns full test WITHOUT correct answers (so students can't cheat via devtools)
router.get("/:id", async (req, res) => {
  try {
    const pool = await connectDB();
    const lang = req.query.lang === "hi" ? "hi" : "en";

    const testResult = await pool
      .request()
      .input("id", sql.NVarChar, req.params.id)
      .query("SELECT * FROM Tests WHERE TestId = @id");

    const test = testResult.recordset[0];
    if (!test) return res.status(404).json({ error: "Test not found" });

    const questionsResult = await pool
      .request()
      .input("id", sql.NVarChar, req.params.id)
      .query(
        "SELECT QuestionId, QuestionText, OptionA, OptionB, OptionC, OptionD, QuestionTextHi, OptionAHi, OptionBHi, OptionCHi, OptionDHi FROM Questions WHERE TestId = @id ORDER BY QuestionId"
      );

    const questions = questionsResult.recordset.map((q) => {
      if (lang === "hi" && q.QuestionTextHi) {
        return {
          id: q.QuestionId,
          question: q.QuestionTextHi,
          options: [q.OptionAHi, q.OptionBHi, q.OptionCHi, q.OptionDHi],
        };
      }
      // fallback to English if Hindi not available for this question
      return {
        id: q.QuestionId,
        question: q.QuestionText,
        options: [q.OptionA, q.OptionB, q.OptionC, q.OptionD],
      };
    });

    res.json({
      id: test.TestId,
      category: test.Category,
      title: test.Title,
      subject: test.Subject,
      duration: test.Duration,
      marksPerCorrect: test.MarksPerCorrect,
      negativeMarking: test.NegativeMarking,
      language: lang,
      questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load test" });
  }
});

// --- POST /api/tests/:id/submit?lang=en|hi ---
// body: { userId (optional), answers: { [questionId]: selectedOptionIndex } }
router.post("/:id/submit", async (req, res) => {
  try {
    const pool = await connectDB();
    const { answers = {}, userId = null } = req.body;
    const lang = req.query.lang === "hi" ? "hi" : "en";

    const testResult = await pool
      .request()
      .input("id", sql.NVarChar, req.params.id)
      .query("SELECT * FROM Tests WHERE TestId = @id");

    const test = testResult.recordset[0];
    if (!test) return res.status(404).json({ error: "Test not found" });

    const questionsResult = await pool
      .request()
      .input("id", sql.NVarChar, req.params.id)
      .query(
        "SELECT QuestionId, QuestionText, OptionA, OptionB, OptionC, OptionD, QuestionTextHi, OptionAHi, OptionBHi, OptionCHi, OptionDHi, CorrectAnswer FROM Questions WHERE TestId = @id ORDER BY QuestionId"
      );

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const review = questionsResult.recordset.map((q) => {
      const useHindi = lang === "hi" && q.QuestionTextHi;
      const questionText = useHindi ? q.QuestionTextHi : q.QuestionText;
      const options = useHindi
        ? [q.OptionAHi, q.OptionBHi, q.OptionCHi, q.OptionDHi]
        : [q.OptionA, q.OptionB, q.OptionC, q.OptionD];

      const selected =
        answers[q.QuestionId] !== undefined ? answers[q.QuestionId] : null;

      let status = "unanswered";
      if (selected === null || selected === undefined) {
        unansweredCount++;
      } else if (selected === q.CorrectAnswer) {
        correctCount++;
        status = "correct";
      } else {
        wrongCount++;
        status = "wrong";
      }

      return {
        questionId: q.QuestionId,
        question: questionText,
        options,
        selected,
        correctAnswer: q.CorrectAnswer,
        status,
      };
    });

    const score =
      correctCount * test.MarksPerCorrect - wrongCount * test.NegativeMarking;
    const totalMarks = questionsResult.recordset.length * test.MarksPerCorrect;
    const roundedScore = Math.round(score * 100) / 100;

    const insertResult = await pool
      .request()
      .input("testId", sql.NVarChar, test.TestId)
      .input("testTitle", sql.NVarChar, test.Title)
      .input("userId", sql.NVarChar, userId)
      .input("correctCount", sql.Int, correctCount)
      .input("wrongCount", sql.Int, wrongCount)
      .input("unansweredCount", sql.Int, unansweredCount)
      .input("score", sql.Float, roundedScore)
      .input("totalMarks", sql.Float, totalMarks)
      .input("reviewJson", sql.NVarChar(sql.MAX), JSON.stringify(review))
      .query(`
        INSERT INTO Results
          (TestId, TestTitle, UserId, CorrectCount, WrongCount, UnansweredCount, Score, TotalMarks, ReviewJson)
        OUTPUT INSERTED.ResultId, INSERTED.SubmittedAt
        VALUES
          (@testId, @testTitle, @userId, @correctCount, @wrongCount, @unansweredCount, @score, @totalMarks, @reviewJson)
      `);

    const inserted = insertResult.recordset[0];

    res.json({
      resultId: inserted.ResultId,
      testId: test.TestId,
      testTitle: test.Title,
      userId,
      submittedAt: inserted.SubmittedAt,
      correctCount,
      wrongCount,
      unansweredCount,
      score: roundedScore,
      totalMarks,
      review,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit test" });
  }
});

// --- GET /api/tests/results/:userId ---
// A user's past attempts (history)
router.get("/results/:userId", async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("userId", sql.NVarChar, req.params.userId)
      .query(
        "SELECT * FROM Results WHERE UserId = @userId ORDER BY SubmittedAt DESC"
      );

    const results = result.recordset.map((r) => ({
      resultId: r.ResultId,
      testId: r.TestId,
      testTitle: r.TestTitle,
      userId: r.UserId,
      submittedAt: r.SubmittedAt,
      correctCount: r.CorrectCount,
      wrongCount: r.WrongCount,
      unansweredCount: r.UnansweredCount,
      score: r.Score,
      totalMarks: r.TotalMarks,
      review: JSON.parse(r.ReviewJson),
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load results" });
  }
});

module.exports = router;