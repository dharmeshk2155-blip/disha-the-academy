// Shared settings for the automated content system.

// Same names the admin panel / website already use for Current Affairs.
const CATEGORIES = [
  "National",
  "International",
  "Economy",
  "Science & Technology",
  "Sports",
  "Awards & Honours",
  "Appointments",
  "Defence",
  "Environment",
  "Government Schemes",
  "Reports & Indexes",
  "Important Days",
  "Himachal Pradesh",
  "Other",
];

// allowed status changes (checked on the server, never trusted from the browser)
const TRANSITIONS = {
  discovered: ["processing", "failed"],
  processing: ["pending_review", "needs_attention", "failed"],
  pending_review: ["approved", "scheduled", "rejected", "published", "needs_attention", "archived"],
  needs_attention: ["pending_review", "approved", "scheduled", "rejected", "published", "archived"],
  approved: ["published", "scheduled", "rejected", "pending_review"],
  scheduled: ["published", "pending_review", "rejected"],
  published: ["archived"],
  rejected: ["pending_review", "archived"],
  failed: ["pending_review", "needs_attention", "rejected", "archived"],
  archived: [],
};

function canMove(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

function num(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function settings() {
  const provider = process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "gemini";
  return {
    enabled: process.env.AUTOMATION_ENABLED === "true",
    intervalMinutes: Math.max(15, num("AUTOMATION_INTERVAL_MINUTES", 360)),
    maxDraftsPerRun: num("AUTOMATION_MAX_DRAFTS_PER_RUN", 5),
    maxDraftsPerDay: num("AUTOMATION_MAX_DRAFTS_PER_DAY", 5),
    maxItemAgeDays: num("AUTOMATION_MAX_ITEM_AGE_DAYS", 3),
    maxInputTokensPerDay: num("AUTOMATION_MAX_INPUT_TOKENS_PER_DAY", 200000),
    provider,
    model:
      process.env.AUTOMATION_AI_MODEL ||
      (provider === "gemini" ? "gemini-3.5-flash-lite" : "claude-sonnet-5-5"),
    aiConfigured: Boolean(
      provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY
    ),
    cronConfigured: String(process.env.CRON_SECRET || "").length >= 16,
  };
}

module.exports = { CATEGORIES, TRANSITIONS, canMove, settings };
