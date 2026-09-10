import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./AdminCurrentAffairs.css";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminCurrentAffairs() {
  const { adminKey } = useOutletContext();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Editing state
  const [editingId, setEditingId] = useState(null);

  // =====================================================
  // LOAD ENTRIES
  // =====================================================
  async function loadEntries() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/current-affairs`);

      if (!res.ok) {
        throw new Error("Failed to load current affairs");
      }

      const data = await res.json();
      setEntries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  // =====================================================
  // RESET FORM
  // =====================================================
  function resetForm() {
    setTitle("");
    setSummary("");
    setDate(new Date().toISOString().slice(0, 10));
    setEditingId(null);
    setSubmitError(null);
  }

  // =====================================================
  // ADD / UPDATE
  // =====================================================
  async function handleSubmit(e) {
    e.preventDefault();

    setSubmitting(true);
    setSubmitError(null);

    try {
      const isEditing = editingId !== null;

      const url = isEditing
        ? `${API_BASE}/api/current-affairs/${editingId}`
        : `${API_BASE}/api/current-affairs`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          title,
          summary,
          date,
        }),
      });

      if (res.status === 401) {
        throw new Error(
          "Admin key rejected. Try locking and re-entering it."
        );
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);

        throw new Error(
          data?.error ||
            (isEditing
              ? "Failed to update entry"
              : "Failed to add entry")
        );
      }

      resetForm();
      await loadEntries();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================================
  // START EDIT
  // =====================================================
  function handleEdit(entry) {
    setEditingId(entry.id);
    setTitle(entry.title || "");
    setSummary(entry.summary || "");
    setDate(entry.date?.slice(0, 10) || "");

    setSubmitError(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // DELETE
  // =====================================================
  async function handleDelete(id) {
    if (!window.confirm("Delete this current affair?")) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/current-affairs/${id}`,
        {
          method: "DELETE",
          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      if (res.status === 401) {
        throw new Error("Admin key rejected.");
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);

        throw new Error(
          data?.error || "Failed to delete entry"
        );
      }

      // If deleted item was being edited
      if (editingId === id) {
        resetForm();
      }

      await loadEntries();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="admin-ca-page">
      <div className="admin-ca-header">
        <h1>Manage Current Affairs</h1>

        <p>
          Add, edit and manage current affairs for your
          students.
        </p>
      </div>

      {/* =================================================
          ADD / EDIT FORM
      ================================================= */}
      <form
        className="admin-ca-form"
        onSubmit={handleSubmit}
      >
        <h2>
          {editingId !== null
            ? "Edit Current Affair"
            : "Add New Current Affair"}
        </h2>

        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. RBI announces new repo rate"
            required
          />
        </label>

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label>
          Summary
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Write an exam-relevant explanation..."
            rows={5}
            required
          />
        </label>

        {submitError && (
          <p className="admin-ca-error">
            {submitError}
          </p>
        )}

        <div className="admin-ca-form-actions">
          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? editingId !== null
                ? "Updating..."
                : "Adding..."
              : editingId !== null
              ? "Update Entry"
              : "Add Entry"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="admin-ca-cancel-btn"
              onClick={resetForm}
              disabled={submitting}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* =================================================
          EXISTING ENTRIES
      ================================================= */}
      <div className="admin-ca-list-header">
        <h2 className="admin-ca-list-heading">
          Existing Entries
        </h2>

        <span>
          {entries.length}{" "}
          {entries.length === 1 ? "Entry" : "Entries"}
        </span>
      </div>

      {loading && (
        <p className="admin-ca-loading">
          Loading current affairs...
        </p>
      )}

      {error && (
        <p className="admin-ca-error">
          Error: {error}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="admin-ca-empty">
          <h3>No Current Affairs Yet</h3>
          <p>
            Add your first current affair using the form
            above.
          </p>
        </div>
      )}

      <div className="admin-ca-list">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`admin-ca-item ${
              editingId === entry.id
                ? "admin-ca-item-editing"
                : ""
            }`}
          >
            <div className="admin-ca-item-header">
              <strong>{entry.title}</strong>

              <span>
                {entry.date?.slice(0, 10)}
              </span>
            </div>

            <p>{entry.summary}</p>

            <div className="admin-ca-item-actions">
              <button
                className="admin-ca-edit-btn"
                onClick={() => handleEdit(entry)}
              >
                Edit
              </button>

              <button
                className="admin-ca-delete-btn"
                onClick={() =>
                  handleDelete(entry.id)
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}