// Endpoint for an external scheduler (Vercel Cron, Render Cron Job, cron-job.org ...).
// Protected by CRON_SECRET (min. 16 characters). Not an admin route.

const express = require("express");
const crypto = require("crypto");

const { runCollection } = require("../utils/automation/runner");
const { publishDue } = require("../utils/automation/publisher");

const router = express.Router();

function authorised(req) {
  const secret = String(process.env.CRON_SECRET || "");
  if (secret.length < 16) return false;

  const header = String(req.headers.authorization || "");
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(a, b);
}

async function handle(req, res) {
  if (!authorised(req)) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const published = await publishDue().catch(() => 0);

  // run in the background so the scheduler gets a quick answer
  runCollection({ trigger: "cron" }).catch((e) => console.error("cron run:", e.message));

  return res.status(202).json({ success: true, scheduledPublished: published, message: "Collection started." });
}

router.get("/cron", handle); // Vercel Cron calls GET
router.post("/cron", handle);

module.exports = router;
