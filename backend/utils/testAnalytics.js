/* =====================================================
   TEST RESULT ANALYTICS

   RULE: a student can take a test many times, but ONLY THE FIRST
   ATTEMPT counts for rank, percentile, topper and the test leaderboard.
   Later attempts are still saved and their solutions can be viewed.

   Tie-break for equal scores: less time first, then earlier submission.
===================================================== */

const Result = require("../models/Result");

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function accuracyOf(correct, wrong) {
  const attempted = (Number(correct) || 0) + (Number(wrong) || 0);
  return attempted > 0 ? round2(((Number(correct) || 0) / attempted) * 100) : 0;
}

// one entry per student (their first attempt), best rank first
async function loadFirstAttempts(testId) {
  const rows = await Result.aggregate([
    {
      $match: {
        testId,
        userId: { $type: "string", $regex: OBJECT_ID },
      },
    },
    { $sort: { submittedAt: 1, resultId: 1 } },
    {
      $group: {
        _id: "$userId",
        resultId: { $first: "$resultId" },
        score: { $first: "$score" },
        totalMarks: { $first: "$totalMarks" },
        correctCount: { $first: "$correctCount" },
        wrongCount: { $first: "$wrongCount" },
        unansweredCount: { $first: "$unansweredCount" },
        timeTakenSeconds: { $first: "$timeTakenSeconds" },
        submittedAt: { $first: "$submittedAt" },
      },
    },
  ]);

  const list = rows.map((r) => ({
    userId: String(r._id),
    resultId: r.resultId,
    score: Number(r.score) || 0,
    totalMarks: Number(r.totalMarks) || 0,
    correct: Number(r.correctCount) || 0,
    wrong: Number(r.wrongCount) || 0,
    unanswered: Number(r.unansweredCount) || 0,
    timeTakenSeconds:
      r.timeTakenSeconds === null || r.timeTakenSeconds === undefined
        ? null
        : Number(r.timeTakenSeconds),
    submittedAt: r.submittedAt,
  }));

  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const ta = a.timeTakenSeconds ?? Infinity;
    const tb = b.timeTakenSeconds ?? Infinity;

    if (ta !== tb && Number.isFinite(ta - tb)) return ta - tb;

    return (
      new Date(a.submittedAt) - new Date(b.submittedAt) ||
      a.resultId - b.resultId
    );
  });

  list.forEach((r, i) => {
    r.rank = i + 1;
    r.accuracy = accuracyOf(r.correct, r.wrong);
  });

  return list;
}

// topper + average, from the first attempts
function summarise(list) {
  if (!list.length) return { topper: null, average: null };

  const avg = (pick) =>
    round2(list.reduce((sum, r) => sum + pick(r), 0) / list.length);

  const timed = list.filter((r) => r.timeTakenSeconds !== null);

  return {
    topper: list[0],
    average: {
      score: avg((r) => r.score),
      accuracy: avg((r) => r.accuracy),
      correct: avg((r) => r.correct),
      wrong: avg((r) => r.wrong),
      timeTakenSeconds: timed.length
        ? Math.round(
            timed.reduce((s, r) => s + r.timeTakenSeconds, 0) / timed.length
          )
        : null,
    },
  };
}

// students who scored lower, as a share of everyone (0-100)
function percentile(rank, total) {
  if (!total) return 0;
  if (total === 1) return 100;
  return round2(((total - rank) / total) * 100);
}

module.exports = {
  accuracyOf,
  loadFirstAttempts,
  percentile,
  round2,
  summarise,
};