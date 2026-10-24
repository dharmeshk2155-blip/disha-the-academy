// Admin API for the automated content system. Mounted at /api/admin/automation
// behind requireAdmin (see server.js).

const express = require("express");
const mongoose = require("mongoose");

const ContentSource = require("../models/ContentSource");
const ContentDraft = require("../models/ContentDraft");
const AutomationJob = require("../models/AutomationJob");
const ReviewAudit = require("../models/ReviewAudit");

const { CATEGORIES, canMove, settings } = require("../utils/automation/constants");
const { assertSafeUrl, readFeed } = require("../utils/automation/rss");
const { validateDraft } = require("../utils/automation/validator");
const { publishDraft, PublishError } = require("../utils/automation/publisher");
const { retentionDays } = require("../utils/automation/cleanup");
const { discardDrafts, reviewHours } = require("../utils/automation/discard");
const { searchPhotos, storePhoto, attachStockImage, configured: photosConfigured, providerInfo: photoProviderInfo } = require("../utils/automation/stockImage");
const { runCollection, regenerate, applyAi } = require("../utils/automation/runner");
const { draftFromItem } = require("../utils/automation/drafter");
const { canonicalUrl, normalizeTitle, sha } = require("../utils/automation/rss");

const router = express.Router();

const ok = (res, data = {}, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, status, message, details) =>
  res.status(status).json({ success: false, message, error: message, ...(details ? { details } : {}) });

function validId(id) {
  return mongoose.isValidObjectId(String(id || ""));
}

function text(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function audit(req, draftId, action, summary = "") {
  await ReviewAudit.create({
    draftId,
    adminId: req.admin?.id || "",
    adminEmail: req.admin?.email || "",
    action,
    summary: String(summary).slice(0, 500),
  }).catch(() => {});
}

function listDraft(d) {
  return {
    id: d._id.toString(),
    title: d.title,
    summary: d.summary,
    category: d.category,
    language: d.language,
    status: d.status,
    manual: Boolean(d.manual),
    targetType: d.targetType,
    sourceName: d.sourceName,
    sourceUrls: d.sourceUrls,
    sourcePublishedAt: d.sourcePublishedAt,
    generatedAt: d.generatedAt,
    createdAt: d.createdAt,
    publishAt: d.publishAt,
    publishedAt: d.publishedAt,
    warnings: d.warnings,
    validationErrors: d.validationErrors,
    needsHumanVerification: d.needsHumanVerification,
    rejectionReason: d.rejectionReason,
    lastError: d.lastError,
  };
}

function fullDraft(d) {
  return {
    ...listDraft(d),
    slug: d.slug,
    imageUrl: d.imageUrl || "",
    imageQuery: d.imageQuery || "",
    imageCredit: d.imageCredit || "",
    body: d.body,
    keyPoints: d.keyPoints,
    tags: d.tags,
    mcqs: d.mcqs,
    factCheckNotes: d.factCheckNotes,
    sourceSnippet: d.sourceSnippet,
    sourceTitle: d.sourceTitle,
    aiModel: d.aiModel,
    publishedType: d.publishedType,
    publishedRefId: d.publishedRefId ? d.publishedRefId.toString() : "",
  };
}

// ------------------------------------------------------------------
// OVERVIEW
// ------------------------------------------------------------------
router.get("/overview", async (req, res) => {
  try {
    const rows = await ContentDraft.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
    const counts = Object.fromEntries(ContentDraft.STATUSES.map((s) => [s, 0]));
    rows.forEach((r) => (counts[r._id] = r.n));

    const lastJob = await AutomationJob.findOne().sort({ startedAt: -1 }).lean();
    const cfg = settings();
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const usage = await AutomationJob.aggregate([
      { $match: { startedAt: { $gte: since } } },
      { $group: { _id: null, inT: { $sum: "$inputTokens" }, outT: { $sum: "$outputTokens" }, calls: { $sum: "$aiCalls" } } },
    ]);

    return ok(res, {
      counts,
      categories: CATEGORIES,
      settings: {
        enabled: cfg.enabled,
        intervalMinutes: cfg.intervalMinutes,
        maxDraftsPerRun: cfg.maxDraftsPerRun,
        maxDraftsPerDay: cfg.maxDraftsPerDay,
        maxItemAgeDays: cfg.maxItemAgeDays,
        model: cfg.model,
        provider: cfg.provider,
        retentionDays: retentionDays(),
        reviewHours: reviewHours(),
        photosConfigured: photosConfigured(),
        photoProvider: photoProviderInfo(),
        aiConfigured: cfg.aiConfigured,
        cronConfigured: cfg.cronConfigured,
      },
      usage24h: { inputTokens: usage[0]?.inT || 0, outputTokens: usage[0]?.outT || 0, aiCalls: usage[0]?.calls || 0 },
      lastJob,
    });
  } catch (error) {
    console.error("automation overview:", error);
    return fail(res, 500, "Failed to load overview.");
  }
});

// ------------------------------------------------------------------
// SOURCES
// ------------------------------------------------------------------
function readSource(body) {
  const name = text(body.name, 150);
  const url = text(body.url, 1000);
  if (!name) return { error: "Source name is required." };
  if (!url) return { error: "Feed URL is required." };
  try {
    assertSafeUrl(url);
  } catch (error) {
    return { error: error.message };
  }
  const category = CATEGORIES.includes(body.category) ? body.category : "National";
  return {
    value: {
      name,
      url,
      category,
      language: body.language === "hi" ? "hi" : "en",
      reliability: ["official", "high", "medium"].includes(body.reliability) ? body.reliability : "high",
      termsNote: text(body.termsNote, 500),
      active: body.active !== false,
    },
  };
}

router.get("/sources", async (req, res) => {
  const sources = await ContentSource.find().sort({ createdAt: -1 }).lean();
  return ok(res, { sources: sources.map((s) => ({ ...s, id: s._id.toString() })) });
});

router.post("/sources", async (req, res) => {
  const { value, error } = readSource(req.body || {});
  if (error) return fail(res, 400, error);
  if (await ContentSource.exists({ url: value.url })) return fail(res, 409, "This feed is already registered.");
  const source = await ContentSource.create(value);
  return ok(res, { source: { ...source.toObject(), id: source._id.toString() } }, 201);
});

router.put("/sources/:id", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid source id.");
  const { value, error } = readSource(req.body || {});
  if (error) return fail(res, 400, error);
  const source = await ContentSource.findById(req.params.id);
  if (!source) return fail(res, 404, "Source not found.");
  Object.assign(source, value);
  if (value.active) source.consecutiveFailures = 0;
  await source.save();
  return ok(res, { source: { ...source.toObject(), id: source._id.toString() } });
});

router.delete("/sources/:id", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid source id.");
  await ContentSource.findByIdAndDelete(req.params.id);
  return ok(res, {});
});

// read the feed and show titles only - nothing is saved
router.post("/sources/:id/test", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid source id.");
  const source = await ContentSource.findById(req.params.id);
  if (!source) return fail(res, 404, "Source not found.");
  try {
    const items = await readFeed(source.url);
    return ok(res, {
      count: items.length,
      sample: items.slice(0, 5).map((i) => ({ title: i.title, link: i.link, publishedAt: i.publishedAt })),
    });
  } catch (error) {
    return fail(res, 422, `Could not read this feed: ${error.message}`);
  }
});

// ------------------------------------------------------------------
// DRAFTS
// ------------------------------------------------------------------
const TAB_STATUSES = {
  pending: ["pending_review"],
  attention: ["needs_attention"],
  scheduled: ["approved", "scheduled"],
  published: ["published"],
  rejected: ["rejected"],
  failed: ["failed", "processing"],
  archived: ["archived"],
};

router.get("/drafts", async (req, res) => {
  try {
    const filter = {};
    const tab = String(req.query.tab || "pending");
    if (TAB_STATUSES[tab]) filter.status = { $in: TAB_STATUSES[tab] };

    const q = text(String(req.query.q || ""), 100);
    if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };
    if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category;
    if (validId(req.query.source)) filter.sourceId = req.query.source;

    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
      filter.createdAt = {};
      if (from && !Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
      if (to && !Number.isNaN(to.getTime())) filter.createdAt.$lte = new Date(to.getTime() + 24 * 3600 * 1000 - 1);
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 20;

    const [rows, total] = await Promise.all([
      ContentDraft.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContentDraft.countDocuments(filter),
    ]);

    return ok(res, { drafts: rows.map(listDraft), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error("automation drafts:", error);
    return fail(res, 500, "Failed to load drafts.");
  }
});

// Admin pastes the source text himself (for sites that block automatic reading,
// e.g. PIB). The AI works on exactly the pasted text, nothing is fetched.
router.post("/drafts/manual", async (req, res) => {
  const b = req.body || {};
  const link = text(b.url, 1000);
  const sourceText = text(b.text, 12000);
  const title = text(b.title, 300);

  try {
    assertSafeUrl(link);
  } catch {
    return fail(res, 400, "Please enter the full source link (starting with https://).");
  }
  if (sourceText.length < 80) return fail(res, 400, "Please paste the press release text (at least a few sentences).");
  if (!settings().aiConfigured) return fail(res, 400, "AI is not configured on the server (API key is missing).");

  const url = canonicalUrl(link);
  if (await ContentDraft.exists({ canonicalUrl: url })) {
    return fail(res, 409, "A draft for this link already exists.");
  }

  const category = CATEGORIES.includes(b.category) ? b.category : "National";
  const language = b.language === "hi" ? "hi" : "en";
  const published = b.publishedAt ? new Date(String(b.publishedAt)) : null;
  const publishedAt = published && !Number.isNaN(published.getTime()) ? published : new Date();
  const sourceName = text(b.sourceName, 150) || "Manual";
  const headline = title || sourceText.slice(0, 120);

  let draft;
  try {
    draft = await ContentDraft.create({
      title: headline.slice(0, 500),
      sourceName,
      sourceUrls: [link],
      canonicalUrl: url,
      sourcePublishedAt: publishedAt,
      sourceTitle: headline,
      sourceSnippet: sourceText,
      fetchedAt: new Date(),
      contentHash: sha(normalizeTitle(headline)),
      language,
      category,
      manual: true,
      status: "processing",
    });
  } catch (error) {
    if (error?.code === 11000) return fail(res, 409, "A draft for this link already exists.");
    throw error;
  }

  try {
    const source = { name: sourceName, reliability: "official", language, category };
    const item = { title: headline, link, publishedAt, snippet: sourceText };
    const ai = await draftFromItem(item, source);
    applyAi(draft, ai, source, item);
    await draft.save();
    await attachStockImage(draft);
    await audit(req, draft._id, "manual_create", link);
    return ok(res, { draft: listDraft(draft) }, 201);
  } catch (error) {
    draft.status = "failed";
    draft.lastError = String(error.message).slice(0, 300);
    await draft.save();
    return fail(res, 502, `The AI could not write the draft: ${error.message}. It is saved under "Failed" - open it and use Regenerate.`);
  }
});

// ---- real photos (Pexels) ----
router.get("/image-search", async (req, res) => {
  try {
    const photos = await searchPhotos(req.query.q, 12);
    return ok(res, { photos });
  } catch (error) {
    return fail(res, 400, error.message);
  }
});

router.post("/drafts/:id/image", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  const draft = await ContentDraft.findById(req.params.id);
  if (!draft) return fail(res, 404, "Draft not found.");
  if (!EDITABLE.includes(draft.status)) return fail(res, 409, "This draft can no longer be edited.");

  try {
    const stored = await storePhoto({
      src: req.body?.src,
      photographer: req.body?.photographer,
      pageUrl: req.body?.pageUrl,
    });
    draft.imageUrl = stored.imageUrl;
    draft.imageCredit = stored.credit;
    draft.imageCreditUrl = stored.creditUrl;
    await draft.save();
    await audit(req, draft._id, "photo_added", stored.credit);
    return ok(res, { imageUrl: stored.imageUrl, credit: stored.credit });
  } catch (error) {
    return fail(res, 400, error.message);
  }
});

router.get("/drafts/:id", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  const draft = await ContentDraft.findById(req.params.id).lean();
  if (!draft) return fail(res, 404, "Draft not found.");
  const history = await ReviewAudit.find({ draftId: draft._id }).sort({ createdAt: -1 }).limit(30).lean();
  return ok(res, {
    draft: fullDraft(draft),
    history: history.map((h) => ({ action: h.action, by: h.adminEmail, at: h.createdAt, summary: h.summary })),
  });
});

const EDITABLE = ["pending_review", "needs_attention", "failed", "rejected", "approved", "scheduled"];

router.put("/drafts/:id", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  const draft = await ContentDraft.findById(req.params.id);
  if (!draft) return fail(res, 404, "Draft not found.");
  if (!EDITABLE.includes(draft.status)) return fail(res, 409, "This draft can no longer be edited.");

  const b = req.body || {};
  const before = `${draft.title} | ${draft.body.length} chars`;

  if (b.title !== undefined) draft.title = text(b.title, 200);
  if (b.summary !== undefined) draft.summary = text(b.summary, 600);
  if (b.body !== undefined) draft.body = text(b.body, 20000);
  if (b.keyPoints !== undefined) {
    draft.keyPoints = (Array.isArray(b.keyPoints) ? b.keyPoints : String(b.keyPoints).split("\n"))
      .map((k) => String(k).replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  if (b.category !== undefined) draft.category = text(b.category, 100);
  if (b.imageUrl !== undefined) {
    const img = text(b.imageUrl, 1000);
    if (img && !/^https:\/\//i.test(img)) return fail(res, 400, "The image link must start with https://");
    if (img !== draft.imageUrl) {
      draft.imageCredit = "";
      draft.imageCreditUrl = "";
    }
    draft.imageUrl = img;
  }
  if (b.language !== undefined) draft.language = b.language === "hi" ? "hi" : "en";
  if (b.targetType !== undefined) draft.targetType = b.targetType === "blog" ? "blog" : "currentAffair";
  if (b.tags !== undefined) {
    draft.tags = (Array.isArray(b.tags) ? b.tags : String(b.tags).split(","))
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  if (b.sourceUrls !== undefined) {
    draft.sourceUrls = (Array.isArray(b.sourceUrls) ? b.sourceUrls : String(b.sourceUrls).split("\n"))
      .map((u) => String(u).trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  const { errors, warnings } = validateDraft(draft.toObject());
  draft.validationErrors = errors;
  draft.warnings = warnings;

  // an edit by an admin counts as a human check
  draft.factCheckStatus = "reviewed";
  draft.needsHumanVerification = false;

  // problems fixed -> a "needs attention" draft can join the review queue
  if (draft.status === "needs_attention" && !errors.length) draft.status = "pending_review";
  // editing a scheduled/approved draft sends it back to review
  if (["approved", "scheduled"].includes(draft.status)) {
    draft.status = "pending_review";
    draft.publishAt = null;
  }

  await draft.save();
  await audit(req, draft._id, "edit", `${before} -> ${draft.title} | ${draft.body.length} chars`);
  return ok(res, { draft: fullDraft(draft) });
});

router.post("/drafts/:id/approve", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  try {
    const target = req.body?.targetType;
    const draft = await publishDraft(req.params.id, { adminId: req.admin?.id, targetType: target });
    await audit(req, draft._id, "approve_publish", `Published as ${draft.publishedType}`);
    return ok(res, { draft: fullDraft(draft) });
  } catch (error) {
    if (error instanceof PublishError) return fail(res, error.status, error.message, error.details);
    console.error("automation approve:", error);
    return fail(res, 500, "Publishing failed. You can safely try again.");
  }
});

router.post("/drafts/:id/schedule", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  const when = new Date(String(req.body?.publishAt || ""));
  if (Number.isNaN(when.getTime())) return fail(res, 400, "Choose a valid date and time.");
  if (when.getTime() < Date.now() + 60 * 1000) return fail(res, 400, "The scheduled time must be in the future.");

  const draft = await ContentDraft.findById(req.params.id);
  if (!draft) return fail(res, 404, "Draft not found.");
  if (!canMove(draft.status, "scheduled")) return fail(res, 409, `A draft in "${draft.status}" status cannot be scheduled.`);

  const { errors } = validateDraft(draft.toObject());
  if (errors.length) return fail(res, 422, "The draft has problems that must be fixed first.", errors);

  if (req.body?.targetType) draft.targetType = req.body.targetType === "blog" ? "blog" : "currentAffair";
  draft.status = "scheduled";
  draft.publishAt = when;
  draft.reviewerId = req.admin?.id || "";
  draft.reviewedAt = new Date();
  await draft.save();
  await audit(req, draft._id, "schedule", when.toISOString());
  return ok(res, { draft: fullDraft(draft) });
});

// Reject = permanent delete. The story is remembered for 14 days so it is not
// suggested again, and a replacement draft is requested at once.
router.post("/drafts/:id/reject", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  const reason = text(req.body?.reason, 300);

  const draft = await ContentDraft.findById(req.params.id).lean();
  if (!draft) return fail(res, 404, "Draft not found.");
  if (!canMove(draft.status, "rejected")) return fail(res, 409, `A draft in "${draft.status}" status cannot be rejected.`);

  await audit(req, draft._id, "reject_delete", `${String(draft.title).slice(0, 200)}${reason ? ` - ${reason}` : ""}`);
  await discardDrafts([draft], "rejected");

  // ask for a new draft in its place (runs in the background)
  const cfg = settings();
  let replacement = false;
  if (!draft.manual && cfg.enabled && cfg.aiConfigured) {
    replacement = true;
    runCollection({ trigger: "replacement" }).catch((e) => console.error("replacement run:", e.message));
  }

  return ok(res, { deleted: true, replacement });
});

// bring a rejected / failed draft back to review
router.post("/drafts/:id/restore", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  const draft = await ContentDraft.findById(req.params.id);
  if (!draft) return fail(res, 404, "Draft not found.");
  if (!canMove(draft.status, "pending_review")) return fail(res, 409, `A draft in "${draft.status}" status cannot be restored.`);
  if (!draft.body) return fail(res, 409, "This draft has no text yet. Use Regenerate instead.");

  const { errors, warnings } = validateDraft(draft.toObject());
  draft.validationErrors = errors;
  draft.warnings = warnings;
  draft.status = errors.length ? "needs_attention" : "pending_review";
  draft.rejectionReason = "";
  draft.publishAt = null;
  await draft.save();
  await audit(req, draft._id, "restore", "");
  return ok(res, { draft: fullDraft(draft) });
});

router.post("/drafts/:id/archive", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  const draft = await ContentDraft.findById(req.params.id);
  if (!draft) return fail(res, 404, "Draft not found.");
  if (!canMove(draft.status, "archived")) return fail(res, 409, `A draft in "${draft.status}" status cannot be archived.`);
  draft.status = "archived";
  await draft.save();
  await audit(req, draft._id, "archive", "");
  return ok(res, {});
});

router.post("/drafts/:id/regenerate", async (req, res) => {
  if (!validId(req.params.id)) return fail(res, 400, "Invalid draft id.");
  const draft = await ContentDraft.findById(req.params.id);
  if (!draft) return fail(res, 404, "Draft not found.");
  if (!["pending_review", "needs_attention", "failed", "rejected"].includes(draft.status)) {
    return fail(res, 409, `A draft in "${draft.status}" status cannot be regenerated.`);
  }
  try {
    await regenerate(draft);
    await draft.save();
    await audit(req, draft._id, "regenerate", "");
    return ok(res, { draft: fullDraft(draft) });
  } catch (error) {
    draft.lastError = String(error.message).slice(0, 300);
    await draft.save();
    return fail(res, 502, `Regeneration failed: ${error.message}`);
  }
});

// ------------------------------------------------------------------
// JOBS
// ------------------------------------------------------------------
router.get("/jobs", async (req, res) => {
  const jobs = await AutomationJob.find().sort({ startedAt: -1 }).limit(30).lean();
  return ok(res, { jobs: jobs.map((j) => ({ ...j, id: j._id.toString() })) });
});

// start a run in the background and return at once
router.post("/run", async (req, res) => {
  const cfg = settings();
  if (!cfg.aiConfigured) return fail(res, 400, "AI is not configured on the server (API key is missing).");
  runCollection({ trigger: "manual" }).catch((e) => console.error("manual run:", e.message));
  return ok(res, { message: "Collection started. Refresh the Jobs tab in a minute." }, 202);
});

module.exports = router;
