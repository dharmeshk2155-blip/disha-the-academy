// When the admin pastes from Word, Google Docs, a web page or ChatGPT the
// clipboard also holds the formatting (headings, tables, lists, bold).
// This turns that formatting into the article text format, so a plain
// "paste" is enough to get a clean layout. Only text is taken: no HTML,
// styles or scripts are ever kept.

const SKIP = new Set(["SCRIPT", "STYLE", "META", "LINK", "HEAD", "TITLE", "NOSCRIPT", "SVG", "IFRAME", "BUTTON", "INPUT", "SELECT", "TEXTAREA"]);
const BLOCK = new Set(["P", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "ASIDE", "FIGURE", "FIGCAPTION", "DETAILS", "SUMMARY", "ADDRESS"]);

function styleOf(el) {
  return String(el.getAttribute?.("style") || "").toLowerCase().replace(/\s+/g, "");
}

function isBold(el) {
  const s = styleOf(el);
  if (el.tagName === "B" || el.tagName === "STRONG") return !/font-weight:(normal|400)/.test(s);
  return /font-weight:(bold|[6-9]00)/.test(s);
}

function isItalic(el) {
  const s = styleOf(el);
  if (el.tagName === "EM" || el.tagName === "I") return !/font-style:normal/.test(s);
  return /font-style:italic/.test(s);
}

function headingLevel(el) {
  const m = el.tagName.match(/^H([1-6])$/);
  if (m) return Math.min(4, Math.max(2, Number(m[1])));
  // Word: <p class=MsoHeading2>, <p class="Heading 1">
  const cls = String(el.getAttribute?.("class") || "");
  const w = cls.match(/heading\s*([1-6])/i);
  if (el.tagName === "P" && w) return Math.min(4, Math.max(2, Number(w[1])));
  if (el.tagName === "P" && /MsoTitle/i.test(cls)) return 2;
  return 0;
}

const BLOCK_SELECTOR = "p,div,section,article,header,footer,main,aside,figure,h1,h2,h3,h4,h5,h6,ul,ol,li,table,blockquote,pre,hr,img";

// a block itself, or an inline wrapper (like Google Docs' <b>) that holds blocks
function isBlockLike(el) {
  return el.nodeType === 1 && (BLOCK.has(el.tagName) || Boolean(headingLevel(el)) || /^(H[1-6]|UL|OL|TABLE|BLOCKQUOTE|PRE|HR|IMG)$/.test(el.tagName) || Boolean(el.querySelector?.(BLOCK_SELECTOR)));
}

function clean(text) {
  return String(text).replace(/ /g, " ").replace(/[ \t]+/g, " ");
}

function inlineMd(node) {
  if (node.nodeType === 3) return clean(node.nodeValue);
  if (node.nodeType !== 1 || SKIP.has(node.tagName.toUpperCase())) return "";

  if (node.tagName === "BR") return " ";

  const inner = Array.from(node.childNodes).map(inlineMd).join("");
  const text = inner.trim();
  if (!text) return inner;

  const lead = inner.match(/^\s*/)[0];
  const trail = inner.match(/\s*$/)[0];
  let out = text;

  if (node.tagName === "A") {
    const href = node.getAttribute("href") || "";
    if (/^https?:\/\//i.test(href) && href !== text) out = `[${text}](${href})`;
  } else if (node.tagName === "CODE") {
    out = `\`${text}\``;
  } else {
    if (isItalic(node)) out = `*${out}*`;
    if (isBold(node)) out = `**${out}**`;
  }
  return lead + out + trail;
}

function cellText(cell) {
  return inlineMd(cell).replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

function tableMd(table) {
  const rows = Array.from(table.querySelectorAll("tr")).map((tr) =>
    Array.from(tr.children)
      .filter((c) => c.tagName === "TD" || c.tagName === "TH")
      .map(cellText)
  ).filter((r) => r.length);

  if (!rows.length) return "";
  const cols = Math.max(...rows.map((r) => r.length));
  const pad = (r) => Array.from({ length: cols }, (_, i) => r[i] || "");
  const line = (r) => `| ${pad(r).join(" | ")} |`;

  return [line(rows[0]), `| ${Array(cols).fill("---").join(" | ")} |`, ...rows.slice(1).map(line)].join("\n");
}

function listMd(list, depth) {
  const ordered = list.tagName === "OL";
  let n = 0;
  const lines = [];

  Array.from(list.children).forEach((li) => {
    if (li.tagName !== "LI") return;
    n += 1;

    const own = [];
    const nested = [];
    Array.from(li.childNodes).forEach((c) => {
      if (c.nodeType === 1 && (c.tagName === "UL" || c.tagName === "OL")) nested.push(c);
      else own.push(c);
    });

    const text = own.map(inlineMd).join("").replace(/\s+/g, " ").trim();
    if (text) lines.push(`${"  ".repeat(Math.min(depth, 1))}${ordered ? `${n}.` : "-"} ${text}`);
    nested.forEach((sub) => lines.push(listMd(sub, depth + 1)));
  });

  return lines.join("\n");
}

function blockMd(node, depth = 0) {
  if (node.nodeType === 3) {
    const t = clean(node.nodeValue);
    return t.trim() ? t : "";
  }
  if (node.nodeType !== 1) return "";

  const tag = node.tagName.toUpperCase();
  if (SKIP.has(tag)) return "";

  const level = headingLevel(node);
  if (level) {
    const text = inlineMd(node).replace(/\s+/g, " ").trim().replace(/^\*\*(.+)\*\*$/, "$1");
    return text ? `\n\n${"#".repeat(level)} ${text}\n\n` : "";
  }

  if (tag === "TABLE") return `\n\n${tableMd(node)}\n\n`;
  if (tag === "UL" || tag === "OL") return `\n\n${listMd(node, 0)}\n\n`;
  if (tag === "HR") return "\n\n---\n\n";
  if (tag === "BR") return "\n";

  if (tag === "IMG") {
    const src = node.getAttribute("src") || "";
    return /^https?:\/\//i.test(src) ? `\n\n![${(node.getAttribute("alt") || "").replace(/[\]\n]/g, " ")}](${src})\n\n` : "";
  }

  if (tag === "PRE") return `\n\n\`\`\`\n${node.textContent.replace(/\n+$/, "")}\n\`\`\`\n\n`;

  if (tag === "BLOCKQUOTE") {
    const body = Array.from(node.childNodes).map((c) => blockMd(c, depth + 1)).join("").trim();
    return body ? `\n\n${body.split("\n").filter((l) => l.trim()).map((l) => `> ${l}`).join("\n")}\n\n` : "";
  }

  // does it hold block children? then walk them, otherwise it is one paragraph
  const hasBlockChild = Array.from(node.children).some(isBlockLike);

  if (hasBlockChild) {
    // inline pieces between blocks are kept as their own paragraph
    let out = "";
    let run = "";
    const flush = () => {
      const t = run.replace(/\s+/g, " ").trim();
      if (t) out += `\n\n${t}\n\n`;
      run = "";
    };
    Array.from(node.childNodes).forEach((c) => {
      if (isBlockLike(c)) {
        flush();
        out += blockMd(c, depth);
      } else {
        run += inlineMd(c);
      }
    });
    flush();
    return out;
  }

  if (BLOCK.has(tag) || tag === "LI") {
    const t = inlineMd(node).replace(/\s+/g, " ").trim();
    return t ? `\n\n${t}\n\n` : "";
  }

  // span / bold / unknown wrapper with only inline content = one paragraph
  const t = inlineMd(node).replace(/\s+/g, " ").trim();
  return t ? `\n\n${t}\n\n` : "";
}

export function htmlToArticle(html) {
  if (!html || typeof DOMParser === "undefined") return "";

  let doc;
  try {
    doc = new DOMParser().parseFromString(String(html), "text/html");
  } catch {
    return "";
  }

  const md = blockMd(doc.body)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return md;
}
