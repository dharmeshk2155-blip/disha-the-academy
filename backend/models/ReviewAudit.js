const mongoose = require("mongoose");

const reviewAuditSchema = new mongoose.Schema(
  {
    draftId: { type: mongoose.Schema.Types.ObjectId, index: true },
    adminId: { type: String, default: "" },
    adminEmail: { type: String, default: "" },
    action: { type: String, required: true },
    summary: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

module.exports =
  mongoose.models.ReviewAudit ||
  mongoose.model("ReviewAudit", reviewAuditSchema);
