const mongoose = require("mongoose");

// Approved source registry for the automated content system.
const contentSourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    url: { type: String, required: true, trim: true, maxlength: 1000 },
    kind: { type: String, enum: ["rss"], default: "rss" },
    category: { type: String, default: "National", trim: true, maxlength: 100 },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    reliability: {
      type: String,
      enum: ["official", "high", "medium"],
      default: "high",
    },
    termsNote: { type: String, default: "", trim: true, maxlength: 500 },
    active: { type: Boolean, default: true, index: true },
    lastCheckedAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
    consecutiveFailures: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.ContentSource ||
  mongoose.model("ContentSource", contentSourceSchema);
