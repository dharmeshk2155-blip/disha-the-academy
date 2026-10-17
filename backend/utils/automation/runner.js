// Orchestrates one collection run: collect -> filter -> AI draft -> validate -> queue.
// Nothing here ever publishes. Everything lands in pending_review / needs_attention.

const ContentSource = require("../../models/ContentSource");
const ContentDraft = require("../../models/ContentDraft");
const AutomationJob = require("../../models/AutomationJob");
const { readFeed, canonicalUrl, normalizeTitle, similarity, sha } = require("./rss");
const { draftFromItem } = require("./drafter");
const { normalizeAi, validateDraft } = require("./validator");
const { settings, CATEGORIES } = require("./constants");
const { publishDue } = require("./publisher");
const { cleanupOldCurrentAffairs } = require("./cleanup");
const { attachStockImage } = require("./stockImage");

const DAY = 24 * 3600 * 1000;
let running = false;

function short(error) {
  return String(error?.message || error).slice(0, 300);
}

// Fills a draft document from the AI answer and runs validation.
function applyAi(draft, ai, source, item) {
  const fields = normalizeAi(ai.json, { category: source.category, language: source.language });

  // the original source link is always kept, whatever the model returned
  const urls = new Set([item.link, ...fields.sourceUrls.filter((u) => /^https?:\/\//i.test(u))]);

  draft.title = fields.title || item.title;
  draft.slug = fields.slug;
  draft.language = fields.language;
  draft.summary = fields.summary;
  draft.body = fields.body;
  draft.keyPoints = fields.keyPoints;
  draft.category = CATEGORIES.includes(fields.category) ? fields.category : source.category;
  draft.tags = fields.tags;
  draft.imageQuery = fields.imageQuery;
  draft.mcqs = fields.mcqs;
  draft.sourceUrls = [...urls];
  draft.factCheckNotes = fields.factCheckNotes;
  draft.needsHumanVerification = fields.needsHumanVerification;
  draft.factCheckStatus = fields.needsHumanVerification || fields.factCheckNotes.length ? "flagged" : "unchecked";
  draft.generatedAt = new Date();
  draft.aiModel = ai.model;
  draft.rawAiOutput = ai.text.slice(0, 20000);

  const { errors, warnings } = validateDraft(draft.toObject());
  if (!(draft.sourceSnippet || "").trim()) warnings.push("The feed gave no text, so the draft rests on the headline only. Verify everything.");

  draft.validationErrors = errors;
  draft.warnings = warnings;
  draft.status = errors.length ? "needs_attention" : "pending_review";
  draft.lastError = "";
  return draft;
}

async function runCollection({ trigger = "manual" } = {}) {
  const cfg = settings();

  if (running) return { skipped: true, reason: "A run is already in progress." };
  const recent = await AutomationJob.findOne({ status: "running", startedAt: { $gt: new Date(Date.now() - 20 * 60 * 1000) } });
  if (recent) return { skipped: true, reason: "A run is already in progress." };

  running = true;
  const job = await AutomationJob.create({ trigger });

  try {
    if (!cfg.aiConfigured) {
      job.errorLog.push("AI is not configured (API key is missing). No drafts were created.");
      job.status = "failed";
      return { job };
    }

    const since = new Date(Date.now() - DAY);
    let createdToday = await ContentDraft.countDocuments({ createdAt: { $gte: since }, canonicalUrl: { $ne: "" }, manual: { $ne: true }, status: { $nin: ["failed", "rejected"] } });
    const tokenRows = await AutomationJob.aggregate([
      { $match: { startedAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: "$inputTokens" } } },
    ]);
    let tokensToday = tokenRows[0]?.total || 0;

    const recentDrafts = await ContentDraft.find({ createdAt: { $gte: new Date(Date.now() - 3 * DAY) } })
      .select("title contentHash")
      .limit(500)
      .lean();

    const sources = await ContentSource.find({ active: true });
    let createdThisRun = 0;
    let stop = "";

    for (const source of sources) {
      if (stop) break;
      job.sourcesChecked += 1;

      let items;
      try {
        items = await readFeed(source.url);
        source.lastCheckedAt = new Date();
        source.lastError = "";
        source.consecutiveFailures = 0;
        await source.save();
      } catch (error) {
        source.lastCheckedAt = new Date();
        source.lastError = short(error);
        source.consecutiveFailures += 1;
        await source.save();
        job.errorLog.push(`Source "${source.name}": ${short(error)}`);
        continue;
      }

      items.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
      job.itemsFound += items.length;

      for (const item of items) {
        if (createdThisRun >= cfg.maxDraftsPerRun) { stop = "per-run limit"; break; }
        if (createdToday >= cfg.maxDraftsPerDay) { stop = "daily limit"; break; }
        if (tokensToday >= cfg.maxInputTokensPerDay) { stop = "daily AI usage ceiling"; break; }

        if (item.publishedAt && Date.now() - item.publishedAt.getTime() > cfg.maxItemAgeDays * DAY) {
          job.skippedOld += 1;
          continue;
        }

        const url = canonicalUrl(item.link);
        if (!url) continue;

        const hash = sha(normalizeTitle(item.title));
        const similar = recentDrafts.some(
          (d) => d.contentHash === hash || similarity(d.title, item.title) >= 0.8
        );

        if (similar || (await ContentDraft.exists({ canonicalUrl: url }))) {
          job.duplicates += 1;
          continue;
        }

        // reserve the URL first - a second run can never pick up the same story
        let draft;
        try {
          draft = await ContentDraft.create({
            title: item.title.slice(0, 500),
            sourceId: source._id,
            sourceName: source.name,
            sourceUrls: [item.link],
            canonicalUrl: url,
            sourcePublishedAt: item.publishedAt,
            sourceTitle: item.title,
            sourceSnippet: item.snippet,
            fetchedAt: new Date(),
            contentHash: hash,
            language: source.language,
            category: source.category,
            status: "processing",
            jobId: job._id,
          });
        } catch (error) {
          if (error?.code === 11000) { job.duplicates += 1; continue; }
          throw error;
        }

        recentDrafts.push({ title: item.title, contentHash: hash });

        try {
          job.aiCalls += 1;
          const ai = await draftFromItem(item, source);
          job.inputTokens += ai.inputTokens;
          job.outputTokens += ai.outputTokens;
          tokensToday += ai.inputTokens;
          applyAi(draft, ai, source, item);
          if (draft.status === "needs_attention") job.needsAttention += 1;
          await draft.save();
          await attachStockImage(draft); // real photo, if Pexels is set up
          job.draftsCreated += 1;
          createdThisRun += 1;
          createdToday += 1;
        } catch (error) {
          draft.status = "failed";
          draft.lastError = short(error);
          await draft.save();
          job.errorLog.push(`"${item.title.slice(0, 60)}": ${short(error)}`);
          if (error.fatal) { stop = "AI key problem"; break; }
        }
      }
    }

    if (stop) {
      // hitting a limit is normal, not an error
      if (stop === "AI key problem") job.errorLog.push("Run stopped early: the AI key was refused.");
      else job.notes.push(`Run stopped at the ${stop}. Raise it in .env if you want more drafts.`);
    }
    job.status = job.errorLog.length ? (job.draftsCreated ? "partial" : "failed") : "success";
    return { job };
  } catch (error) {
    job.errorLog.push(short(error));
    job.status = "failed";
    return { job };
  } finally {
    job.finishedAt = new Date();
    await job.save().catch(() => {});
    running = false;
  }
}

// Re-run the AI for one draft (admin "Regenerate"). Uses the stored source text only.
async function regenerate(draft) {
  const source = (await ContentSource.findById(draft.sourceId)) || {
    name: draft.sourceName, reliability: "medium", language: draft.language, category: draft.category,
  };
  const item = {
    title: draft.sourceTitle || draft.title,
    link: draft.sourceUrls[0] || draft.canonicalUrl,
    publishedAt: draft.sourcePublishedAt,
    snippet: draft.sourceSnippet,
  };
  const ai = await draftFromItem(item, source);
  applyAi(draft, ai, source, item);
  draft.reviewerId = "";
  draft.rejectionReason = "";
  return { draft, ai };
}

function startScheduler() {
  const cfg = settings();

  // scheduled publishing needs no AI, so it always runs
  setInterval(() => publishDue().catch((e) => console.error("publishDue:", e.message)), 60 * 1000).unref();

  // old current affairs are removed whether or not the collector is on
  const clean = () => cleanupOldCurrentAffairs().catch((e) => console.error("cleanup:", e.message));
  setTimeout(clean, 2 * 60 * 1000).unref();
  setInterval(clean, 6 * 3600 * 1000).unref();

  if (!cfg.enabled) {
    console.log("Automation: collector is OFF (set AUTOMATION_ENABLED=true to turn it on).");
    return;
  }

  console.log(`Automation: collector runs every ${cfg.intervalMinutes} min.`);
  const tick = () => runCollection({ trigger: "schedule" }).catch((e) => console.error("collector:", e.message));
  setTimeout(tick, 60 * 1000).unref();
  setInterval(tick, cfg.intervalMinutes * 60 * 1000).unref();
}

module.exports = { runCollection, regenerate, startScheduler, applyAi };
