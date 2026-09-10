import { useEffect, useState } from "react";
import "./AdminCurrentAffairs.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminCurrentAffairs() {
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem("adminKey") || ""
  );
  const [unlocked, setUnlocked] = useState(!!sessionStorage.getItem("adminKey"));
  const [keyInput, setKeyInput] = useState("");

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function loadEntries() {
    setLoading(true);
    fetch(`${API_BASE}/api/current-affairs`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (unlocked) loadEntries();
  }, [unlocked]);

  function handleUnlock(e) {
    e.preventDefault();
    sessionStorage.setItem("adminKey", keyInput);
    setAdminKey(keyInput);
    setUnlocked(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API_BASE}/api/current-affairs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ title, summary, date }),
      });
      if (res.status === 401) {
        // Wrong/expired key — send back to the unlock screen
        sessionStorage.removeItem("adminKey");
        setUnlocked(false);
        throw new Error("Admin key rejected. Please re-enter it.");
      }
      if (!res.ok) throw new Error("Failed to add entry");
      setTitle("");
      setSummary("");
      loadEntries();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/current-affairs/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to delete");
      loadEntries();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!unlocked) {
    return (
      <div className="admin-ca-lock-page">
        <form className="admin-ca-lock-card" onSubmit={handleUnlock}>
          <h2>Admin — Current Affairs</h2>
          <p>Enter the admin key to manage entries.</p>
          <input
            type="password"
            placeholder="Admin key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            required
          />
          <button type="submit">Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-ca-page">
      <h1>Manage Current Affairs</h1>

      <form className="admin-ca-form" onSubmit={handleSubmit}>
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
            placeholder="2-3 line summary relevant to exam preparation..."
            rows={4}
            required
          />
        </label>

        {submitError && <p className="admin-ca-error">{submitError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Entry"}
        </button>
      </form>

      <h2 className="admin-ca-list-heading">Existing Entries</h2>

      {loading && <p>Loading...</p>}
      {error && <p className="admin-ca-error">Error: {error}</p>}

      <div className="admin-ca-list">
        {entries.map((entry) => (
          <div key={entry.id} className="admin-ca-item">
            <div className="admin-ca-item-header">
              <strong>{entry.title}</strong>
              <span>{entry.date?.slice(0, 10)}</span>
            </div>
            <p>{entry.summary}</p>
            <button
              className="admin-ca-delete-btn"
              onClick={() => handleDelete(entry.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}