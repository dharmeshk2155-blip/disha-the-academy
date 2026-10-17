const mongoose = require("mongoose");

const STATUSES = [
  "discovered",
  "processing",
  "pending_review",
  "approved",
  "scheduled",
  "published",
  "rejected",
  "needs_attention",
  "failed",
  "archived",
];

const mcqSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    answerIndex: Number,
    explanation: String,
  },
  { _id: false }
);

const contentDraftSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true, maxlength: 500 },
    slug: { type: String, default: "", trim: true, maxlength: 200 },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    summary: { type: String, default: "" },
    body: { type: String, default: "" },
    keyPoints: { type: [String], default: [] },
    category: { type: String, default: "", trim: true, maxlength: 100, index: true },
    tags: { type: [String], default: [] },
    mcqs: { type: [mcqSchema], default: [] },

    // where it goes when approved
    targetType: {
      type: String,
      enum: ["currentAffair", "blog"],
      default: "currentAffair",
    },

    // source tracing
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "ContentSource", index: true },
    sourceName: { type: String, default: "" },
    sourceUrls: { type: [String], default: [] },
    canonicalUrl: { type: String, default: "" },
    sourcePublishedAt: { type: Date, default: null },
    imageUrl: { type: String, default: "", trim: true, maxlength: 1000 },
    imageQuery: { type: String, default: "", trim: true, maxlength: 120 },
    imageCredit: { type: String, default: "", trim: true, maxlength: 200 },
    imageCreditUrl: { type: String, default: "", trim: true, maxlength: 500 },
    manual: { type: Boolean, default: false },
    sourceTitle: { type: String, default: "" },
    sourceSnippet: { type: String, default: "" },
    fetchedAt: { type: Date, default: null },

    // AI + checks
    generatedAt: { type: Date, default: null },
    aiModel: { type: String, default: "" },
    factCheckNotes: { type: [String], default: [] },
    needsHumanVerification: { type: Boolean, default: false },
    factCheckStatus: {
      type: String,
      enum: ["unchecked", "flagged", "reviewed"],
      default: "unchecked",
    },
    warnings: { type: [String], default: [] },
    validationErrors: { type: [String], default: [] },
    rawAiOutput: { type: String, default: "", select: false },

    status: { type: String, enum: STATUSES, default: "discovered", index: true },
    contentHash: { type: String, default: "", index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "AutomationJob" },

    // review
    reviewerId: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },

    // publishing (idempotent: the published id is chosen BEFORE creating)
    publishAt: { type: Date, default: null, index: true },
    publishedAt: { type: Date, default: null },
    publishedRefId: { type: mongoose.Schema.Types.ObjectId, default: null },
    publishedType: { type: String, default: "" },
    publishing: { type: Boolean, default: false },
    lastError: { type: String, default: "" },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

// the same source article can never create two drafts
contentDraftSchema.index(
  { canonicalUrl: 1 },
  { unique: true, partialFilterExpression: { canonicalUrl: { $type: "string", $gt: "" } } }
);

contentDraftSchema.statics.STATUSES = STATUSES;

module.exports =
  mongoose.models.ContentDraft ||
  mongoose.model("ContentDraft", contentDraftSchema);
