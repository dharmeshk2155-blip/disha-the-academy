// Publishing: turns an approved draft into a Current Affair or Blog post.
// Safe to retry - the final id is chosen and stored BEFORE the public
// record is created, so a retry can never produce a second article.

const mongoose = require("mongoose");
const ContentDraft = require("../../models/ContentDraft");
const CurrentAffair = require("../../models/CurrentAffair");
const Blog = require("../../models/Blog");
const { validateDraft } = require("./validator");

const PUBLISHABLE = ["pending_review", "needs_attention", "approved", "scheduled"];

class PublishError extends Error {
  constructor(message, status = 400, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function sourceLine(draft) {
  const lang = draft.language === "hi" ? "स्रोत" : "Source";
  const name = draft.sourceName ? `${draft.sourceName}: ` : "";
  return `${lang}: ${name}${(draft.sourceUrls || []).join(", ")}`;
}

async function publishDraft(draftId, { adminId = "", targetType } = {}) {
  const existing = await ContentDraft.findById(draftId);
  if (!existing) throw new PublishError("Draft not found.", 404);

  // already public -> return as is (idempotent)
  if (existing.status === "published" && existing.publishedRefId) return existing;

  if (!PUBLISHABLE.includes(existing.status)) {
    throw new PublishError(`A draft in "${existing.status}" status cannot be published.`, 409);
  }

  // claim the draft so two clicks / a click and the scheduler cannot overlap
  const draft = await ContentDraft.findOneAndUpdate(
    { _id: draftId, publishing: { $ne: true }, status: { $in: PUBLISHABLE } },
    { $set: { publishing: true }, $inc: { attempts: 1 } },
    { new: true }
  );
  if (!draft) throw new PublishError("This draft is already being published.", 409);

  try {
    const { errors } = validateDraft(draft.toObject());
    if (errors.length) {
      throw new PublishError("The draft has problems that must be fixed first.", 422, errors);
    }

    const type = targetType === "blog" || targetType === "currentAffair" ? targetType : draft.targetType;

    if (!draft.publishedRefId) draft.publishedRefId = new mongoose.Types.ObjectId();
    draft.targetType = type;
    await draft.save();

    const now = new Date();
    const credit = draft.imageCredit ? `\nImage: ${draft.imageCredit}${draft.imageCreditUrl ? ` (${draft.imageCreditUrl})` : ""}` : "";
    const content = `${draft.body}\n\n${sourceLine(draft)}${credit}`;

    try {
      if (type === "blog") {
        await Blog.create({
          _id: draft.publishedRefId,
          title: draft.title,
          category: draft.category,
          summary: draft.summary,
          imageUrl: draft.imageUrl || "",
          content,
          publishedDate: now,
          status: "Published",
        });
      } else {
        await CurrentAffair.create({
          _id: draft.publishedRefId,
          title: draft.title,
          summary: draft.summary,
          publishedDate: now,
          category: draft.category,
          imageUrl: draft.imageUrl || "",
          content,
          keyPoints: (draft.keyPoints || []).join("\n"),
        });
      }
    } catch (error) {
      if (error?.code !== 11000) throw error; // duplicate id = already created earlier
    }

    draft.status = "published";
    draft.publishedAt = now;
    draft.publishedType = type;
    draft.publishAt = null;
    draft.lastError = "";
    if (adminId) draft.reviewerId = adminId;
    draft.reviewedAt = draft.reviewedAt || now;
    draft.publishing = false;
    await draft.save();
    return draft;
  } catch (error) {
    await ContentDraft.updateOne(
      { _id: draftId },
      { $set: { publishing: false, lastError: String(error.message || error).slice(0, 300) } }
    );
    throw error;
  }
}

// publishes drafts whose scheduled time has arrived
async function publishDue() {
  const due = await ContentDraft.find({ status: "scheduled", publishAt: { $lte: new Date() }, publishing: { $ne: true } })
    .select("_id")
    .limit(20)
    .lean();

  let published = 0;
  for (const row of due) {
    try {
      await publishDraft(row._id);
      published += 1;
    } catch (error) {
      console.error("Scheduled publish failed:", row._id.toString(), error.message);
    }
  }
  return published;
}

module.exports = { publishDraft, publishDue, PublishError };
