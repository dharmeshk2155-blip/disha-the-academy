const mongoose = require("mongoose");

const automationJobSchema = new mongoose.Schema(
  {
    trigger: { type: String, enum: ["schedule", "cron", "manual"], default: "manual" },
    status: { type: String, enum: ["running", "success", "partial", "failed"], default: "running", index: true },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
    sourcesChecked: { type: Number, default: 0 },
    itemsFound: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    skippedOld: { type: Number, default: 0 },
    draftsCreated: { type: Number, default: 0 },
    needsAttention: { type: Number, default: 0 },
    aiCalls: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    errorLog: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.AutomationJob ||
  mongoose.model("AutomationJob", automationJobSchema);
