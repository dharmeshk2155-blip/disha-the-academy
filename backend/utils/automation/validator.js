const { CATEGORIES } = require("./constants");

function isHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function list(value) {
  return Array.isArray(value)
    ? value.map((v) => String(v || "").trim()).filter(Boolean)
    : [];
}

// Cleans the model output into the draft shape. Never throws.
function normalizeAi(raw, fallback = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  const mcqs = Array.isArray(r.optional_mcqs || r.mcqs)
    ? (r.optional_mcqs || r.mcqs).map((q) => ({
        question: String(q?.question || "").trim(),
        options: list(q?.options),
        answerIndex: Number.isInteger(q?.answerIndex ?? q?.answer_index) ? (q.answerIndex ?? q.answer_index) : -1,
        explanation: String(q?.explanation || "").trim(),
      }))
    : [];

  return {
    title: String(r.title || "").trim(),
    slug: String(r.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120),
    language: r.language === "hi" ? "hi" : r.language === "en" ? "en" : fallback.language || "en",
    summary: String(r.summary || "").trim(),
    body: String(r.article_body || r.body || "").trim(),
    keyPoints: list(r.key_points || r.keyPoints),
    category: String(r.category || fallback.category || "").trim(),
    tags: list(r.tags).slice(0, 10),
    sourceUrls: list(r.source_urls || r.sourceUrls),
    factCheckNotes: list(r.fact_check_notes || r.factCheckNotes),
    needsHumanVerification: Boolean(r.needs_human_verification ?? r.needsHumanVerification),
    imageQuery: String(r.image_query || r.imageQuery || "").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80),
    mcqs,
  };
}

// Returns { errors: [...], warnings: [...] }.
// errors  -> cannot be published (draft goes to Needs Attention)
// warnings-> shown to the reviewer, publishing still possible
function validateDraft(d) {
  const errors = [];
  const warnings = [];

  const title = String(d.title || "").trim();
  const summary = String(d.summary || "").trim();
  const body = String(d.body || "").trim();

  if (!title) errors.push("Title is empty.");
  else if (title.length > 200) errors.push("Title is longer than 200 characters.");

  if (!summary) errors.push("Summary is empty.");
  else if (summary.length > 600) errors.push("Summary is longer than 600 characters.");

  if (!body) errors.push("Article body is empty.");
  else if (body.length < 200) errors.push("Article body is too short (minimum 200 characters).");

  if (!CATEGORIES.includes(d.category)) errors.push(`Category "${d.category || ""}" is not valid.`);
  if (!["en", "hi"].includes(d.language)) errors.push("Language must be English or Hindi.");

  const urls = Array.isArray(d.sourceUrls) ? d.sourceUrls : [];
  if (!urls.length) errors.push("At least one source link is required.");
  else if (!urls.every(isHttpUrl)) errors.push("A source link is not a valid http(s) URL.");

  if (d.sourcePublishedAt) {
    const t = new Date(d.sourcePublishedAt).getTime();
    if (Number.isNaN(t)) errors.push("Source publication date is invalid.");
    else if (t > Date.now() + 24 * 3600 * 1000) errors.push("Source publication date is in the future.");
    else if (Date.now() - t > 14 * 24 * 3600 * 1000) warnings.push("Source is more than 14 days old.");
  } else {
    warnings.push("Source publication date is missing - verify before publishing.");
  }

  const points = Array.isArray(d.keyPoints) ? d.keyPoints : [];
  if (points.length < 3) warnings.push("Fewer than 3 key points.");

  (d.mcqs || []).forEach((q, i) => {
    const n = i + 1;
    if (!q.question) errors.push(`MCQ ${n}: question is empty.`);
    else if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`MCQ ${n}: needs exactly 4 options.`);
    else if (new Set(q.options.map((o) => o.toLowerCase())).size !== 4) errors.push(`MCQ ${n}: options must be different.`);
    else if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) errors.push(`MCQ ${n}: correct answer is missing.`);
    else if (!q.explanation) errors.push(`MCQ ${n}: explanation is missing.`);
  });

  if (d.needsHumanVerification) warnings.push("The AI flagged facts that need human verification.");
  if (/verify required/i.test(body)) warnings.push('The text contains "verify required" markers.');

  return { errors, warnings };
}

module.exports = { normalizeAi, validateDraft };
