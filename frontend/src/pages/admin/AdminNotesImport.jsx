import { useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";

import { API_BASE } from "../../config/api";
import { NOTE_CATEGORIES } from "../../data/notesContent";
import { NoteBlock } from "../../components/NoteBlocks";
import "../../components/NoteBlocks.css";

import "./AdminNotesImport.css";

const STEPS = ["Details", "Upload", "Preview & edit", "Publish"];

const MAX_MB = 15;

const EMPTY_DETAILS = {
  title: "",
  categorySlug: "",
  subcategorySlug: "",
  language: "en",
  free: false,
  price: "49",
  isActive: true,
};

const LANGUAGES = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["bilingual", "English + Hindi"],
];

// html of a block -> plain text for the editor box
function toPlain(html) {
  const doc = new DOMParser().parseFromString(
    String(html || "").replace(/<br\s*\/?>/gi, "\n"),
    "text/html"
  );

  return doc.body.textContent || "";
}

// plain text from the editor box -> safe html
function fromPlain(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .trim();
}

function sizeLabel(bytes) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/*
  ADMIN > IMPORT WORD NOTES
    1 Details   2 Upload & convert   3 Preview / edit   4 Publish
  One .docx = one note, with its images, in the right order.
*/
export default function AdminNotesImport() {
  const { adminToken } = useOutletContext();
  const fileInput = useRef(null);

  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(EMPTY_DETAILS);

  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");

  const [fileName, setFileName] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [stats, setStats] = useState(null);

  const [editing, setEditing] = useState(-1);
  const [draft, setDraft] = useState({});

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [published, setPublished] = useState(null);

  const category = NOTE_CATEGORIES.find((c) => c.slug === details.categorySlug);
  const subcategory = category?.subcategories.find(
    (s) => s.slug === details.subcategorySlug
  );

  const detailsError = useMemo(() => {
    if (details.title.trim().length < 3) return "Enter the note title.";
    if (!category) return "Choose a category.";
    if (!subcategory) return "Choose a subject.";

    const price = Number(details.price);

    if (!details.free && (!Number.isFinite(price) || price < 0)) {
      return "Enter a valid price, or mark the note as free.";
    }

    return "";
  }, [details, category, subcategory]);

  function setField(name, value) {
    setDetails((current) => {
      const next = { ...current, [name]: value };

      if (name === "categorySlug") next.subcategorySlug = "";

      return next;
    });
  }

  /* ---------------- step 2: upload & convert ---------------- */

  function pickFile(event) {
    const chosen = event.target.files?.[0];
    event.target.value = "";

    setConvertError("");

    if (!chosen) return;

    if (!/\.docx$/i.test(chosen.name)) {
      setFile(null);
      setConvertError(
        "Only .docx files are supported. In Word use Save As > Word Document (.docx)."
      );
      return;
    }

    if (chosen.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      setConvertError(`The file is larger than ${MAX_MB} MB.`);
      return;
    }

    if (chosen.size === 0) {
      setFile(null);
      setConvertError("The file is empty.");
      return;
    }

    setFile(chosen);
  }

  async function convert() {
    if (!file || converting) return;

    setConverting(true);
    setConvertError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch(
        `${API_BASE}/api/admin/notes-import/convert`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: form,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || "The file could not be converted."
        );
      }

      setBlocks(data.blocks);
      setWarnings(data.warnings || []);
      setStats(data.stats);
      setFileName(data.fileName || file.name);
      setEditing(-1);
      setStep(2);
    } catch (error) {
      setConvertError(error.message);
    } finally {
      setConverting(false);
    }
  }

  /* ---------------- step 3: edit blocks ---------------- */

  function move(index, direction) {
    const target = index + direction;

    if (target < 0 || target >= blocks.length) return;

    setBlocks((list) => {
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

    setEditing(-1);
  }

  function remove(index) {
    setBlocks((list) => list.filter((_, i) => i !== index));
    setEditing(-1);
  }

  function startEdit(index) {
    const block = blocks[index];

    if (block.type === "image") {
      setDraft({ caption: block.caption || "", alt: block.alt || "" });
    } else {
      setDraft({ text: toPlain(block.html), level: block.level || 1 });
    }

    setEditing(index);
  }

  function saveEdit(index) {
    setBlocks((list) =>
      list.map((block, i) => {
        if (i !== index) return block;

        if (block.type === "image") {
          return { ...block, caption: draft.caption.trim(), alt: draft.alt.trim() };
        }

        return {
          ...block,
          html: fromPlain(draft.text),
          ...(block.type === "heading" ? { level: Number(draft.level) } : {}),
        };
      })
    );

    setEditing(-1);
  }

  const counts = useMemo(() => {
    const c = { headings: 0, images: 0, tables: 0, lists: 0 };

    blocks.forEach((b) => {
      if (b.type === "heading") c.headings += 1;
      if (b.type === "image") c.images += 1;
      if (b.type === "table") c.tables += 1;
      if (b.type === "list") c.lists += 1;
    });

    return c;
  }, [blocks]);

  /* ---------------- step 4: publish ---------------- */

  async function publish() {
    if (publishing) return;

    setPublishing(true);
    setPublishError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/notes-import/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            title: details.title.trim(),
            categorySlug: category.slug,
            categoryTitle: category.title,
            subcategorySlug: subcategory.slug,
            subcategoryTitle: subcategory.title,
            language: details.language,
            price: details.free ? 0 : Number(details.price),
            isActive: details.isActive,
            sourceFileName: fileName,
            blocks,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Publishing failed.");
      }

      setPublished(data);
    } catch (error) {
      setPublishError(error.message);
    } finally {
      setPublishing(false);
    }
  }

  function startOver() {
    setStep(0);
    setDetails(EMPTY_DETAILS);
    setFile(null);
    setBlocks([]);
    setWarnings([]);
    setStats(null);
    setFileName("");
    setEditing(-1);
    setPublished(null);
    setPublishError("");
    setConvertError("");
  }

  /* ---------------------- render ---------------------- */

  if (published) {
    return (
      <div className="ni-page">
        <div className="ni-done">
          <span className="ni-done-icon">
            <Check size={30} strokeWidth={3} />
          </span>

          <h2>{published.message}</h2>

          <p>
            “{published.note.title}” (note #{published.note.id}) was created
            from <b>{fileName}</b> with {published.note.stats.images}{" "}
            {published.note.stats.images === 1 ? "image" : "images"} and{" "}
            {published.note.stats.words} words.
            {!published.note.isActive && " It is hidden until you publish it."}
          </p>

          <div className="ni-actions ni-actions-center">
            <Link to="/admin/notes" className="ni-btn ni-btn-primary">
              Go to Notes
            </Link>

            <button type="button" className="ni-btn" onClick={startOver}>
              Import another note
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ni-page">
      <header className="ni-head">
        <h2>Import Word Notes</h2>
        <p>
          Upload one .docx file. The article text, headings, lists, tables and
          pictures become a note automatically, with every picture in the same
          place as in Word.
        </p>
      </header>

      <ol className="ni-steps" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i === step ? "now" : i < step ? "done" : ""}
          >
            <span>{i < step ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {/* ============ 1. DETAILS ============ */}
      {step === 0 && (
        <section className="ni-card">
          <h3>Note details</h3>

          <label className="ni-field">
            <span>Title *</span>
            <input
              value={details.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. Fundamental Rights"
              maxLength={255}
            />
          </label>

          <div className="ni-row">
            <label className="ni-field">
              <span>Category *</span>
              <select
                value={details.categorySlug}
                onChange={(e) => setField("categorySlug", e.target.value)}
              >
                <option value="">Choose category</option>
                {NOTE_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="ni-field">
              <span>Subject *</span>
              <select
                value={details.subcategorySlug}
                onChange={(e) => setField("subcategorySlug", e.target.value)}
                disabled={!category}
              >
                <option value="">
                  {category ? "Choose subject" : "Choose a category first"}
                </option>
                {category?.subcategories.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ni-row">
            <label className="ni-field">
              <span>Language</span>
              <select
                value={details.language}
                onChange={(e) => setField("language", e.target.value)}
              >
                {LANGUAGES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ni-field">
              <span>Price (₹)</span>
              <input
                type="number"
                min="0"
                value={details.free ? "0" : details.price}
                onChange={(e) => setField("price", e.target.value)}
                disabled={details.free}
              />
            </label>
          </div>

          <label className="ni-check">
            <input
              type="checkbox"
              checked={details.free}
              onChange={(e) => setField("free", e.target.checked)}
            />
            <span>This note is free</span>
          </label>

          {detailsError && <p className="ni-hint">{detailsError}</p>}

          <div className="ni-actions">
            <button
              type="button"
              className="ni-btn ni-btn-primary"
              disabled={!!detailsError}
              onClick={() => setStep(1)}
            >
              Next: choose Word file
            </button>
          </div>
        </section>
      )}

      {/* ============ 2. UPLOAD & CONVERT ============ */}
      {step === 1 && (
        <section className="ni-card">
          <h3>Upload &amp; convert</h3>

          <div className="ni-drop">
            <FileText size={34} />

            {file ? (
              <p>
                <b>{file.name}</b>
                <small>{sizeLabel(file.size)}</small>
              </p>
            ) : (
              <p>
                <b>Choose a Word file</b>
                <small>.docx only, up to {MAX_MB} MB</small>
              </p>
            )}

            <button
              type="button"
              className="ni-btn"
              onClick={() => fileInput.current?.click()}
              disabled={converting}
            >
              {file ? "Choose another file" : "Select Word file"}
            </button>

            <input
              ref={fileInput}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              hidden
              onChange={pickFile}
            />
          </div>

          {convertError && (
            <div className="ni-alert ni-alert-error">
              <AlertCircle size={18} />
              <span>{convertError}</span>
            </div>
          )}

          <div className="ni-tips">
            <div>
              <h4>Works best</h4>
              <ul>
                <li>Heading 1 / 2 / 3 styles</li>
                <li>Normal paragraphs, bold, italic, links</li>
                <li>Bullet and numbered lists</li>
                <li>Tables</li>
                <li>Pictures in their own line (PNG, JPG, GIF, WebP)</li>
                <li>Picture captions in the “Caption” style</li>
              </ul>
            </div>

            <div>
              <h4>Check by hand</h4>
              <ul>
                <li>WordArt, shapes and floating text boxes</li>
                <li>Complex page layouts and columns</li>
                <li>Headers and footers</li>
                <li>Merged table cells</li>
              </ul>
            </div>
          </div>

          <div className="ni-actions">
            <button
              type="button"
              className="ni-btn"
              onClick={() => setStep(0)}
              disabled={converting}
            >
              Back
            </button>

            <button
              type="button"
              className="ni-btn ni-btn-primary"
              onClick={convert}
              disabled={!file || converting}
            >
              {converting ? (
                <>
                  <Loader2 size={16} className="ni-spin" />
                  Converting…
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload &amp; Convert
                </>
              )}
            </button>
          </div>

          {converting && (
            <p className="ni-hint">
              Reading the file and saving the pictures. This can take up to a
              minute for large files.
            </p>
          )}
        </section>
      )}

      {/* ============ 3. PREVIEW / EDIT ============ */}
      {step === 2 && (
        <section className="ni-card">
          <h3>Preview &amp; edit</h3>

          <div className="ni-stats">
            <span>
              <b>{blocks.length}</b> blocks
            </span>
            <span>
              <b>{counts.headings}</b> headings
            </span>
            <span>
              <b>{counts.images}</b> images
            </span>
            <span>
              <b>{counts.tables}</b> tables
            </span>
            <span>
              <b>{counts.lists}</b> lists
            </span>
            {stats && (
              <span>
                <b>{stats.words}</b> words
              </span>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="ni-alert ni-alert-warn">
              <AlertCircle size={18} />
              <div>
                <b>Check these before publishing</b>
                <ul>
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <p className="ni-hint">
            Move or delete blocks, or edit headings, paragraphs and picture
            captions. To change a list or a table, fix it in Word and upload
            again. Editing a text block removes bold / italic inside that block.
          </p>

          {blocks.length === 0 ? (
            <div className="ni-empty">
              Every block was deleted. Go back and upload the file again.
            </div>
          ) : (
            <div className="ni-blocks">
              {blocks.map((block, i) => (
                <div
                  key={i}
                  className={`ni-block ${editing === i ? "ni-block-edit" : ""}`}
                >
                  <div className="ni-bar">
                    <span className="ni-type">{block.type}</span>

                    <div className="ni-tools">
                      {block.type !== "list" && block.type !== "table" && (
                        <button
                          type="button"
                          onClick={() => startEdit(i)}
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        title="Move up"
                      >
                        <ArrowUp size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === blocks.length - 1}
                        aria-label="Move down"
                        title="Move down"
                      >
                        <ArrowDown size={15} />
                      </button>

                      <button
                        type="button"
                        className="ni-del"
                        onClick={() => remove(i)}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {editing === i ? (
                    <div className="ni-editor">
                      {block.type === "image" ? (
                        <>
                          <label className="ni-field">
                            <span>Caption</span>
                            <input
                              value={draft.caption}
                              onChange={(e) =>
                                setDraft({ ...draft, caption: e.target.value })
                              }
                              maxLength={300}
                            />
                          </label>

                          <label className="ni-field">
                            <span>Alt text (for screen readers)</span>
                            <input
                              value={draft.alt}
                              onChange={(e) =>
                                setDraft({ ...draft, alt: e.target.value })
                              }
                              maxLength={200}
                            />
                          </label>
                        </>
                      ) : (
                        <>
                          {block.type === "heading" && (
                            <label className="ni-field">
                              <span>Heading level</span>
                              <select
                                value={draft.level}
                                onChange={(e) =>
                                  setDraft({ ...draft, level: e.target.value })
                                }
                              >
                                <option value={1}>Main heading</option>
                                <option value={2}>Sub heading</option>
                                <option value={3}>Small heading</option>
                              </select>
                            </label>
                          )}

                          <label className="ni-field">
                            <span>Text</span>
                            <textarea
                              rows={block.type === "heading" ? 2 : 5}
                              value={draft.text}
                              onChange={(e) =>
                                setDraft({ ...draft, text: e.target.value })
                              }
                            />
                          </label>
                        </>
                      )}

                      <div className="ni-actions">
                        <button
                          type="button"
                          className="ni-btn"
                          onClick={() => setEditing(-1)}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="ni-btn ni-btn-primary"
                          onClick={() => saveEdit(i)}
                        >
                          Save block
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="nb ni-render">
                      <NoteBlock block={block} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="ni-actions">
            <button type="button" className="ni-btn" onClick={() => setStep(1)}>
              Upload a different file
            </button>

            <button
              type="button"
              className="ni-btn ni-btn-primary"
              disabled={blocks.length === 0}
              onClick={() => setStep(3)}
            >
              Next: publish
            </button>
          </div>
        </section>
      )}

      {/* ============ 4. PUBLISH ============ */}
      {step === 3 && (
        <section className="ni-card">
          <h3>Publish</h3>

          <dl className="ni-summary">
            <div>
              <dt>Title</dt>
              <dd>{details.title.trim()}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>
                {category?.title} · {subcategory?.title}
              </dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{LANGUAGES.find(([v]) => v === details.language)?.[1]}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{details.free ? "Free" : `₹${Number(details.price) || 0}`}</dd>
            </div>
            <div>
              <dt>Content</dt>
              <dd>
                {blocks.length} blocks · {counts.images}{" "}
                {counts.images === 1 ? "image" : "images"} · from {fileName}
              </dd>
            </div>
          </dl>

          <div className="ni-radio" role="radiogroup" aria-label="Status">
            <label className={details.isActive ? "on" : ""}>
              <input
                type="radio"
                name="status"
                checked={details.isActive}
                onChange={() => setField("isActive", true)}
              />
              <span>
                <b>Publish now</b>
                <small>Students can see it right away</small>
              </span>
            </label>

            <label className={!details.isActive ? "on" : ""}>
              <input
                type="radio"
                name="status"
                checked={!details.isActive}
                onChange={() => setField("isActive", false)}
              />
              <span>
                <b>Save as draft</b>
                <small>Hidden from students until you turn it on</small>
              </span>
            </label>
          </div>

          {publishError && (
            <div className="ni-alert ni-alert-error">
              <AlertCircle size={18} />
              <span>{publishError}</span>
            </div>
          )}

          <div className="ni-actions">
            <button
              type="button"
              className="ni-btn"
              onClick={() => setStep(2)}
              disabled={publishing}
            >
              Back to preview
            </button>

            <button
              type="button"
              className="ni-btn ni-btn-primary"
              onClick={publish}
              disabled={publishing}
            >
              {publishing ? (
                <>
                  <Loader2 size={16} className="ni-spin" />
                  Publishing…
                </>
              ) : details.isActive ? (
                "Publish note"
              ) : (
                "Save draft"
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}