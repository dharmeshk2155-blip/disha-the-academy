// Small RSS / Atom reader (no extra packages).
// Only feeds are read - pages behind logins or paywalls are never fetched.

const crypto = require("crypto");

const MAX_BYTES = 2 * 1024 * 1024;

function isPrivateHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (h.includes(":")) return true; // IPv6 literals are not needed for feeds
  return false;
}

function assertSafeUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https URLs are allowed");
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new Error("Private or local addresses are not allowed");
  }
  return parsed;
}

function canonicalUrl(value) {
  try {
    const u = new URL(value);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    [...u.searchParams.keys()].forEach((key) => {
      if (/^(utm_|fbclid|gclid|ref$|ref_src|source$)/i.test(key)) u.searchParams.delete(key);
    });
    u.searchParams.sort();
    let out = u.toString();
    if (u.pathname !== "/" && out.endsWith("/")) out = out.slice(0, -1);
    return out;
  } catch {
    return "";
  }
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(text) {
  return String(text || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => (ENTITIES[n.toLowerCase()] ?? m));
}

function stripHtml(text) {
  return decode(decode(text))
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, names) {
  for (const name of names) {
    const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
    if (m) return m[1];
  }
  return "";
}

function atomLink(block) {
  const alt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
  if (alt) return alt[1];
  const any = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return any ? any[1] : "";
}

function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];

  for (const block of blocks) {
    const title = stripHtml(tag(block, ["title"]));
    const link = decode(tag(block, ["link"])).trim() || atomLink(block);
    const dateText = decode(tag(block, ["pubDate", "dc:date", "published", "updated"])).trim();
    const snippet = stripHtml(tag(block, ["content:encoded", "description", "summary", "content"]));
    const date = dateText ? new Date(dateText) : null;

    if (!title || !link) continue;

    items.push({
      title,
      link: decode(link).trim(),
      publishedAt: date && !Number.isNaN(date.getTime()) ? date : null,
      snippet: snippet.slice(0, 3000),
    });
  }

  return items;
}

async function fetchWithRetry(url, { timeoutMs = 15000, retries = 2 } = {}) {
  assertSafeUrl(url);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "DishaTheAcademyBot/1.0 (+feed reader; contact site admin)",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > MAX_BYTES) throw new Error("Feed is too large");
      return buffer.toString("utf8");
    } catch (error) {
      lastError = error.name === "AbortError" ? new Error("Timed out") : error;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000 * 3 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

async function readFeed(url) {
  const xml = await fetchWithRetry(url);
  const items = parseFeed(xml);
  if (!items.length && !/<(rss|feed|rdf)/i.test(xml)) {
    throw new Error("This URL does not look like an RSS/Atom feed");
  }
  return items;
}

function sha(text) {
  return crypto.createHash("sha1").update(text).digest("hex");
}

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const A = new Set(normalizeTitle(a).split(" ").filter((w) => w.length > 2));
  const B = new Set(normalizeTitle(b).split(" ").filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let common = 0;
  A.forEach((w) => B.has(w) && (common += 1));
  return common / (A.size + B.size - common);
}

module.exports = {
  assertSafeUrl,
  canonicalUrl,
  readFeed,
  parseFeed,
  normalizeTitle,
  similarity,
  sha,
  stripHtml,
};
