import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { API_BASE } from "../../config/api";
import { EXAM_TAXONOMY, refreshTaxonomy } from "../../data/examTaxonomy";
import useTaxonomy from "../../data/useTaxonomy";

import "./AdminExams.css";

const EMPTY_CATEGORY = {
  title: "",
  fullName: "",
  icon: "",
  slug: "",
  hp: false,
};

const EMPTY_EXAM = {
  categorySlug: "",
  name: "",
  slug: "",
  iconUrl: "",
};

// "HP High Court" -> "hp-high-court"
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/*
  ADMIN > EXAMS & CATEGORIES
    Category = a body or exam family   (HPPSC, SSC, Banking ...)
    Exam     = one exam inside it      (HPAS, CGL ...)
  Anything added here appears on the whole website and in the test forms.
  Built-in exams can get new exams added, but cannot be renamed or deleted.
*/
export default function AdminExams() {
  // changes whenever the live exam list changes, so lists below refresh
  const version = useTaxonomy();

  const { adminToken } = useOutletContext();

  const [catForm, setCatForm] = useState(EMPTY_CATEGORY);
  const [editingSlug, setEditingSlug] = useState("");
  const [examForm, setExamForm] = useState(EMPTY_EXAM);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  const groups = EXAM_TAXONOMY;

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return [...groups];

    return groups.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.fullName || "").toLowerCase().includes(q) ||
        g.subExams.some((s) => s.name.toLowerCase().includes(q))
    );
    // "groups" is changed in place, "version" tells us when
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, search]);

  async function call(path, method, body) {
    const response = await fetch(
      `${API_BASE}/api/admin/exam-taxonomy${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Something went wrong.");
    }

    // pull the new list so every page (and this one) shows the change
    await refreshTaxonomy();

    return data;
  }

  async function run(action, successText) {
    setBusy(true);
    setMessage({ type: "", text: "" });

    try {
      await action();
      setMessage({ type: "ok", text: successText });
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- category: add / edit ---------------- */

  const catSlug = editingSlug || catForm.slug.trim() || slugify(catForm.title);

  async function saveCategory(event) {
    event.preventDefault();

    const title = catForm.title.trim();

    if (title.length < 2) {
      setMessage({ type: "error", text: "Please enter the category name." });
      return;
    }

    if (!editingSlug && groups.some((g) => g.slug === catSlug)) {
      setMessage({
        type: "error",
        text: `"${catSlug}" is already used. Change the short name.`,
      });
      return;
    }

    const payload = {
      title,
      fullName: catForm.fullName.trim(),
      icon: catForm.icon.trim(),
      region: catForm.hp ? "himachal-pradesh" : "",
    };

    const ok = await run(
      () =>
        editingSlug
          ? call(`/categories/${encodeURIComponent(editingSlug)}`, "PUT", payload)
          : call("/categories", "POST", { ...payload, slug: catSlug }),
      editingSlug ? "Category updated." : "Category added."
    );

    if (ok) {
      setCatForm(EMPTY_CATEGORY);
      setEditingSlug("");
    }
  }

  function startEdit(group) {
    setEditingSlug(group.slug);
    setCatForm({
      title: group.title,
      fullName: group.fullName || "",
      icon: group.icon || "",
      slug: group.slug,
      hp: group.region === "himachal-pradesh",
    });

    document
      .getElementById("ax-category-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingSlug("");
    setCatForm(EMPTY_CATEGORY);
  }

  async function deleteCategory(group) {
    const sure = window.confirm(
      `Delete "${group.title}" and its ${group.subExams.length} exam(s)?\n\nThis only works if no test uses it.`
    );

    if (!sure) return;

    await run(
      () => call(`/categories/${encodeURIComponent(group.slug)}`, "DELETE"),
      "Category deleted."
    );
  }

  /* ---------------- exam: add / rename / delete ---------------- */

  const examSlug = examForm.slug.trim() || slugify(examForm.name);

  async function saveExam(event) {
    event.preventDefault();

    const group = groups.find((g) => g.slug === examForm.categorySlug);

    if (!group) {
      setMessage({ type: "error", text: "Please choose a category." });
      return;
    }

    if (examForm.name.trim().length < 2) {
      setMessage({ type: "error", text: "Please enter the exam name." });
      return;
    }

    if (group.subExams.some((s) => s.slug === examSlug)) {
      setMessage({
        type: "error",
        text: `"${examSlug}" is already used in ${group.title}. Change the short name.`,
      });
      return;
    }

    const ok = await run(
      () =>
        call(
          `/categories/${encodeURIComponent(group.slug)}/exams`,
          "POST",
          {
            name: examForm.name.trim(),
            slug: examSlug,
            iconUrl: examForm.iconUrl.trim(),
            // only used when the category is a built-in one (e.g. SSC)
            categoryTitle: group.title,
            categoryIcon: group.icon,
          }
        ),
      "Exam added."
    );

    if (ok) {
      setExamForm({ ...EMPTY_EXAM, categorySlug: examForm.categorySlug });
    }
  }

  async function renameExam(group, exam) {
    const name = window.prompt("New name for this exam", exam.name);

    if (name === null || name.trim() === "" || name.trim() === exam.name) {
      return;
    }

    await run(
      () =>
        call(
          `/categories/${encodeURIComponent(group.slug)}/exams/${encodeURIComponent(exam.slug)}`,
          "PUT",
          { name: name.trim(), iconUrl: exam.iconUrl || "" }
        ),
      "Exam renamed."
    );
  }

  async function deleteExam(group, exam) {
    const sure = window.confirm(
      `Delete the exam "${exam.name}"?\n\nThis only works if no test uses it.`
    );

    if (!sure) return;

    await run(
      () =>
        call(
          `/categories/${encodeURIComponent(group.slug)}/exams/${encodeURIComponent(exam.slug)}`,
          "DELETE"
        ),
      "Exam deleted."
    );
  }

  /* ---------------------- render ---------------------- */

  return (
    <div className="ax-page">
      <header className="ax-header">
        <h2>Exams &amp; Categories</h2>
        <p>
          A <b>category</b> is a board or exam family (HPPSC, SSC, Banking…).
          An <b>exam</b> is one exam inside it (HPAS, CGL…). Whatever you add
          here shows on the website and in the test forms right away.
        </p>
      </header>

      {message.text && (
        <div className={`ax-msg ax-msg-${message.type}`} role="status">
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage({ type: "", text: "" })}
            aria-label="Close message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="ax-forms">
        {/* ---------- new / edit category ---------- */}
        <form
          id="ax-category-form"
          className="ax-card"
          onSubmit={saveCategory}
        >
          <h3>{editingSlug ? "Edit category" : "Add category / board"}</h3>

          <label>
            <span>Name *</span>
            <input
              value={catForm.title}
              onChange={(e) =>
                setCatForm({ ...catForm, title: e.target.value })
              }
              placeholder="e.g. HP Forest Department"
              maxLength={60}
            />
          </label>

          <label>
            <span>Full name (optional)</span>
            <input
              value={catForm.fullName}
              onChange={(e) =>
                setCatForm({ ...catForm, fullName: e.target.value })
              }
              placeholder="e.g. Himachal Pradesh Forest Department"
              maxLength={120}
            />
          </label>

          <div className="ax-row">
            <label>
              <span>Icon (emoji)</span>
              <input
                value={catForm.icon}
                onChange={(e) =>
                  setCatForm({ ...catForm, icon: e.target.value })
                }
                placeholder="📄"
                maxLength={8}
              />
            </label>

            <label>
              <span>Short name (web address)</span>
              <input
                value={editingSlug ? editingSlug : catForm.slug}
                onChange={(e) =>
                  setCatForm({
                    ...catForm,
                    slug: e.target.value.toLowerCase(),
                  })
                }
                placeholder={slugify(catForm.title) || "auto"}
                disabled={!!editingSlug}
              />
            </label>
          </div>

          <label className="ax-check">
            <input
              type="checkbox"
              checked={catForm.hp}
              onChange={(e) =>
                setCatForm({ ...catForm, hp: e.target.checked })
              }
            />
            <span>Also show on the Himachal Pradesh page</span>
          </label>

          {catSlug && (
            <p className="ax-hint">
              Web address: <code>/take-mock-test/{catSlug}</code>
            </p>
          )}

          <div className="ax-actions">
            <button className="ax-btn ax-btn-primary" disabled={busy}>
              <Plus size={16} />
              {editingSlug ? "Save changes" : "Add category"}
            </button>

            {editingSlug && (
              <button
                type="button"
                className="ax-btn"
                onClick={cancelEdit}
                disabled={busy}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ---------- new exam ---------- */}
        <form className="ax-card" onSubmit={saveExam}>
          <h3>Add exam inside a category</h3>

          <label>
            <span>Category *</span>
            <select
              value={examForm.categorySlug}
              onChange={(e) =>
                setExamForm({ ...examForm, categorySlug: e.target.value })
              }
            >
              <option value="">Choose category</option>
              {groups.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Exam name *</span>
            <input
              value={examForm.name}
              onChange={(e) =>
                setExamForm({ ...examForm, name: e.target.value })
              }
              placeholder="e.g. Forest Guard"
              maxLength={80}
            />
          </label>

          <div className="ax-row">
            <label>
              <span>Short name (web address)</span>
              <input
                value={examForm.slug}
                onChange={(e) =>
                  setExamForm({
                    ...examForm,
                    slug: e.target.value.toLowerCase(),
                  })
                }
                placeholder={slugify(examForm.name) || "auto"}
              />
            </label>

            <label>
              <span>Logo link (optional)</span>
              <input
                value={examForm.iconUrl}
                onChange={(e) =>
                  setExamForm({ ...examForm, iconUrl: e.target.value })
                }
                placeholder="https://…"
              />
            </label>
          </div>

          {examForm.categorySlug && examSlug && (
            <p className="ax-hint">
              Web address:{" "}
              <code>
                /take-mock-test/{examForm.categorySlug}/{examSlug}
              </code>
            </p>
          )}

          <div className="ax-actions">
            <button className="ax-btn ax-btn-primary" disabled={busy}>
              <Plus size={16} />
              Add exam
            </button>
          </div>
        </form>
      </div>

      {/* ---------- list ---------- */}
      <div className="ax-list-head">
        <h3>
          All categories <span>{groups.length}</span>
        </h3>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search category or exam"
          aria-label="Search categories"
        />
      </div>

      <div className="ax-list">
        {visibleGroups.map((group) => (
          <article key={group.slug} className="ax-group">
            <div className="ax-group-head">
              <span className="ax-icon" aria-hidden="true">
                {group.icon}
              </span>

              <div className="ax-group-title">
                <strong>{group.title}</strong>
                {group.fullName && <small>{group.fullName}</small>}

                <div className="ax-tags">
                  <span
                    className={`ax-tag ${group.custom ? "ax-tag-new" : ""}`}
                  >
                    {group.custom ? "Added by you" : "Built-in"}
                  </span>

                  {group.region === "himachal-pradesh" && (
                    <span className="ax-tag ax-tag-hp">HP page</span>
                  )}

                  <span className="ax-tag">
                    {group.subExams.length}{" "}
                    {group.subExams.length === 1 ? "exam" : "exams"}
                  </span>
                </div>
              </div>

              {group.custom && (
                <div className="ax-group-actions">
                  <button
                    type="button"
                    className="ax-icon-btn"
                    onClick={() => startEdit(group)}
                    disabled={busy}
                    aria-label={`Edit ${group.title}`}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="ax-icon-btn ax-danger"
                    onClick={() => deleteCategory(group)}
                    disabled={busy}
                    aria-label={`Delete ${group.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <ul className="ax-exams">
              {group.subExams.map((exam) => (
                <li key={exam.slug} className={exam.custom ? "ax-new" : ""}>
                  <span>{exam.name}</span>

                  {exam.custom && (
                    <>
                      <button
                        type="button"
                        onClick={() => renameExam(group, exam)}
                        disabled={busy}
                        aria-label={`Rename ${exam.name}`}
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        type="button"
                        className="ax-danger"
                        onClick={() => deleteExam(group, exam)}
                        disabled={busy}
                        aria-label={`Delete ${exam.name}`}
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </li>
              ))}

              {group.subExams.length === 0 && (
                <li className="ax-empty">No exams yet</li>
              )}
            </ul>
          </article>
        ))}

        {visibleGroups.length === 0 && (
          <p className="ax-none">Nothing matches your search.</p>
        )}
      </div>
    </div>
  );
}