/* =====================================================
   WORD (.docx) -> NOTES

   1. Mammoth reads the .docx (text, headings, lists, tables) and hands
      over every embedded image IN DOCUMENT ORDER; each image is saved
      (see mediaStorage.js) and replaced by its public URL.
   2. The resulting HTML is turned into ordered BLOCKS (JSON):
        heading   { type, level, html }
        paragraph { type, html }
        image     { type, url, alt, caption }
        list      { type, ordered, items: [{ html, level }] }
        table     { type, header, rows: [[html, ...], ...] }
      so every image keeps the exact place it had in Word.
   3. blocksToHtml() builds the clean HTML that the existing Read Note
      page already knows how to show.

   Nothing here trusts its input: every piece of text goes through
   cleanInline() (small whitelist of tags) and validateBlocks().
===================================================== */

const MAX_IMAGES = 60;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

const BROKEN = "about:broken-image";

const LIMITS = {
  blocks: 3000,
  html: 20000,
  listItems: 500,
  tableRows: 300,
  tableCols: 20,
  caption: 300,
};

/* ---------------------------------------------------
   small helpers
--------------------------------------------------- */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeEntities(text) {
  return String(text ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    )
    .replace(/&amp;/gi, "&");
}

// visible text of an html fragment
function plainText(html) {
  return decodeEntities(
    String(html ?? "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAttr(attrs, name) {
  const match = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    "i"
  ).exec(attrs || "");

  return match ? match[1] ?? match[2] ?? "" : "";
}

function isSafeHref(href) {
  return /^(https?:\/\/|mailto:)/i.test(String(href || "").trim());
}

function isSafeImageUrl(url) {
  return /^(https?:\/\/\S+|\/uploads\/\S+)$/i.test(String(url || "").trim());
}

/* ---------------------------------------------------
   cleanInline: keep only bold / italic / underline / sup / sub /
   line break / safe links. Everything else is dropped.
--------------------------------------------------- */
const INLINE_TAGS = {
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
  u: "u",
  sup: "sup",
  sub: "sub",
};

function cleanInline(html) {
  // <script> / <style> are removed together with everything inside them
  const input = String(html ?? "").replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    ""
  );
  const tagPattern = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)>/g;

  let out = "";
  let last = 0;
  let match;

  const anchors = []; // true = this <a> was kept
  const open = []; // open inline tags we wrote

  const text = (chunk) =>
    chunk.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  while ((match = tagPattern.exec(input))) {
    out += text(input.slice(last, match.index));
    last = tagPattern.lastIndex;

    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();

    if (tag === "br") {
      if (!closing) out += "<br>";
    } else if (tag === "a") {
      if (closing) {
        if (anchors.pop()) out += "</a>";
      } else {
        const href = getAttr(match[3], "href");

        if (isSafeHref(href)) {
          out += `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`;
          anchors.push(true);
        } else {
          anchors.push(false);
        }
      }
    } else if (INLINE_TAGS[tag]) {
      const name = INLINE_TAGS[tag];

      if (closing) {
        const at = open.lastIndexOf(name);

        if (at !== -1) {
          open.splice(at, 1);
          out += `</${name}>`;
        }
      } else {
        open.push(name);
        out += `<${name}>`;
      }
    }
    // any other tag is simply dropped
  }

  out += text(input.slice(last));

  // never leave a tag open
  while (open.length) out += `</${open.pop()}>`;
  while (anchors.length) if (anchors.pop()) out += "</a>";

  return out.replace(/(?:<br>\s*){3,}/g, "<br><br>").trim();
}

/* ---------------------------------------------------
   splitTopLevel: the block elements that sit directly inside
   an html fragment. Text between them is returned as "#text".
--------------------------------------------------- */
const BLOCK_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "blockquote", "div", "section",
]);

function splitTopLevel(html) {
  const input = String(html ?? "");
  const pattern = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)>/g;

  const out = [];
  let depth = 0;
  let startTag = "";
  let startAttrs = "";
  let innerStart = 0;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(input))) {
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    const selfClosing = /\/\s*$/.test(match[3] || "");

    if (!BLOCK_TAGS.has(tag)) continue;

    if (!closing && !selfClosing) {
      if (depth === 0) {
        const before = input.slice(cursor, match.index);

        if (plainText(before) !== "" || /<img\b/i.test(before)) {
          out.push({ tag: "#text", attrs: "", inner: before });
        }

        startTag = tag;
        startAttrs = match[3] || "";
        innerStart = pattern.lastIndex;
      }

      depth += 1;
    } else if (closing) {
      depth -= 1;

      if (depth === 0) {
        out.push({
          tag: startTag,
          attrs: startAttrs,
          inner: input.slice(innerStart, match.index),
        });

        cursor = pattern.lastIndex;
      }

      if (depth < 0) depth = 0;
    }
  }

  const rest = input.slice(cursor);

  if (plainText(rest) !== "" || /<img\b/i.test(rest)) {
    out.push({ tag: "#text", attrs: "", inner: rest });
  }

  return out;
}

/* ---------------------------------------------------
   html (from Mammoth)  ->  blocks
--------------------------------------------------- */
function parseListItems(inner, level, items, ctx) {
  splitTopLevel(inner)
    .filter((el) => el.tag === "li")
    .forEach((li) => {
      const parts = splitTopLevel(li.inner);

      const own = [];
      const nested = [];

      parts.forEach((part) => {
        if (part.tag === "ul" || part.tag === "ol") nested.push(part);
        else own.push(part.tag === "#text" || part.tag === "p" ? part.inner : part.inner);
      });

      if (/<img\b/i.test(li.inner)) {
        ctx.warnings.push("An image inside a list item was skipped (images must be on their own line in Word).");
      }

      const html = cleanInline(own.join("<br>"));

      if (plainText(html) !== "") {
        if (items.length < LIMITS.listItems) {
          items.push({ html, level: Math.min(level, 3) });
        }
      }

      nested.forEach((list) =>
        parseListItems(list.inner, level + 1, items, ctx)
      );
    });
}

function parseTableRows(inner, rows, ctx, headerFlag) {
  splitTopLevel(inner).forEach((el) => {
    if (el.tag === "thead" || el.tag === "tbody" || el.tag === "tfoot") {
      parseTableRows(el.inner, rows, ctx, headerFlag || el.tag === "thead");
      return;
    }

    if (el.tag !== "tr") return;

    const cells = splitTopLevel(el.inner).filter(
      (c) => c.tag === "td" || c.tag === "th"
    );

    if (!cells.length) return;

    const row = cells.slice(0, LIMITS.tableCols).map((cell) => {
      if (/colspan|rowspan/i.test(cell.attrs) && !ctx.mergedWarned) {
        ctx.mergedWarned = true;
        ctx.warnings.push("Merged table cells are shown as normal cells.");
      }

      if (/<img\b/i.test(cell.inner) && !ctx.tableImageWarned) {
        ctx.tableImageWarned = true;
        ctx.warnings.push("An image inside a table cell was skipped.");
      }

      const parts = splitTopLevel(cell.inner).map((p) => p.inner);

      return cleanInline(parts.length ? parts.join("<br>") : cell.inner);
    });

    const isHeader =
      headerFlag || cells.some((c) => c.tag === "th");

    rows.push({ row, isHeader });
  });
}

function pushParagraphLike(html, blocks, ctx) {
  // an image sits where it was in Word: text before | image | text after
  const pieces = String(html).split(/(<img\b[^>]*>)/gi);

  pieces.forEach((piece) => {
    if (/^<img\b/i.test(piece)) {
      const src = getAttr(piece, "src");
      const alt = decodeEntities(getAttr(piece, "alt"));

      if (!src || src === BROKEN) {
        ctx.brokenImages += 1;
        return;
      }

      if (!isSafeImageUrl(src)) {
        ctx.warnings.push("An image with an unsupported address was skipped.");
        return;
      }

      blocks.push({ type: "image", url: src, alt: alt.slice(0, 200), caption: "" });
      return;
    }

    const clean = cleanInline(piece);

    if (plainText(clean) !== "") {
      blocks.push({ type: "paragraph", html: clean });
    }
  });
}

function htmlToBlocks(html) {
  const blocks = [];
  const ctx = { warnings: [], brokenImages: 0 };

  splitTopLevel(html).forEach((el) => {
    const tag = el.tag;

    if (/^h[1-6]$/.test(tag)) {
      const clean = cleanInline(el.inner.replace(/<img\b[^>]*>/gi, ""));

      if (plainText(clean) !== "") {
        blocks.push({ type: "heading", level: Number(tag[1]), html: clean });
      }

      return;
    }

    if (tag === "#text") {
      pushParagraphLike(el.inner, blocks, ctx);
      return;
    }

    if (tag === "p") {
      // a Word "Caption" paragraph belongs to the image right above it
      if (/class\s*=\s*["']caption["']/i.test(el.attrs)) {
        const caption = plainText(el.inner).slice(0, LIMITS.caption);
        const last = blocks[blocks.length - 1];

        if (caption) {
          if (last && last.type === "image" && !last.caption) {
            last.caption = caption;
          } else {
            blocks.push({ type: "paragraph", html: cleanInline(el.inner) });
          }
        }

        return;
      }

      pushParagraphLike(el.inner, blocks, ctx);
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const items = [];

      parseListItems(el.inner, 0, items, ctx);

      if (items.length) {
        blocks.push({ type: "list", ordered: tag === "ol", items });
      }

      return;
    }

    if (tag === "table") {
      const parsed = [];

      parseTableRows(el.inner, parsed, ctx, false);

      if (parsed.length) {
        blocks.push({
          type: "table",
          header: parsed[0].isHeader,
          rows: parsed.slice(0, LIMITS.tableRows).map((r) => r.row),
        });
      }

      return;
    }

    if (tag === "blockquote" || tag === "div" || tag === "section") {
      htmlToBlocks(el.inner).blocks.forEach((b) => blocks.push(b));
      return;
    }

    ctx.warnings.push(`A Word element (${tag}) is not supported and was skipped.`);
  });

  return { blocks, warnings: ctx.warnings, brokenImages: ctx.brokenImages };
}

/* ---------------------------------------------------
   blocks -> clean, validated blocks   (also used on publish)
   returns { blocks, errors }
--------------------------------------------------- */
function validateBlocks(input) {
  const errors = [];

  if (!Array.isArray(input) || input.length === 0) {
    return { blocks: [], errors: ["The note has no content."] };
  }

  if (input.length > LIMITS.blocks) {
    return {
      blocks: [],
      errors: [`A note can have at most ${LIMITS.blocks} blocks.`],
    };
  }

  const blocks = [];

  input.forEach((raw, index) => {
    const n = index + 1;
    const type = raw && raw.type;

    if (type === "heading") {
      const html = cleanInline(String(raw.html ?? "").slice(0, LIMITS.html));
      const level = Math.min(Math.max(Number(raw.level) || 2, 1), 6);

      if (plainText(html) === "") return;
      blocks.push({ type, level, html });
      return;
    }

    if (type === "paragraph") {
      const html = cleanInline(String(raw.html ?? "").slice(0, LIMITS.html));

      if (plainText(html) === "") return;
      blocks.push({ type, html });
      return;
    }

    if (type === "image") {
      const url = String(raw.url ?? "").trim();

      if (!isSafeImageUrl(url)) {
        errors.push(`Block ${n}: the image address is not valid.`);
        return;
      }

      blocks.push({
        type,
        url,
        alt: plainText(raw.alt).slice(0, 200),
        caption: plainText(raw.caption).slice(0, LIMITS.caption),
      });
      return;
    }

    if (type === "list") {
      const items = (Array.isArray(raw.items) ? raw.items : [])
        .slice(0, LIMITS.listItems)
        .map((item) => ({
          html: cleanInline(String(item?.html ?? "").slice(0, LIMITS.html)),
          level: Math.min(Math.max(Number(item?.level) || 0, 0), 3),
        }))
        .filter((item) => plainText(item.html) !== "");

      if (!items.length) return;
      blocks.push({ type, ordered: raw.ordered === true, items });
      return;
    }

    if (type === "table") {
      const rows = (Array.isArray(raw.rows) ? raw.rows : [])
        .slice(0, LIMITS.tableRows)
        .map((row) =>
          (Array.isArray(row) ? row : [])
            .slice(0, LIMITS.tableCols)
            .map((cell) => cleanInline(String(cell ?? "").slice(0, LIMITS.html)))
        )
        .filter((row) => row.length > 0);

      if (!rows.length) return;
      blocks.push({ type, header: raw.header === true, rows });
      return;
    }

    errors.push(`Block ${n}: type "${String(type)}" is not supported.`);
  });

  if (!errors.length && blocks.length === 0) {
    errors.push("The note has no readable content.");
  }

  return { blocks, errors };
}

/* ---------------------------------------------------
   blocks -> html   (what the Read Note page shows)
   Word "Heading 1" becomes <h2> because the page title is the <h1>.
--------------------------------------------------- */
function listToHtml(block) {
  const tag = block.ordered ? "ol" : "ul";
  let html = "";
  const stack = []; // levels that are currently open

  block.items.forEach((item, i) => {
    const level = Math.min(item.level, stack.length);

    while (stack.length > level + 1) {
      html += `</li></${tag}>`;
      stack.pop();
    }

    if (stack.length === level + 1) {
      html += "</li>";
    } else if (stack.length === level) {
      html += `<${tag}>`;
      stack.push(level);
    }

    html += `<li>${item.html}`;

    if (i === block.items.length - 1) {
      while (stack.length) {
        html += `</li></${tag}>`;
        stack.pop();
      }
    }
  });

  return html;
}

function blocksToHtml(blocks) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading": {
          const level = Math.min(block.level + 1, 6);
          return `<h${level}>${block.html}</h${level}>`;
        }

        case "paragraph":
          return `<p>${block.html}</p>`;

        case "image":
          return (
            `<figure class="note-figure">` +
            `<img src="${escapeAttr(block.url)}" alt="${escapeAttr(block.alt)}" loading="lazy">` +
            (block.caption
              ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
              : "") +
            `</figure>`
          );

        case "list":
          return listToHtml(block);

        case "table": {
          const [first, ...rest] = block.rows;
          const cells = (row, tag) =>
            `<tr>${row.map((c) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;

          return (
            `<div class="note-table-wrap"><table>` +
            (block.header
              ? `<thead>${cells(first, "th")}</thead><tbody>${rest.map((r) => cells(r, "td")).join("")}</tbody>`
              : `<tbody>${block.rows.map((r) => cells(r, "td")).join("")}</tbody>`) +
            `</table></div>`
          );
        }

        default:
          return "";
      }
    })
    .join("\n");
}

/* ---------------------------------------------------
   numbers shown to the admin after converting
--------------------------------------------------- */
function summarise(blocks) {
  const count = (type) => blocks.filter((b) => b.type === type).length;

  const words = blocks.reduce((sum, b) => {
    let text = "";

    if (b.type === "heading" || b.type === "paragraph") text = b.html;
    if (b.type === "list") text = b.items.map((i) => i.html).join(" ");
    if (b.type === "table") text = b.rows.flat().join(" ");

    const plain = plainText(text);

    return sum + (plain ? plain.split(" ").length : 0);
  }, 0);

  return {
    blocks: blocks.length,
    headings: count("heading"),
    paragraphs: count("paragraph"),
    images: count("image"),
    lists: count("list"),
    tables: count("table"),
    words,
  };
}

/* ---------------------------------------------------
   MAIN: .docx buffer -> { blocks, warnings, stats }
   saveImage({ buffer, contentType, ext }) must return the image URL
--------------------------------------------------- */
async function convertDocxToBlocks(buffer, { saveImage }) {
  let mammoth;

  try {
    mammoth = require("mammoth");
  } catch {
    const error = new Error(
      "The Word import library is not installed on the server. Run: npm install mammoth"
    );
    error.code = "MAMMOTH_MISSING";
    throw error;
  }

  let imageCount = 0;
  const imageWarnings = [];

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Caption'] => p.caption:fresh",
        "p[style-name='Title'] => h1:fresh",
      ],

      convertImage: mammoth.images.imgElement(async (image) => {
        imageCount += 1;

        if (imageCount > MAX_IMAGES) {
          imageWarnings.push(
            `Image ${imageCount} was skipped: a note can have at most ${MAX_IMAGES} images.`
          );
          return { src: BROKEN, alt: "" };
        }

        try {
          const contentType = String(image.contentType || "").toLowerCase();

          if (!IMAGE_TYPES[contentType]) {
            throw new Error(
              `unsupported image format (${contentType || "unknown"}). Use PNG, JPG, GIF or WebP`
            );
          }

          const data = await image.readAsBuffer();

          if (!data || !data.length) throw new Error("the image is empty");

          if (data.length > MAX_IMAGE_BYTES) {
            throw new Error("the image is larger than 8 MB");
          }

          const url = await saveImage({
            buffer: data,
            contentType,
            ext: IMAGE_TYPES[contentType],
          });

          return { src: url, alt: image.altText || "" };
        } catch (error) {
          imageWarnings.push(
            `Image ${imageCount} could not be imported: ${error.message}.`
          );
          return { src: BROKEN, alt: "" };
        }
      }),
    }
  );

  const parsed = htmlToBlocks(result.value);

  const warnings = [...imageWarnings, ...parsed.warnings];

  // Mammoth's own notes (e.g. an unknown Word style). Short, de-duplicated.
  const seen = new Set();

  (result.messages || [])
    .filter((m) => m.type === "warning" && m.message)
    .forEach((m) => {
      const text = String(m.message).split("\n")[0].slice(0, 160);

      if (!seen.has(text)) {
        seen.add(text);
        warnings.push(`Word formatting note: ${text}`);
      }
    });

  const unique = [...new Set(warnings)];
  const shown = unique.slice(0, 12);

  if (unique.length > shown.length) {
    shown.push(`…and ${unique.length - shown.length} more notes.`);
  }

  return {
    blocks: parsed.blocks,
    warnings: shown,
    stats: summarise(parsed.blocks),
  };
}

module.exports = {
  BROKEN,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  blocksToHtml,
  cleanInline,
  convertDocxToBlocks,
  htmlToBlocks,
  plainText,
  summarise,
  validateBlocks,
};