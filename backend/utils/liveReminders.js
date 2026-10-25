// Reminder e-mails for students who registered for a live test.
//
// Two reminders per student: 60 and 10 minutes before the start.
// Brevo's free plan sends 300 e-mails a day, so two per student keeps room for
// about 150 registered students a day (OTP mails share the same limit).
//
// Safe to call as often as you like (every minute): a reminder that was sent
// is remembered, and if the server was asleep at the exact time only the
// latest still-useful reminder is sent.

const LiveTest = require("../models/LiveTest");
const LiveRegistration = require("../models/LiveRegistration");
const Test = require("../models/Test");
const User = require("../models/User");
const { sendLiveReminderEmail } = require("./mailer");
const { formatIST, MIN } = require("./live");

const STAGES = [10, 60]; // minutes before the start, smallest first
const PER_RUN = 60; // e-mails per call

let busy = false;

function siteUrl() {
  return String(process.env.FRONTEND_URL || "https://dishatheacademy.com").replace(/\/+$/, "");
}

async function sendDueLiveReminders() {
  if (busy) return { sent: 0, skipped: true };
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) return { sent: 0, skipped: true, reason: "no mail setup" };

  busy = true;
  let sent = 0;

  try {
    const now = Date.now();
    const lives = await LiveTest.find({
      status: "scheduled",
      startsAt: { $gt: new Date(now), $lte: new Date(now + 61 * MIN) },
    }).lean();

    for (const live of lives) {
      if (sent >= PER_RUN) break;

      const minutesLeft = (new Date(live.startsAt).getTime() - now) / MIN;
      const stage = STAGES.find((s) => minutesLeft <= s);
      if (!stage) continue;

      const covered = STAGES.filter((s) => s <= stage); // stages that make this reminder redundant
      const pending = await LiveRegistration.find({ liveId: live._id, sentStages: { $nin: covered } })
        .limit(PER_RUN - sent)
        .lean();
      if (!pending.length) continue;

      const [test, users] = await Promise.all([
        Test.findOne({ testId: live.testId }).select("title duration").lean(),
        User.find({ _id: { $in: pending.map((p) => p.userId) } }).select("fullName email isActive").lean(),
      ]);
      const byId = new Map(users.map((u) => [String(u._id), u]));

      for (const reg of pending) {
        const user = byId.get(String(reg.userId));
        const done = { $addToSet: { sentStages: { $each: STAGES.filter((s) => s >= stage) } } };

        if (!user || !user.email || user.isActive === false) {
          await LiveRegistration.updateOne({ _id: reg._id }, done);
          continue;
        }

        try {
          await sendLiveReminderEmail(user.email, user.fullName, {
            title: test?.title || "Live Test",
            startsAtText: formatIST(live.startsAt),
            minutesLeft,
            link: `${siteUrl()}/live`,
            durationMinutes: Math.round((Number(test?.duration) || 0) / 60),
          });
          await LiveRegistration.updateOne({ _id: reg._id }, done);
          sent += 1;
        } catch (error) {
          console.error("Live reminder mail:", error.message);
          // quota / bad key: stop now, the next call tries again
          if (error.status === 401 || error.status === 402 || error.status === 429) return { sent, stopped: true };
        }
      }
    }

    if (sent) console.log(`Live tests: sent ${sent} reminder e-mail(s).`);
    return { sent };
  } finally {
    busy = false;
  }
}

function startLiveReminders() {
  const tick = () => sendDueLiveReminders().catch((e) => console.error("live reminders:", e.message));
  setTimeout(tick, 45 * 1000).unref();
  setInterval(tick, 60 * 1000).unref();
}

module.exports = { sendDueLiveReminders, startLiveReminders };
