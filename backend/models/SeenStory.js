// A tiny "do not suggest this again" note. Created when a draft is rejected or
// expires, so the same story is not proposed again after the draft is deleted.
// MongoDB removes the note by itself after 14 days (TTL index).

const mongoose = require("mongoose");

const seenStorySchema = new mongoose.Schema(
  {
    canonicalUrl: { type: String, required: true, unique: true },
    contentHash: { type: String, default: "", index: true },
    title: { type: String, default: "", maxlength: 500 },
    reason: { type: String, enum: ["rejected", "expired", "deleted"], default: "deleted" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

module.exports = mongoose.models.SeenStory || mongoose.model("SeenStory", seenStorySchema);
