import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./AdminCurrentAffairs.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const EMPTY_FORM = { id: null, title: "", subject: "", price: "", pdf: "" };

export default function AdminNotes() {
  const { adminKey } = useOutletContext();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const isEditing = form.id !== null;

  // =====================================================
  // LOAD NOTES
  // =====================================================
  async function loadNotes() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/notes`);

      if (!res.ok) {
        throw new Error("Failed to load notes");
      }

      const data = await res.json();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  // =====================================================
  // FORM HELPERS
  // =====================================================
  function startAdd() {
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function startEdit(note) {
    setForm({
      id: note.id,
      title: note.title || "",
      subject: note.subject || "",
      price: note.price ?? "",
      pdf: note.pdf || "",
    });
    setFormError("");
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // =====================================================
  // SAVE (ADD or EDIT)
  // =====================================================
  async function handleSave(e) {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.subject.trim() || form.price === "") {
      setFormError("Title, subject and price are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        price: Number(form.price),
        pdf: form.pdf.trim() || null,
      };

      const url = isEditing
        ? `${API_BASE}/api/notes/${form.id}`
        : `${API_BASE}/api/notes`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save note");
      }

      setForm(EMPTY_FORM);
      await loadNotes();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE
  // =====================================================
  async function handleDelete(id) {
    if (!window.confirm("Delete this note? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete note");
      }

      if (form.id === id) {
        setForm(EMPTY_FORM);
      }

      await loadNotes();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="admin-ca-page">
      <div className="admin-ca-header">
        <h1>Notes</h1>
        <p>Add, edit, or remove study notes shown on the Notes page.</p>
      </div>

      {/* ADD / EDIT FORM */}
      <form
        onSubmit={handleSave}
        className="admin-ca-form"
        style={{ marginBottom: 24 }}
      >
        <h2 className="admin-ca-list-heading" style={{ marginBottom: 12 }}>
          {isEditing ? `Editing: ${form.title || "note"}` : "Add a New Note"}
        </h2>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. HP History Notes"
              style={inputStyle}
            />
          </div>

          <div>
            <label>Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              placeholder="e.g. Himachal Pradesh History"
              style={inputStyle}
            />
          </div>

          <div>
            <label>Price (₹)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="e.g. 49"
              style={inputStyle}
            />
          </div>

          <div>
            <label>PDF filename (optional)</label>
            <input
              type="text"
              value={form.pdf}
              onChange={(e) => updateField("pdf", e.target.value)}
              placeholder="e.g. HP-History-Notes.pdf"
              style={inputStyle}
            />
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          Leave PDF filename empty if the note isn't ready for purchase yet.
          The file itself still needs to be placed in the backend's{" "}
          <code>pdfs</code> folder with this exact name.
        </p>

        {formError && <p className="admin-ca-error">{formError}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button type="submit" disabled={saving} className="admin-ca-submit-btn">
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Note"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={startAdd}
              className="admin-ca-delete-btn"
              style={{
                background: "none",
                border: "1px solid #fca5a5",
                color: "#dc2626",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* LIST */}
      <div className="admin-ca-list-header">
        <h2 className="admin-ca-list-heading">All Notes</h2>
        <span>
          {notes.length} {notes.length === 1 ? "Note" : "Notes"}
        </span>
      </div>

      {loading && <p className="admin-ca-loading">Loading notes...</p>}
      {error && <p className="admin-ca-error">Error: {error}</p>}

      {!loading && !error && notes.length === 0 && (
        <div className="admin-ca-empty">
          <h3>No Notes Yet</h3>
          <p>Add your first note using the form above.</p>
        </div>
      )}

      <div className="admin-ca-list">
        {notes.map((note) => (
          <div key={note.id} className="admin-ca-item">
            <div className="admin-ca-item-header">
              <strong>{note.title}</strong>
              <span>₹{note.price}</span>
            </div>

            <p style={{ marginBottom: 4 }}>{note.subject}</p>

            <p style={{ fontSize: 12, color: note.pdf ? "#15803d" : "#b45309" }}>
              {note.pdf ? `PDF: ${note.pdf}` : "No PDF uploaded yet"}
            </p>

            <div className="admin-ca-item-actions">
              <button
                className="admin-ca-edit-btn"
                onClick={() => startEdit(note)}
              >
                Edit
              </button>
              <button
                className="admin-ca-delete-btn"
                onClick={() => handleDelete(note.id)}
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

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 13,
  boxSizing: "border-box",
  marginTop: 4,
};