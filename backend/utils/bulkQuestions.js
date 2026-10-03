/* =====================================================
   BULK QUESTION IMPORT (bilingual EN + HI)

   One shared handler used by BOTH:
     POST /api/admin/tests/:testId/questions/bulk        (premium / normal)
     POST /api/admin/free-tests/:testId/questions/bulk   (free tests)

   The browser parses the Excel file and sends JSON, but the server
   NEVER trusts it: every row is validated again here.

   LANGUAGE RULES
     - A question may be English-only (English subject), Hindi-only
       (Hindi subject) or bilingual (GS, Maths, Reasoning ...).
     - A language that is used must be COMPLETE (question + 4 options).
     - Failed (never saved): an option missing in a used language,
       options without a question, missing / invalid correctAnswer,
       or nothing written in either language.
     - A Hindi-only question is stored with the Hindi text in the main
       fields as well, so the student side needs no change.

   Request body
     { questions: [ { rowNumber, questionText, optionA..D, correctAnswer,
                      questionTextHi, optionAHi..DHi,
                      explanationEn, explanationHi } ] }

   Response
     { success, total, imported, skipped:[{row,reason}], failed:[{row,reason}] }
===================================================== */

const Test = require("../models/Test");
const Question = require("../models/Question");

const MAX_ROWS = 500;

const EN_FIELDS = [
  "questionText",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
];

const HI_FIELDS = [
  "questionTextHi",
  "optionAHi",
  "optionBHi",
  "optionCHi",
  "optionDHi",
];

// names used in the Excel header (shown in error messages)
const LABEL = {
  questionText: "questionEn",
  optionA: "optionAEn",
  optionB: "optionBEn",
  optionC: "optionCEn",
  optionD: "optionDEn",
  questionTextHi: "questionHi",
  optionAHi: "optionAHi",
  optionBHi: "optionBHi",
  optionCHi: "optionCHi",
  optionDHi: "optionDHi",
};

function clean(value) {
  return String(value ?? "").trim();
}

// used only to detect duplicates ("What is X?" == "what  is x?")
function dupKey(value) {
  return clean(value)
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// accepts 1-4 or A-D, returns 1-4 or 0
function parseAnswer(value) {
  const v = clean(value).toUpperCase();

  if (["A", "B", "C", "D"].includes(v)) {
    return "ABCD".indexOf(v) + 1;
  }

  if (["1", "2", "3", "4"].includes(v)) {
    return Number(v);
  }

  return 0;
}

function createBulkImportHandler({ mode }) {
  return async function bulkImportQuestions(req, res) {
    try {
      const testId = clean(req.params.testId).toLowerCase();
      const rows = req.body?.questions;

      if (!testId) {
        return res.status(400).json({
          success: false,
          message: "Test ID is required.",
        });
      }

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No questions were sent.",
        });
      }

      if (rows.length > MAX_ROWS) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${MAX_ROWS} questions can be imported at once.`,
        });
      }

      const test = await Test.findOne({ testId })
        .select("_id testId isFree")
        .lean();

      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found.",
        });
      }

      if (mode === "free" && test.isFree !== true) {
        return res.status(400).json({
          success: false,
          message: "This test is not a free test.",
        });
      }

      // questions already saved in this test (for duplicate check)
      const existing = await Question.find({ testId })
        .select("questionText")
        .lean();

      const seen = new Set(
        existing.map((q) => dupKey(q.questionText))
      );

      const valid = [];
      const skipped = [];
      const failed = [];

      rows.forEach((raw, index) => {
        const row =
          Number.isInteger(raw?.rowNumber) && raw.rowNumber > 0
            ? raw.rowNumber
            : index + 2;

        const q = {};

        [...EN_FIELDS, ...HI_FIELDS].forEach((f) => {
          q[f] = clean(raw?.[f]);
        });

        const hasEn = EN_FIELDS.some((f) => q[f]);
        const hasHi = HI_FIELDS.some((f) => q[f]);

        if (!hasEn && !hasHi) {
          failed.push({
            row,
            reason: "Question missing (nothing written in English or Hindi).",
          });
          return;
        }

        // a language that is used must be complete
        const missing = [
          ...(hasEn ? EN_FIELDS : []),
          ...(hasHi ? HI_FIELDS : []),
        ].filter((f) => !q[f]);

        if (missing.length) {
          failed.push({
            row,
            reason: `Missing: ${missing.map((f) => LABEL[f]).join(", ")}`,
          });
          return;
        }

        const answer = parseAnswer(raw?.correctAnswer);

        if (!answer) {
          failed.push({
            row,
            reason: "correctAnswer must be A, B, C or D.",
          });
          return;
        }

        // Hindi-only: keep the Hindi text in the main fields too
        if (!hasEn) {
          EN_FIELDS.forEach((f, i) => {
            q[f] = q[HI_FIELDS[i]];
          });
        }

        const key = dupKey(q.questionText);

        if (seen.has(key)) {
          skipped.push({
            row,
            reason: "Duplicate question in this test.",
          });
          return;
        }

        seen.add(key);

        valid.push({
          ...q,
          correctAnswer: answer,
          explanationEn: clean(raw?.explanationEn),
          explanationHi: clean(raw?.explanationHi),
        });
      });

      if (valid.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No valid questions to import.",
          total: rows.length,
          imported: 0,
          skipped,
          failed,
        });
      }

      // questionId is a global counter, so reserve one continuous range
      const last = await Question.findOne({})
        .sort({ questionId: -1 })
        .select("questionId")
        .lean();

      const start = Number(last?.questionId || 0) + 1;

      const docs = valid.map((q, i) => ({
        questionId: start + i,
        testId,
        ...q,
      }));

      try {
        await Question.insertMany(docs);
      } catch (insertError) {
        console.error("Bulk import insert error:", insertError);

        const savedCount = await Question.countDocuments({
          testId,
          questionId: {
            $gte: start,
            $lt: start + docs.length,
          },
        });

        return res.status(409).json({
          success: false,
          message:
            savedCount > 0
              ? `Import was interrupted after ${savedCount} question(s). Please check the question list and try again for the rest.`
              : "Import failed. Another change happened at the same time, please try again.",
          imported: savedCount,
        });
      }

      return res.status(201).json({
        success: true,
        message: `${docs.length} question(s) imported.`,
        total: rows.length,
        imported: docs.length,
        skipped,
        failed,
      });
    } catch (error) {
      console.error("Bulk question import error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to import questions.",
      });
    }
  };
}

module.exports = { createBulkImportHandler, MAX_ROWS };