// Student side of live tests. Mounted at /api/live
//   GET    /api/live                 upcoming, running and just-ended live tests (public)
//   GET    /api/live/mine            which of them I registered for / attempted (login)
//   POST   /api/live/:id/register    register (login)
//   DELETE /api/live/:id/register    cancel my registration (login)

const express = require("express");
const mongoose = require("mongoose");

const LiveTest = require("../models/LiveTest");
const LiveRegistration = require("../models/LiveRegistration");
const Test = require("../models/Test");
const Question = require("../models/Question");
const Result = require("../models/Result");
const requireAuth = require("../middleware/requireAuth");
const { phaseOf, releaseAtOf } = require("../utils/live");

const router = express.Router();
const DAY = 24 * 3600 * 1000;

const validId = (id) => mongoose.isValidObjectId(String(id || ""));

function shape(live, test, questionCount, registered) {
  return {
    id: String(live._id),
    testId: live.testId,
    title: test?.title || live.testId,
    subject: test?.subject || "",
    exam: test?.subExam || test?.category || "",
    durationMinutes: Math.round((Number(test?.duration) || 0) / 60),
    marksPerCorrect: Number(test?.marksPerCorrect) || 0,
    negativeMarking: Number(test?.negativeMarking) || 0,
    totalQuestions: questionCount || 0,
    note: live.note || "",
    startsAt: live.startsAt,
    endsAt: live.endsAt,
    releaseAt: releaseAtOf(live),
    phase: phaseOf(live),
    registered,
  };
}

router.get("/", async (req, res) => {
  try {
    const now = Date.now();
    const lives = await LiveTest.find({
      status: "scheduled",
      endsAt: { $gt: new Date(now - 7 * DAY) },
    })
      .sort({ startsAt: 1 })
      .limit(60)
      .lean();

    const testIds = [...new Set(lives.map((l) => l.testId))];

    const [tests, counts, regs] = await Promise.all([
      Test.find({ testId: { $in: testIds } })
        .select("testId title subject subExam category duration marksPerCorrect negativeMarking")
        .lean(),
      Question.aggregate([{ $match: { testId: { $in: testIds } } }, { $group: { _id: "$testId", n: { $sum: 1 } } }]),
      LiveRegistration.aggregate([
        { $match: { liveId: { $in: lives.map((l) => l._id) } } },
        { $group: { _id: "$liveId", n: { $sum: 1 } } },
      ]),
    ]);

    const testBy = new Map(tests.map((t) => [t.testId, t]));
    const countBy = new Map(counts.map((c) => [c._id, c.n]));
    const regBy = new Map(regs.map((r) => [String(r._id), r.n]));

    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      serverNow: new Date(now).toISOString(),
      lives: lives.map((l) => ({
        ...shape(l, testBy.get(l.testId), countBy.get(l.testId), false),
        registrations: regBy.get(String(l._id)) || 0,
      })),
    });
  } catch (error) {
    console.error("live list:", error);
    return res.status(500).json({ success: false, error: "Could not load live tests." });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const regs = await LiveRegistration.find({ userId: req.user.id }).select("liveId").lean();
    const attempts = await Result.find({ userId: String(req.user.id), liveId: { $ne: null } })
      .select("resultId liveId liveReleaseAt")
      .lean();

    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      registered: regs.map((r) => String(r.liveId)),
      attempts: attempts.map((a) => ({ liveId: a.liveId, resultId: a.resultId, releaseAt: a.liveReleaseAt })),
    });
  } catch (error) {
    console.error("live mine:", error);
    return res.status(500).json({ success: false, error: "Could not load your live tests." });
  }
});

router.post("/:id/register", requireAuth, async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, error: "Invalid live test." });

  try {
    const live = await LiveTest.findById(req.params.id).lean();
    if (!live || live.status !== "scheduled") return res.status(404).json({ success: false, error: "Live test not found." });

    const phase = phaseOf(live);
    if (phase === "ended") return res.status(409).json({ success: false, error: "This live test has ended." });

    await LiveRegistration.updateOne(
      { liveId: live._id, userId: req.user.id },
      { $setOnInsert: { liveId: live._id, userId: req.user.id, sentStages: [] } },
      { upsert: true }
    );

    return res.json({ success: true, registered: true });
  } catch (error) {
    console.error("live register:", error);
    return res.status(500).json({ success: false, error: "Could not register. Please try again." });
  }
});

router.delete("/:id/register", requireAuth, async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, error: "Invalid live test." });

  try {
    await LiveRegistration.deleteOne({ liveId: req.params.id, userId: req.user.id });
    return res.json({ success: true, registered: false });
  } catch (error) {
    console.error("live unregister:", error);
    return res.status(500).json({ success: false, error: "Could not cancel. Please try again." });
  }
});

module.exports = router;
