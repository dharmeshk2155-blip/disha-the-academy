import { getSubExam } from "../../data/examTaxonomy";
import { NOTE_CATEGORIES } from "../../data/notesContent";

// ======================================================
// Helpers for the home page. Pure functions only (no React),
// so they are easy to test and reuse.
// ======================================================

const norm = (value) => String(value || "").trim().toLowerCase();

/* ---------------------------------------------
   TEXT
--------------------------------------------- */

export function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function readMinutes(...parts) {
  const words = stripHtml(parts.filter(Boolean).join(" "))
    .split(" ")
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}

export function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function shortText(value, max = 130) {
  const text = stripHtml(value);

  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/* ---------------------------------------------
   CATEGORY BADGES (current affairs / blog)
   Text/background pairs picked to stay readable.
--------------------------------------------- */

const BADGE_RULES = [
  { match: /national|india/i, fg: "#1d4ed8", bg: "#dbe7ff" },
  { match: /econom|business|bank/i, fg: "#b45309", bg: "#ffedd5" },
  { match: /international|world|global/i, fg: "#0f766e", bg: "#d6f5ee" },
  { match: /science|tech/i, fg: "#6d28d9", bg: "#ede4ff" },
  { match: /sport/i, fg: "#be123c", bg: "#ffe4ea" },
];

const BADGE_FALLBACKS = [
  { fg: "#9a3412", bg: "#ffe8d9" },
  { fg: "#166534", bg: "#dcf5e3" },
  { fg: "#1e3a8a", bg: "#e2e9fb" },
  { fg: "#7e22ce", bg: "#f3e5ff" },
];

export function badgeTone(category) {
  const text = String(category || "");

  const rule = BADGE_RULES.find((item) => item.match.test(text));

  if (rule) return { color: rule.fg, background: rule.bg };

  let hash = 0;

  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }

  const fallback = BADGE_FALLBACKS[hash % BADGE_FALLBACKS.length];

  return { color: fallback.fg, background: fallback.bg };
}

/* ---------------------------------------------
   STUDY NOTES -> one card per category
--------------------------------------------- */

const NOTE_TONES = [
  "#4c3fa0",
  "#1f7a5a",
  "#2f80ed",
  "#e8590c",
  "#4a56c9",
  "#c98a12",
];

const LABEL_SKIP = new Set([
  "notes",
  "note",
  "study",
  "material",
  "materials",
  "exam",
  "exams",
  "and",
  "the",
  "of",
  "for",
  "&",
]);

// "HP General Knowledge" -> "HP GK", "HP Police Constable" -> "HP PC"
// Titles that do not start with a short acronym get no text label.
export function tileLabel(title) {
  const words = String(title || "").trim().split(/\s+/).filter(Boolean);

  if (words.length < 2 || !/^[A-Z]{2,3}$/.test(words[0])) return "";

  const rest = words
    .slice(1)
    .filter((word) => !LABEL_SKIP.has(word.toLowerCase()));

  if (!rest.length) return words[0];

  const tail = /^[A-Z]{2,4}$/.test(rest[0])
    ? rest[0]
    : rest
        .map((word) => word[0].toUpperCase())
        .join("")
        .slice(0, 2);

  return `${words[0]} ${tail}`;
}

export function priceText(card) {
  if (card.price === 0) return "Free";

  return card.hasRange ? `From ₹${card.price}` : `₹${card.price}`;
}

export function buildNoteCards(notes, limit = 6) {
  const groups = new Map();

  for (const note of notes || []) {
    const slug = note?.categorySlug;

    if (!slug || note.isActive === false) continue;

    // Skip "coming soon" notes (no PDF and no text content yet)
    if (!note.pdf && !note.hasContent) continue;

    let group = groups.get(slug);

    if (!group) {
      group = {
        slug,
        title: note.categoryTitle || slug,
        prices: [],
        subs: [],
      };

      groups.set(slug, group);
    }

    group.prices.push(Number(note.price) || 0);

    if (note.subcategoryTitle && !group.subs.includes(note.subcategoryTitle)) {
      group.subs.push(note.subcategoryTitle);
    }
  }

  return [...groups.values()].slice(0, limit).map((group, index) => {
    const min = Math.min(...group.prices);
    const max = Math.max(...group.prices);
    const meta = NOTE_CATEGORIES.find((item) => item.slug === group.slug);

    return {
      slug: group.slug,
      title: group.title,
      subtitle: meta?.subject || group.subs.slice(0, 2).join(", "),
      label: tileLabel(group.title),
      tone: NOTE_TONES[index % NOTE_TONES.length],
      price: min,
      hasRange: max !== min,
    };
  });
}

/* ---------------------------------------------
   MOCK TESTS -> tabs
--------------------------------------------- */

const TEST_TABS = [
  { key: "popular", label: "Popular" },
  { key: "ssc", label: "SSC", match: (t) => t.topCategory === "ssc" },
  { key: "hp", label: "HP Exams", match: (t) => t.subExam === "state-police" },
  { key: "banking", label: "Banking", match: (t) => t.topCategory === "banking" },
  { key: "railway", label: "Railway", match: (t) => t.topCategory === "railway" },
  { key: "teaching", label: "Teaching", match: (t) => t.topCategory === "teaching" },
];

function shapeTest(test) {
  const questions = Number(test.totalQuestions) || 0;
  const perQuestion = Number(test.marksPerCorrect) || 0;

  return {
    id: test.id,
    title: test.title || "Mock Test",
    topCategory: norm(test.topCategory),
    subExam: norm(test.subExam),
    isFree: test.isFree === true,
    questions,
    marks: Math.round(questions * perQuestion * 100) / 100,
    // the API sends duration in seconds
    minutes: Math.round((Number(test.duration) || 0) / 60),
  };
}

// Biggest tests first, but one per exam category before repeating
function pickPopular(tests, count) {
  const sorted = [...tests].sort((a, b) => b.questions - a.questions);
  const picked = [];
  const seen = new Set();

  for (const test of sorted) {
    if (picked.length === count) break;

    if (!seen.has(test.topCategory)) {
      seen.add(test.topCategory);
      picked.push(test);
    }
  }

  for (const test of sorted) {
    if (picked.length === count) break;

    if (!picked.includes(test)) picked.push(test);
  }

  return picked;
}

export function buildTestTabs(rawTests, perTab = 4) {
  const tests = (rawTests || [])
    .map(shapeTest)
    .filter((test) => test.id != null && test.questions > 0);

  return TEST_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    tests:
      tab.key === "popular"
        ? pickPopular(tests, perTab)
        : tests.filter(tab.match).slice(0, perTab),
  })).filter((tab) => tab.tests.length > 0);
}

export function testLogoUrl(test) {
  return getSubExam(test.topCategory, test.subExam)?.iconUrl || "";
}