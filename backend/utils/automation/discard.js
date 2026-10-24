// Permanent removal of review drafts.
//   - rejected by the admin  -> deleted at once
//   - not reviewed within 24 h -> deleted by expireStaleDrafts()
// The story is remembered for 14 days (SeenStory) so it does not come back,
// and the stock photo we copied to Cloudinary is removed too.

const ContentDraft = require("../../models/ContentDraft");
const SeenStory = require("../../models/SeenStory");
const { removeImages } = require("./cleanup");

const HOUR = 3600 * 1000;
const REMEMBER_DAYS = 14;

// drafts that wait for the admin's decision
const WAITING = ["pending_review", "needs_attention", "failed", "processing", "discovered"];

function reviewHours() {
  const value = Number(process.env.DRAFT_REVIEW_HOURS);
  return Number.isFinite(value) && value >= 1 ? value : 24;
}

async function discardDrafts(drafts, reason) {
  if (!drafts.length) return 0;

  const until = new Date(Date.now() + REMEMBER_DAYS * 24 * HOUR);
  for (const d of drafts) {
    // pasted-text drafts have no link; failed ones should be retried later
    if (!d.canonicalUrl || ["failed", "processing", "discovered"].includes(d.status)) continue;
    await SeenStory.updateOne(
      { canonicalUrl: d.canonicalUrl },
      { $set: { contentHash: d.contentHash || "", title: String(d.title || "").slice(0, 500), reason, expiresAt: until } },
      { upsert: true }
    ).catch((e) => console.error("SeenStory:", e.message));
  }

  // photos of drafts that were never published (a published item still uses its photo)
  await removeImages(drafts.filter((d) => d.status !== "published" && d.status !== "archived")).catch(() => {});

  const res = await ContentDraft.deleteMany({ _id: { $in: drafts.map((d) => d._id) } });
  return res.deletedCount || 0;
}

// Drafts the admin did not look at within 24 hours are removed.
// Pasted-text drafts (manual) and anything approved/scheduled/published are left alone.
async function expireStaleDrafts() {
  const cutoff = new Date(Date.now() - reviewHours() * HOUR);
  let total = 0;

  for (let round = 0; round < 10; round += 1) {
    const rows = await ContentDraft.find({
      $or: [
        { status: { $in: WAITING }, manual: { $ne: true }, createdAt: { $lt: cutoff } },
        { status: "rejected" }, // drafts rejected before this rule existed
      ],
    })
      .select("_id canonicalUrl contentHash title imageUrl status")
      .limit(100)
      .lean();
    if (!rows.length) break;
    total += await discardDrafts(rows, "expired");
  }

  if (total) console.log(`Review queue: removed ${total} draft(s) that were not reviewed within ${reviewHours()} hours.`);
  return total;
}

module.exports = { discardDrafts, expireStaleDrafts, reviewHours, REMEMBER_DAYS };
