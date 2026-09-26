import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./AdminCurrentAffairs.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminContactSubmissions() {
  const { adminKey } = useOutletContext();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =====================================================
  // LOAD SUBMISSIONS
  // =====================================================
  async function loadSubmissions() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        headers: { "x-admin-key": adminKey },
      });

      if (res.status === 401) {
        throw new Error("Admin key rejected. Try locking and re-entering it.");
      }

      if (!res.ok) {
        throw new Error("Failed to load submissions");
      }

      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // DELETE
  // =====================================================
  async function handleDelete(id) {
    if (!window.confirm("Delete this message?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/contact/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });

      if (res.status === 401) {
        throw new Error("Admin key rejected.");
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete message");
      }

      await loadSubmissions();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="admin-ca-page">
      <div className="admin-ca-header">
        <h1>Contact Us Messages</h1>
        <p>Messages submitted through the site's Contact Us form.</p>
      </div>

      <div className="admin-ca-list-header">
        <h2 className="admin-ca-list-heading">Submissions</h2>
        <span>
          {submissions.length}{" "}
          {submissions.length === 1 ? "Message" : "Messages"}
        </span>
      </div>

      {loading && <p className="admin-ca-loading">Loading messages...</p>}

      {error && <p className="admin-ca-error">Error: {error}</p>}

      {!loading && !error && submissions.length === 0 && (
        <div className="admin-ca-empty">
          <h3>No Messages Yet</h3>
          <p>Submissions from the Contact Us form will show up here.</p>
        </div>
      )}

      <div className="admin-ca-list">
        {submissions.map((sub) => (
          <div key={sub.id} className="admin-ca-item">
            <div className="admin-ca-item-header">
              <strong>{sub.name}</strong>
              <span>
                {sub.submittedAt
                  ? new Date(sub.submittedAt).toLocaleString("en-IN")
                  : ""}
              </span>
            </div>

            <p style={{ marginBottom: 4 }}>
              <a href={`mailto:${sub.email}`}>{sub.email}</a>
            </p>

            <p>{sub.message}</p>

            <div className="admin-ca-item-actions">
              <button
                className="admin-ca-delete-btn"
                onClick={() => handleDelete(sub.id)}
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