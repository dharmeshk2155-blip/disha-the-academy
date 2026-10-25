// Small helpers shared by the live-test routes, access check and reminders.

const LiveTest = require("../models/LiveTest");

const MIN = 60 * 1000;
const GRACE_MS = 2 * MIN; // auto-submit at the very end may reach the server a bit late

function phaseOf(live, now = Date.now()) {
  if (live.status === "cancelled") return "cancelled";
  if (now < new Date(live.startsAt).getTime()) return "upcoming";
  if (now < new Date(live.endsAt).getTime()) return "live";
  return "ended";
}

function releaseAtOf(live) {
  return new Date(new Date(live.endsAt).getTime() + (Number(live.resultDelayMinutes) || 0) * MIN);
}

// "25 Oct, 8:00 pm" in Indian time, whatever the server's own time zone is
function formatIST(date) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// the live window (or its 2-minute grace) this test is in right now, if any
async function runningLiveFor(testId, now = Date.now()) {
  return LiveTest.findOne({
    testId,
    status: "scheduled",
    startsAt: { $lte: new Date(now) },
    endsAt: { $gt: new Date(now - GRACE_MS) },
  })
    .sort({ startsAt: -1 })
    .lean();
}

async function upcomingLiveFor(testId, now = Date.now()) {
  return LiveTest.findOne({ testId, status: "scheduled", startsAt: { $gt: new Date(now) } })
    .sort({ startsAt: 1 })
    .lean();
}

// when is the result of the latest started live test of this test released?
// (null = nothing is locked)
async function resultLockFor(testId, now = Date.now()) {
  const live = await LiveTest.findOne({ testId, status: "scheduled", startsAt: { $lte: new Date(now) } })
    .sort({ endsAt: -1 })
    .lean();
  if (!live) return null;
  const release = releaseAtOf(live);
  return release.getTime() > now ? release : null;
}

// Mongo filter: leave out live results that are still locked
function releasedOnly(now = new Date()) {
  return { $or: [{ liveReleaseAt: null }, { liveReleaseAt: { $lte: now } }] };
}

module.exports = { MIN, GRACE_MS, phaseOf, releaseAtOf, formatIST, runningLiveFor, upcomingLiveFor, resultLockFor, releasedOnly };
