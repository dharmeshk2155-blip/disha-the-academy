// Admin side of live tests. Mounted at /api/admin/live (behind requireAdmin).

const express = require("express");
const mongoose = require("mongoose");

const LiveTest = require("../models/LiveTest");
const LiveRegistration = require("../models/LiveRegistration");
const Test = require("../models/Test");
const Question = require("../models/Question");
const Result = require("../models/Result");
const { phaseOf, releaseAtOf, MIN } = require("../utils/live");

const router = express.Router();

const ok = (res, data = {}, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, status, message) => res.status(status).json({ success: false, message, error: message });
const validId = (id) => mongoose.isValidObjectId(String(id || ""));
const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toDate(value) {
  const d = new Date(String(value || ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

function delayOf(value, fallback = 120) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 && n <= 7 * 24 * 60 ? n : null;
}

function shape(live, test, regs, attempts) {
  return {
    id: String(live._id),
    testId: live.testId,
    title: test?.title || live.testId,
    durationMinutes: Math.round((Number(test?.duration) || 0) / 60),
    startsAt: live.startsAt,
    endsAt: live.endsAt,
    resultDelayMinutes: live.resultDelayMinutes,
    releaseAt: releaseAtOf(live),
    note: live.note || "",
    status: live.status,
    phase: phaseOf(live),
    registrations: regs || 0,
    attempts: attempts || 0,
  };
}

// tests the admin can pick from
router.get("/tests", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 80);
    const filter = { isActive: true };
    if (q) filter.$or = [{ title: { $regex: escapeRegex(q), $options: "i" } }, { testId: { $regex: escapeRegex(q), $options: "i" } }];

    const tests = await Test.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .select("testId title subExam duration isFree")
      .lean();

    const counts = await Question.aggregate([
      { $match: { testId: { $in: tests.map((t) => t.testId) } } },
      { $group: { _id: "$testId", n: { $sum: 1 } } },
    ]);
    const countBy = new Map(counts.map((c) => [c._id, c.n]));

    return ok(res, {
      tests: tests.map((t) => ({
        testId: t.testId,
        title: t.title,
        exam: t.subExam || "",
        durationMinutes: Math.round((Number(t.duration) || 0) / 60),
        isFree: t.isFree === true,
        questions: countBy.get(t.testId) || 0,
      })),
    });
  } catch (error) {
    console.error("admin live tests:", error);
    return fail(res, 500, "Could not load tests.");
  }
});

router.get("/", async (req, res) => {
  try {
    const lives = await LiveTest.find().sort({ startsAt: -1 }).limit(100).lean();

    const [tests, regs, atts] = await Promise.all([
      Test.find({ testId: { $in: lives.map((l) => l.testId) } }).select("testId title duration").lean(),
      LiveRegistration.aggregate([
        { $match: { liveId: { $in: lives.map((l) => l._id) } } },
        { $group: { _id: "$liveId", n: { $sum: 1 } } },
      ]),
      Result.aggregate([
        { $match: { liveId: { $in: lives.map((l) => String(l._id)) } } },
        { $group: { _id: "$liveId", n: { $sum: 1 } } },
      ]),
    ]);

    const testBy = new Map(tests.map((t) => [t.testId, t]));
    const regBy = new Map(regs.map((r) => [String(r._id), r.n]));
    const attBy = new Map(atts.map((r) => [String(r._id), r.n]));

    return ok(res, {
      lives: lives.map((l) => shape(l, testBy.get(l.testId), regBy.get(String(l._id)), attBy.get(String(l._id)))),
    });
  } catch (error) {
    console.error("admin live list:", error);
    return fail(res, 500, "Could not load live tests.");
  }
});

router.post("/", async (req, res) => {
  try {
    const testId = String(req.body?.testId || "").trim().toLowerCase();
    const startsAt = toDate(req.body?.startsAt);
    const endsAt = toDate(req.body?.endsAt);
    const delay = delayOf(req.body?.resultDelayMinutes);
    const note = String(req.body?.note || "").trim().slice(0, 300);

    if (!testId) return fail(res, 400, "Choose a test.");
    if (!startsAt || !endsAt) return fail(res, 400, "Enter a valid start and end time.");
    if (delay === null) return fail(res, 400, "Result delay must be between 0 and 10080 minutes.");
    if (startsAt.getTime() < Date.now() + 5 * MIN) return fail(res, 400, "The start time must be at least 5 minutes from now.");
    if (endsAt <= startsAt) return fail(res, 400, "The end time must be after the start time.");

    const test = await Test.findOne({ testId, isActive: true }).lean();
    if (!test) return fail(res, 404, "That test was not found or is not active.");

    const questionCount = await Question.countDocuments({ testId });
    if (!questionCount) return fail(res, 400, "That test has no questions yet.");

    const minWindow = Math.ceil((Number(test.duration) || 0) / 60);
    if (endsAt.getTime() - startsAt.getTime() < minWindow * MIN) {
      return fail(res, 400, `The window must be at least as long as the test (${minWindow} minutes).`);
    }

    const clash = await LiveTest.exists({ testId, status: "scheduled", endsAt: { $gt: new Date() } });
    if (clash) return fail(res, 409, "This test already has a live schedule. Cancel or edit that one first.");

    const live = await LiveTest.create({
      testId,
      startsAt,
      endsAt,
      resultDelayMinutes: delay,
      note,
      createdBy: req.admin?.email || req.admin?.id || "",
    });

    return ok(res, { live: shape(live.toObject(), test, 0, 0) }, 201);
  } catch (error) {
    console.error("admin live create:", error);
    return fail(res, 500, "Could not schedule the live test.");
  }
});

router.put("/:id", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid live test.");
  try {
    const live = await LiveTest.findById(req.params.id);
    if (!live || live.status !== "scheduled") return fail(res, 404, "Live test not found.");

    const phase = phaseOf(live);
    const startsAt = req.body?.startsAt !== undefined ? toDate(req.body.startsAt) : live.startsAt;
    const endsAt = req.body?.endsAt !== undefined ? toDate(req.body.endsAt) : live.endsAt;
    const delay = delayOf(req.body?.resultDelayMinutes, live.resultDelayMinutes);

    if (!startsAt || !endsAt) return fail(res, 400, "Enter a valid start and end time.");
    if (delay === null) return fail(res, 400, "Result delay must be between 0 and 10080 minutes.");
    if (endsAt <= startsAt) return fail(res, 400, "The end time must be after the start time.");

    const startChanged = startsAt.getTime() !== live.startsAt.getTime();
    if (startChanged && phase !== "upcoming") return fail(res, 409, "The start time cannot be changed once the test has started.");
    if (startChanged && startsAt.getTime() < Date.now() + 5 * MIN) return fail(res, 400, "The start time must be at least 5 minutes from now.");
    if (endsAt.getTime() < Date.now()) return fail(res, 400, "The end time must be in the future.");

    const test = await Test.findOne({ testId: live.testId }).select("duration").lean();
    const minWindow = Math.ceil((Number(test?.duration) || 0) / 60);
    if (phase === "upcoming" && endsAt.getTime() - startsAt.getTime() < minWindow * MIN) {
      return fail(res, 400, `The window must be at least as long as the test (${minWindow} minutes).`);
    }

    live.startsAt = startsAt;
    live.endsAt = endsAt;
    live.resultDelayMinutes = delay;
    if (req.body?.note !== undefined) live.note = String(req.body.note || "").trim().slice(0, 300);
    await live.save();

    // new release time for the attempts already made
    await Result.updateMany({ liveId: String(live._id) }, { $set: { liveReleaseAt: releaseAtOf(live) } });

    // a new start time means the reminders must go out again
    if (startChanged) await LiveRegistration.updateMany({ liveId: live._id }, { $set: { sentStages: [] } });

    return ok(res, { live: shape(live.toObject(), null, 0, 0) });
  } catch (error) {
    console.error("admin live update:", error);
    return fail(res, 500, "Could not update the live test.");
  }
});

// cancel: students no longer see it, the test goes back to normal
router.post("/:id/cancel", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid live test.");
  try {
    const live = await LiveTest.findById(req.params.id);
    if (!live) return fail(res, 404, "Live test not found.");
    if (phaseOf(live) === "ended") return fail(res, 409, "This live test has already ended.");

    live.status = "cancelled";
    await live.save();

    // anybody who already submitted gets the result straight away
    await Result.updateMany({ liveId: String(live._id) }, { $set: { liveReleaseAt: null } });

    return ok(res, {});
  } catch (error) {
    console.error("admin live cancel:", error);
    return fail(res, 500, "Could not cancel the live test.");
  }
});

router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid live test.");
  try {
    const live = await LiveTest.findById(req.params.id).lean();
    if (!live) return fail(res, 404, "Live test not found.");

    const attempts = await Result.countDocuments({ liveId: String(live._id) });
    if (attempts) return fail(res, 409, "Students already gave this live test. Cancel it instead of deleting.");

    await LiveRegistration.deleteMany({ liveId: live._id });
    await LiveTest.deleteOne({ _id: live._id });
    return ok(res, {});
  } catch (error) {
    console.error("admin live delete:", error);
    return fail(res, 500, "Could not delete the live test.");
  }
});

module.exports = router;
