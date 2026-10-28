// Shows a parsed article (see utils/articleParser.js): headings, paragraphs,
// lists, tables, quotes, images. Used by the blog page and the admin preview.

import { useMemo } from "react";
import { parseArticle } from "../utils/articleParser";
import "./ArticleBody.css";

function Inline({ nodes }) {
  return nodes.map((n, i) => {
    if (n.t === "text") return n.v;
    if (n.t === "b") return <strong key={i}><Inline nodes={n.c} /></strong>;
    if (n.t === "i") return <em key={i}><Inline nodes={n.c} /></em>;
    if (n.t === "code") return <code key={i}>{n.v}</code>;
    if (n.t === "a") {
      return (
        <a key={i} href={n.href} target="_blank" rel="noopener noreferrer nofollow">
          <Inline nodes={n.c} />
        </a>
      );
    }
    return null;
  });
}

function Heading({ block }) {
  const Tag = `h${block.level}`;
  return (
    <Tag id={block.id} className={`ab-h ab-h${block.level}`}>
      {block.text}
    </Tag>
  );
}

function List({ block }) {
  const Tag = block.ordered ? "ol" : "ul";
  const out = [];

  // one level of nesting: indented items go inside the item above them
  block.items.forEach((item) => {
    if (item.depth === 1 && out.length) {
      out[out.length - 1].children.push(item);
    } else {
      out.push({ ...item, children: [] });
    }
  });

  return (
    <Tag className={`ab-list ${block.ordered ? "ab-ol" : "ab-ul"}`}>
      {out.map((item, i) => (
        <li key={i}>
          <Inline nodes={item.c} />
          {item.children.length > 0 && (
            <ul>
              {item.children.map((child, k) => (
                <li key={k}><Inline nodes={child.c} /></li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </Tag>
  );
}

function Table({ block }) {
  const cols = Math.max(block.head.length, ...block.rows.map((r) => r.length));
  const pad = (row) => Array.from({ length: cols }, (_, i) => row[i] ?? "");
  const align = (i) => block.align[i] || "left";

  return (
    <div className="ab-table-wrap" role="region" tabIndex={0} aria-label="Table">
      <table className="ab-table">
        <thead>
          <tr>
            {pad(block.head).map((cell, i) => (
              <th key={i} style={{ textAlign: align(i) }}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r}>
              {pad(row).map((cell, i) => (
                <td key={i} style={{ textAlign: align(i) }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ArticleBlocks({ blocks }) {
  return blocks.map((b, i) => {
    switch (b.type) {
      case "heading":
        return <Heading key={i} block={b} />;
      case "list":
        return <List key={i} block={b} />;
      case "table":
        return <Table key={i} block={b} />;
      case "quote":
        return (
          <blockquote key={i} className="ab-quote">
            {b.lines.map((line, k) => (
              <p key={k}><Inline nodes={line} /></p>
            ))}
          </blockquote>
        );
      case "image":
        return (
          <figure key={i} className="ab-figure">
            <img src={b.src} alt={b.alt} loading="lazy" />
            {b.alt && <figcaption>{b.alt}</figcaption>}
          </figure>
        );
      case "hr":
        return <hr key={i} className="ab-hr" />;
      case "code":
        return <pre key={i} className="ab-pre"><code>{b.text}</code></pre>;
      default:
        return <p key={i} className="ab-p"><Inline nodes={b.c} /></p>;
    }
  });
}

export default function ArticleBody({ text, title, parsed, className = "" }) {
  const { blocks } = useMemo(() => parsed || parseArticle(text, { title }), [text, title, parsed]);
  return (
    <div className={`ab ${className}`}>
      <ArticleBlocks blocks={blocks} />
    </div>
  );
}


// "In this article": links to the headings, the current one is highlighted
export function ArticleToc({ items, activeId }) {
  if (!items || items.length < 3) return null;

  const go = (event, id) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="ab-toc" aria-label="In this article">
      <p className="ab-toc-title">In this article</p>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`${item.level === 3 ? "sub" : ""} ${activeId === item.id ? "on" : ""}`}
              onClick={(e) => go(e, item.id)}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
