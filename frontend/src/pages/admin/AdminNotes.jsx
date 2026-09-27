import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw,
  FileText,
  IndianRupee,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

import "./AdminNotes.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

const EMPTY_FORM = {
  categorySlug: "",
  categoryTitle: "",
  subcategorySlug: "",
  subcategoryTitle: "",
  title: "",
  price: "",
  pdf: "",
  isActive: true,
};

function makeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminNotes() {
  const { adminKey } = useOutletContext();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingNote, setEditingNote] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  // ======================================================
  // LOAD NOTES
  // ======================================================

  async function loadNotes() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/admin/notes`,
        {
          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load notes."
        );
      }

      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load notes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) {
      loadNotes();
    }
  }, [adminKey]);

  // ======================================================
  // STATS
  // ======================================================

  const stats = useMemo(() => {
    const total = notes.length;

    const active = notes.filter(
      (note) => note.isActive
    ).length;

    const inactive = total - active;

    const withPdf = notes.filter(
      (note) => note.pdf
    ).length;

    return {
      total,
      active,
      inactive,
      withPdf,
    };
  }, [notes]);

  // ======================================================
  // FILTER NOTES
  // ======================================================

  const filteredNotes = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return notes.filter((note) => {
      const matchesSearch =
        !query ||
        note.title
          ?.toLowerCase()
          .includes(query) ||
        note.categoryTitle
          ?.toLowerCase()
          .includes(query) ||
        note.subcategoryTitle
          ?.toLowerCase()
          .includes(query) ||
        String(note.id).includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          note.isActive) ||
        (statusFilter === "inactive" &&
          !note.isActive);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    notes,
    search,
    statusFilter,
  ]);

  // ======================================================
  // OPEN CREATE
  // ======================================================

  function openCreateModal() {
    setEditingNote(null);
    setForm(EMPTY_FORM);
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  // ======================================================
  // OPEN EDIT
  // ======================================================

  function openEditModal(note) {
    setEditingNote(note);

    setForm({
      categorySlug:
        note.categorySlug || "",
      categoryTitle:
        note.categoryTitle || "",
      subcategorySlug:
        note.subcategorySlug || "",
      subcategoryTitle:
        note.subcategoryTitle || "",
      title: note.title || "",
      price: note.price ?? "",
      pdf: note.pdf || "",
      isActive:
        Boolean(note.isActive),
    });

    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingNote(null);
    setForm(EMPTY_FORM);
  }

  // ======================================================
  // FORM CHANGE
  // ======================================================

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function handleCategoryTitleChange(
    event
  ) {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      categoryTitle: value,

      categorySlug:
        current.categorySlug ||
        makeSlug(value),
    }));
  }

  function handleSubcategoryTitleChange(
    event
  ) {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      subcategoryTitle: value,

      subcategorySlug:
        current.subcategorySlug ||
        makeSlug(value),
    }));
  }

  // ======================================================
  // SAVE NOTE
  // ======================================================

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      categorySlug:
        form.categorySlug.trim(),
      categoryTitle:
        form.categoryTitle.trim(),
      subcategorySlug:
        form.subcategorySlug.trim(),
      subcategoryTitle:
        form.subcategoryTitle.trim(),
      title: form.title.trim(),
      price: Number(form.price),
      pdf: form.pdf.trim(),
      isActive:
        Boolean(form.isActive),
    };

    if (
      !payload.categorySlug ||
      !payload.categoryTitle ||
      !payload.subcategorySlug ||
      !payload.subcategoryTitle ||
      !payload.title
    ) {
      setError(
        "Please fill all required fields."
      );
      return;
    }

    if (
      !Number.isFinite(
        payload.price
      ) ||
      payload.price < 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const isEditing =
        Boolean(editingNote);

      const url = isEditing
        ? `${API_BASE}/api/admin/notes/${editingNote.id}`
        : `${API_BASE}/api/admin/notes`;

      const response = await fetch(
        url,
        {
          method: isEditing
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
            "x-admin-key":
              adminKey,
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save note."
        );
      }

      setMessage(
        data.message ||
          (isEditing
            ? "Note updated successfully."
            : "Note created successfully.")
      );

      setModalOpen(false);
      setEditingNote(null);
      setForm(EMPTY_FORM);

      await loadNotes();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save note."
      );
    } finally {
      setSaving(false);
    }
  }

  // ======================================================
  // DEACTIVATE NOTE
  // ======================================================

  async function deactivateNote(
    note
  ) {
    const confirmed =
      window.confirm(
        `Deactivate "${note.title}"?\n\nIt will stop appearing as an active note, but old order data will remain safe.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE}/api/admin/notes/${note.id}`,
        {
          method: "DELETE",

          headers: {
            "x-admin-key":
              adminKey,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to deactivate note."
        );
      }

      setMessage(
        "Note deactivated successfully."
      );

      await loadNotes();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to deactivate note."
      );
    }
  }

  // ======================================================
  // QUICK REACTIVATE
  // ======================================================

  async function reactivateNote(
    note
  ) {
    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE}/api/admin/notes/${note.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
            "x-admin-key":
              adminKey,
          },

          body: JSON.stringify({
            categorySlug:
              note.categorySlug,
            categoryTitle:
              note.categoryTitle,
            subcategorySlug:
              note.subcategorySlug,
            subcategoryTitle:
              note.subcategoryTitle,
            title: note.title,
            price: note.price,
            pdf: note.pdf || "",
            isActive: true,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to activate note."
        );
      }

      setMessage(
        "Note activated successfully."
      );

      await loadNotes();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to activate note."
      );
    }
  }

  return (
    <div className="admin-notes-page">
      {/* HEADER */}

      <div className="admin-notes-heading">
        <div>
          <span className="admin-notes-eyebrow">
            CONTENT MANAGEMENT
          </span>

          <h2>
            Notes Management
          </h2>

          <p>
            Manage study notes,
            categories, prices and
            availability.
          </p>
        </div>

        <div className="admin-notes-heading-actions">
          <button
            type="button"
            className="admin-notes-refresh"
            onClick={loadNotes}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-notes-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            className="admin-notes-add"
            onClick={
              openCreateModal
            }
          >
            <Plus size={18} />
            Add Note
          </button>
        </div>
      </div>

      {/* ALERTS */}

      {message && (
        <div className="admin-notes-alert success">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="admin-notes-alert error">
          <CircleOff size={18} />
          {error}
        </div>
      )}

      {/* STATS */}

      <div className="admin-notes-stats">
        <div className="admin-notes-stat">
          <BookOpen size={22} />

          <div>
            <span>Total Notes</span>
            <strong>
              {stats.total}
            </strong>
          </div>
        </div>

        <div className="admin-notes-stat">
          <CheckCircle2 size={22} />

          <div>
            <span>Active</span>
            <strong>
              {stats.active}
            </strong>
          </div>
        </div>

        <div className="admin-notes-stat">
          <CircleOff size={22} />

          <div>
            <span>Inactive</span>
            <strong>
              {stats.inactive}
            </strong>
          </div>
        </div>

        <div className="admin-notes-stat">
          <FileText size={22} />

          <div>
            <span>PDF Attached</span>
            <strong>
              {stats.withPdf}
            </strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="admin-notes-toolbar">
        <div className="admin-notes-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by title, category or ID..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Notes
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      {/* TABLE */}

      <div className="admin-notes-table-card">
        {loading ? (
          <div className="admin-notes-empty">
            <RefreshCw
              className="admin-notes-spin"
              size={28}
            />

            <p>Loading notes...</p>
          </div>
        ) : filteredNotes.length ===
          0 ? (
          <div className="admin-notes-empty">
            <BookOpen size={32} />

            <h3>
              No notes found
            </h3>

            <p>
              Try changing your search
              or filter.
            </p>
          </div>
        ) : (
          <div className="admin-notes-table-wrap">
            <table className="admin-notes-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Note</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>PDF</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredNotes.map(
                  (note) => (
                    <tr key={note.id}>
                      <td>
                        <span className="admin-note-id">
                          #{note.id}
                        </span>
                      </td>

                      <td>
                        <div className="admin-note-title-cell">
                          <strong>
                            {note.title}
                          </strong>

                          <span>
                            {
                              note.subcategoryTitle
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-note-category">
                          <strong>
                            {
                              note.categoryTitle
                            }
                          </strong>

                          <span>
                            {
                              note.categorySlug
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-note-price">
                          <IndianRupee
                            size={14}
                          />
                          {note.price}
                        </span>
                      </td>

                      <td>
                        {note.pdf ? (
                          <span
                            className="admin-note-pdf"
                            title={
                              note.pdf
                            }
                          >
                            <FileText
                              size={15}
                            />

                            PDF
                          </span>
                        ) : (
                          <span className="admin-note-no-pdf">
                            Not attached
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`admin-note-status ${
                            note.isActive
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {note.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-note-actions">
                          <button
                            type="button"
                            className="edit"
                            title="Edit note"
                            onClick={() =>
                              openEditModal(
                                note
                              )
                            }
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          {note.isActive ? (
                            <button
                              type="button"
                              className="delete"
                              title="Deactivate note"
                              onClick={() =>
                                deactivateNote(
                                  note
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="activate"
                              title="Activate note"
                              onClick={() =>
                                reactivateNote(
                                  note
                                )
                              }
                            >
                              <CheckCircle2
                                size={16}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-notes-results">
        Showing{" "}
        <strong>
          {filteredNotes.length}
        </strong>{" "}
        of{" "}
        <strong>
          {notes.length}
        </strong>{" "}
        notes
      </div>

      {/* MODAL */}

      {modalOpen && (
        <div
          className="admin-notes-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="admin-notes-modal">
            <div className="admin-notes-modal-header">
              <div>
                <span>
                  {editingNote
                    ? `NOTE #${editingNote.id}`
                    : "NEW NOTE"}
                </span>

                <h3>
                  {editingNote
                    ? "Edit Note"
                    : "Add New Note"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="admin-notes-form-grid">
                <div className="admin-notes-field full">
                  <label>
                    Note Title *
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={
                      handleChange
                    }
                    placeholder="Example: HP History Notes"
                    required
                  />
                </div>

                <div className="admin-notes-field">
                  <label>
                    Category Title *
                  </label>

                  <input
                    type="text"
                    name="categoryTitle"
                    value={
                      form.categoryTitle
                    }
                    onChange={
                      handleCategoryTitleChange
                    }
                    placeholder="Example: HP GK"
                    required
                  />
                </div>

                <div className="admin-notes-field">
                  <label>
                    Category Slug *
                  </label>

                  <input
                    type="text"
                    name="categorySlug"
                    value={
                      form.categorySlug
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="hp-gk"
                    required
                  />
                </div>

                <div className="admin-notes-field">
                  <label>
                    Subcategory Title *
                  </label>

                  <input
                    type="text"
                    name="subcategoryTitle"
                    value={
                      form.subcategoryTitle
                    }
                    onChange={
                      handleSubcategoryTitleChange
                    }
                    placeholder="Himachal Pradesh History"
                    required
                  />
                </div>

                <div className="admin-notes-field">
                  <label>
                    Subcategory Slug *
                  </label>

                  <input
                    type="text"
                    name="subcategorySlug"
                    value={
                      form.subcategorySlug
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="hp-history"
                    required
                  />
                </div>

                <div className="admin-notes-field">
                  <label>
                    Price (₹) *
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="1"
                    placeholder="49"
                    required
                  />
                </div>

                <div className="admin-notes-field">
                  <label>
                    PDF Filename
                  </label>

                  <input
                    type="text"
                    name="pdf"
                    value={form.pdf}
                    onChange={
                      handleChange
                    }
                    placeholder="example.pdf"
                  />
                </div>

                <div className="admin-notes-field full">
                  <label className="admin-notes-toggle">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={
                        form.isActive
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span className="admin-notes-toggle-switch"></span>

                    <div>
                      <strong>
                        Active Note
                      </strong>

                      <small>
                        Active notes can
                        be shown to
                        students.
                      </small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="admin-notes-modal-footer">
                <button
                  type="button"
                  className="admin-notes-cancel"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-notes-save"
                  disabled={saving}
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : editingNote
                    ? "Save Changes"
                    : "Create Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}