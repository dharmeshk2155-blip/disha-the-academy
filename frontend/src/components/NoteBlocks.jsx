import { useState } from "react";
import DOMPurify from "dompurify";

import "./NoteBlocks.css";

/*
  Block renderer for notes made from Word files.
  Blocks: heading, paragraph, image, list, table  (see backend/utils/docxNotes.js)
  The text is already cleaned on the server; it is cleaned again here
  before it is put on the page.
*/
const INLINE = {
  ALLOWED_TAGS: ["strong", "em", "u", "sup", "sub", "br", "a"],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

const safe = (html) => ({ __html: DOMPurify.sanitize(html || "", INLINE) });

// flat [{ html, level }]  ->  nested tree [{ html, children }]
function buildTree(items) {
  const root = { children: [] };
  const stack = [{ level: -1, node: root }];

  items.forEach((item) => {
    const node = { html: item.html, children: [] };

    while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    stack[stack.length - 1].node.children.push(node);
    stack.push({ level: item.level, node });
  });

  return root.children;
}

function ListNodes({ nodes, ordered }) {
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag>
      {nodes.map((node, i) => (
        <li key={i}>
          <span dangerouslySetInnerHTML={safe(node.html)} />
          {node.children.length > 0 && (
            <ListNodes nodes={node.children} ordered={ordered} />
          )}
        </li>
      ))}
    </Tag>
  );
}

function NoteImage({ block }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="nb-figure">
      {failed ? (
        <div className="nb-broken">This image could not be loaded.</div>
      ) : (
        <img
          src={block.url}
          alt={block.alt || ""}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}

      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  );
}

export function NoteBlock({ block }) {
  switch (block.type) {
    case "heading": {
      // the page title is the h1, so Word "Heading 1" is shown as h2
      const Tag = `h${Math.min((block.level || 1) + 1, 6)}`;
      return <Tag dangerouslySetInnerHTML={safe(block.html)} />;
    }

    case "paragraph":
      return <p dangerouslySetInnerHTML={safe(block.html)} />;

    case "image":
      return <NoteImage block={block} />;

    case "list":
      return (
        <ListNodes nodes={buildTree(block.items || [])} ordered={block.ordered} />
      );

    case "table": {
      const rows = block.rows || [];
      const [first, ...rest] = rows;

      const row = (cells, Cell, key) => (
        <tr key={key}>
          {cells.map((cell, i) => (
            <Cell key={i} dangerouslySetInnerHTML={safe(cell)} />
          ))}
        </tr>
      );

      return (
        <div className="nb-table-wrap">
          <table>
            {block.header && first ? (
              <>
                <thead>{row(first, "th", "h")}</thead>
                <tbody>{rest.map((r, i) => row(r, "td", i))}</tbody>
              </>
            ) : (
              <tbody>{rows.map((r, i) => row(r, "td", i))}</tbody>
            )}
          </table>
        </div>
      );
    }

    default:
      return null;
  }
}

export default function NoteBlocks({ blocks }) {
  return (
    <div className="nb">
      {(blocks || []).map((block, i) => (
        <NoteBlock key={i} block={block} />
      ))}
    </div>
  );
}