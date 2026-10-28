// Turns the text an admin typed (or the AI wrote) into blocks that the page can
// show properly: headings, paragraphs, lists, tables, quotes, images, dividers.
//
// Nothing here produces HTML, so nothing typed in an article can run as code.
// Old articles keep working: a plain line is still one paragraph.
//
// Supported (Markdown style):
//   ## Heading        ### Smaller heading        #### Smallest
//   - bullet          1. numbered               (indent 2 spaces = nested)
//   > quote
//   | a | b |  with a  |---|---|  line under the first row = table
//   rows copied from Word / Excel (tab separated)        = table
//   ![caption](https://image-link)
//   ---               = divider
//   **bold**  *italic*  `code`  [text](https://link)  and plain https:// links

const LIST_RE = /^(\s*)([-*•–]|\d{1,3}[.)])\s+(.+)$/;
const HEADING_RE = /^(#{1,4})\s+(.+?)\s*#*\s*$/;
const HR_RE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const SEP_CELL_RE = /^\s*:?-+:?\s*$/;
const IMAGE_RE = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)\s*$/;

function splitPipeRow(line) {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|")) t = t.slice(0, -1);
  return t.split("|").map((c) => c.trim());
}

function isSeparatorRow(line) {
  if (!line || !line.includes("-")) return false;
  const cells = splitPipeRow(line);
  return cells.length >= 1 && cells.every((c) => SEP_CELL_RE.test(c));
}

function alignOf(cell) {
  const left = cell.trim().startsWith(":");
  const right = cell.trim().endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  return "left";
}

function isTabRow(line) {
  return line.includes("\t") && line.split("\t").filter((c) => c.trim() !== "").length >= 2;
}

// ---------- inline: **bold**, *italic*, `code`, [text](url), bare links ----------

const INLINE_SOURCE =
  /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|\*[^*\s][^*\n]*\*|https?:\/\/[^\s<>"')]+)/;

export function parseInline(text) {
  const out = [];
  const source = String(text || "");
  let last = 0;
  let m;

  // a fresh regex per call: the nested calls below must not share lastIndex
  const re = new RegExp(INLINE_SOURCE.source, "g");
  while ((m = re.exec(source))) {
    if (m.index > last) out.push({ t: "text", v: source.slice(last, m.index) });
    const token = m[0];

    if (token.startsWith("**") || token.startsWith("__")) {
      out.push({ t: "b", c: parseInline(token.slice(2, -2)) });
    } else if (token.startsWith("`")) {
      out.push({ t: "code", v: token.slice(1, -1) });
    } else if (token.startsWith("[")) {
      const close = token.indexOf("](");
      out.push({ t: "a", href: token.slice(close + 2, -1), c: parseInline(token.slice(1, close)) });
    } else if (token.startsWith("*")) {
      out.push({ t: "i", c: parseInline(token.slice(1, -1)) });
    } else {
      // a link at the end of a sentence: keep the full stop out of the link
      const trail = token.match(/[.,;:!?]+$/);
      const clean = trail ? token.slice(0, -trail[0].length) : token;
      out.push({ t: "a", href: clean, c: [{ t: "text", v: clean }] });
      if (trail) out.push({ t: "text", v: trail[0] });
    }
    last = m.index + token.length;
  }

  if (last < source.length) out.push({ t: "text", v: source.slice(last) });
  return out;
}

export function plainText(text) {
  return String(text || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|`)/g, "")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .trim();
}

function slugify(text) {
  const slug = plainText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

// ---------- blocks ----------

export function parseArticle(raw) {
  const lines = String(raw || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  const used = new Map();
  let i = 0;

  const nextNonEmpty = (from) => {
    for (let k = from; k < lines.length; k += 1) if (lines[k].trim()) return lines[k];
    return "";
  };

  const pushHeading = (level, rawText) => {
    const text = String(rawText).replace(/\s*:\s*$/, "");
    const base = slugify(text);
    const n = used.get(base) || 0;
    used.set(base, n + 1);
    blocks.push({ type: "heading", level, text: plainText(text), raw: text, id: n ? `${base}-${n + 1}` : base });
  };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) {
      i += 1;
      continue;
    }

    // code block
    if (t.startsWith("```")) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    // heading
    const h = t.match(HEADING_RE);
    if (h) {
      pushHeading(Math.min(4, Math.max(2, h[1].length)), h[2]);
      i += 1;
      continue;
    }

    // divider
    if (HR_RE.test(t)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // image on its own line
    const img = t.match(IMAGE_RE);
    if (img) {
      blocks.push({ type: "image", alt: img[1], src: img[2] });
      i += 1;
      continue;
    }

    // quote
    if (t.startsWith(">")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        rows.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", lines: rows.filter(Boolean).map(parseInline) });
      continue;
    }

    // table with | pipes |
    if (t.includes("|") && isSeparatorRow(lines[i + 1] || "")) {
      const head = splitPipeRow(t);
      const align = splitPipeRow(lines[i + 1]).map(alignOf);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        rows.push(splitPipeRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", head, rows, align });
      continue;
    }

    // pipe table without the --- line (rows that start and end with |)
    if (t.startsWith("|") && t.endsWith("|") && (lines[i + 1] || "").trim().startsWith("|")) {
      const all = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        all.push(splitPipeRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", head: all[0], rows: all.slice(1), align: [] });
      continue;
    }

    // table pasted from Word / Excel (cells separated by tabs)
    if (isTabRow(line) && isTabRow(lines[i + 1] || "")) {
      const all = [];
      while (i < lines.length && isTabRow(lines[i])) {
        all.push(lines[i].split("\t").map((c) => c.trim()));
        i += 1;
      }
      blocks.push({ type: "table", head: all[0], rows: all.slice(1), align: [] });
      continue;
    }

    // list
    if (LIST_RE.test(line)) {
      const items = [];
      const ordered = /^\s*\d/.test(line);
      while (i < lines.length) {
        const m = lines[i].match(LIST_RE);
        if (!m) break;
        const depth = m[1].replace(/\t/g, "  ").length >= 2 ? 1 : 0;
        // a switch between bullets and numbers starts a new list
        if (depth === 0 && /^\d/.test(m[2]) !== ordered) break;
        items.push({ depth, text: m[3] });
        i += 1;
      }
      blocks.push({ type: "list", ordered, items: items.map((x) => ({ depth: x.depth, c: parseInline(x.text) })) });
      continue;
    }

    // a short line ending with ":" is a small heading ("Key points:")
    if (t.length <= 60 && /^[^.!?|]{2,58}:$/.test(t) && nextNonEmpty(i + 1)) {
      pushHeading(3, t.slice(0, -1));
      i += 1;
      continue;
    }

    // paragraph (one line = one paragraph, same as before)
    blocks.push({ type: "p", c: parseInline(t) });
    i += 1;
  }

  const toc = blocks.filter((b) => b.type === "heading" && b.level <= 3).map((b) => ({ id: b.id, text: b.text, level: b.level }));
  return { blocks, toc };
}
