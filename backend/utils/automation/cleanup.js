// Deletes Current Affairs older than N days (and their card image on Cloudinary).
// N comes from CURRENT_AFFAIRS_RETENTION_DAYS (default 30, 0 = never delete,
// minimum 7 so a typing mistake cannot wipe the section).

const { v2: cloudinary } = require("cloudinary");
const CurrentAffair = require("../../models/CurrentAffair");

const DAY = 24 * 3600 * 1000;

function retentionDays() {
  const raw = process.env.CURRENT_AFFAIRS_RETENTION_DAYS;
  const value = raw === undefined || raw === "" ? 30 : Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0; // off
  return Math.max(7, Math.floor(value));
}

// Only images this system uploaded are ever removed from Cloudinary.
function publicIdFromUrl(url) {
  const m = String(url || "").match(
    /\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(disha-the-academy\/current-affairs\/[^./]+)\.[a-z0-9]+(?:\?.*)?$/i
  );
  return m ? m[1] : "";
}

async function removeImages(rows) {
  const ids = rows.map((r) => publicIdFromUrl(r.imageUrl)).filter(Boolean);
  if (!ids.length || !process.env.CLOUDINARY_API_SECRET) return 0;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  let removed = 0;
  for (const id of ids) {
    try {
      await cloudinary.uploader.destroy(id, { resource_type: "image" });
      removed += 1;
    } catch (error) {
      // a missing image must never stop the cleanup
      console.error("Cleanup: could not remove image", id, error.message);
    }
  }
  return removed;
}

async function cleanupOldCurrentAffairs() {
  const days = retentionDays();
  if (!days) return { skipped: true, deleted: 0, images: 0 };

  const cutoff = new Date(Date.now() - days * DAY);
  let deleted = 0;
  let images = 0;

  for (let round = 0; round < 20; round += 1) {
    const rows = await CurrentAffair.find({ publishedDate: { $lt: cutoff } })
      .select("_id imageUrl")
      .limit(200)
      .lean();
    if (!rows.length) break;

    images += await removeImages(rows);
    const result = await CurrentAffair.deleteMany({ _id: { $in: rows.map((r) => r._id) } });
    deleted += result.deletedCount || 0;
  }

  if (deleted) console.log(`Cleanup: removed ${deleted} current affairs older than ${days} days (${images} images).`);
  return { skipped: false, deleted, images, days };
}

module.exports = { cleanupOldCurrentAffairs, retentionDays, publicIdFromUrl, removeImages };
