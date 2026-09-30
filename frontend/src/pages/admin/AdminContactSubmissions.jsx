import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Mail,
  Search,
  RefreshCw,
  Trash2,
  CalendarDays,
  User,
  MessageSquare,
  Inbox,
  X,
  Eye,
} from "lucide-react";

import "./AdminContactSubmissions.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

export default function AdminContactSubmissions() {
  const { adminToken } = useOutletContext();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  // =====================================================
  // LOAD MESSAGES
  // =====================================================

  async function loadSubmissions() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/contact`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Admin key rejected. Lock dashboard and enter the admin key again."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load contact messages."
        );
      }

      const data = await response.json();

      setSubmissions(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Contact messages load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load contact messages."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminToken) {
      loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredSubmissions = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return submissions;
    }

    return submissions.filter((submission) => {
      const searchableText = [
        submission.name,
        submission.email,
        submission.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [submissions, search]);

  // =====================================================
  // DELETE MESSAGE
  // =====================================================

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this message?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(
        `${API_BASE}/api/contact/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Admin key rejected."
        );
      }

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to delete message."
        );
      }

      setSubmissions((current) =>
        current.filter(
          (submission) =>
            submission.id !== id
        )
      );

      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      alert(
        err.message ||
          "Unable to delete message."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =====================================================
  // DATE
  // =====================================================

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatDateTime(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return (
    <div className="admin-contact-page">

      {/* HEADER */}

      <section className="admin-contact-header">
        <div>
          <span className="admin-contact-eyebrow">
            WEBSITE
          </span>

          <h1>Contact Messages</h1>

          <p>
            View and manage messages submitted
            through the Contact Us form.
          </p>
        </div>

        <button
          type="button"
          className="admin-contact-refresh"
          onClick={loadSubmissions}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "admin-contact-spin"
                : ""
            }
          />

          Refresh
        </button>
      </section>

      {/* SUMMARY */}

      <section className="admin-contact-summary">

        <div className="admin-contact-summary-icon">
          <Inbox size={22} />
        </div>

        <div>
          <span>Total Messages</span>

          <strong>
            {loading
              ? "..."
              : submissions.length}
          </strong>

          <small>
            Contact form submissions
          </small>
        </div>

      </section>

      {/* SEARCH */}

      <section className="admin-contact-tools">

        <div className="admin-contact-search">
          <Search size={17} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, email or message..."
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <span className="admin-contact-results">
          {filteredSubmissions.length}{" "}
          {filteredSubmissions.length === 1
            ? "message"
            : "messages"}
        </span>

      </section>

      {/* ERROR */}

      {error && (
        <div className="admin-contact-error">
          <div>
            <strong>
              Messages could not be loaded
            </strong>

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={loadSubmissions}
          >
            Try Again
          </button>
        </div>
      )}

      {/* CONTENT */}

      {loading ? (
        <div className="admin-contact-empty">

          <RefreshCw
            size={25}
            className="admin-contact-spin"
          />

          <strong>
            Loading messages...
          </strong>

        </div>
      ) : !error &&
        filteredSubmissions.length === 0 ? (
        <div className="admin-contact-empty">

          <div className="admin-contact-empty-icon">
            <Mail size={26} />
          </div>

          <strong>
            {search
              ? "No matching messages"
              : "No Messages Yet"}
          </strong>

          <p>
            {search
              ? "Try another search."
              : "New Contact Us submissions will appear here."}
          </p>

        </div>
      ) : (
        !error && (
          <div className="admin-contact-list">

            {filteredSubmissions.map(
              (submission) => (
                <article
                  key={submission.id}
                  className="admin-contact-card"
                >

                  <div className="admin-contact-card-main">

                    <div className="admin-contact-avatar">
                      {String(
                        submission.name || "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="admin-contact-card-content">

                      <div className="admin-contact-card-top">

                        <div>
                          <h3>
                            {submission.name ||
                              "Unknown User"}
                          </h3>

                          <a
                            href={`mailto:${
                              submission.email || ""
                            }`}
                          >
                            <Mail size={13} />

                            {submission.email ||
                              "No email"}
                          </a>
                        </div>

                        <span className="admin-contact-date">
                          <CalendarDays
                            size={13}
                          />

                          {formatDate(
                            submission.submittedAt
                          )}
                        </span>

                      </div>

                      <p className="admin-contact-preview">
                        {submission.message ||
                          "No message content."}
                      </p>

                    </div>

                  </div>

                  <div className="admin-contact-actions">

                    <button
                      type="button"
                      className="admin-contact-view"
                      onClick={() =>
                        setSelectedMessage(
                          submission
                        )
                      }
                    >
                      <Eye size={15} />
                      View
                    </button>

                    <button
                      type="button"
                      className="admin-contact-delete"
                      onClick={() =>
                        handleDelete(
                          submission.id
                        )
                      }
                      disabled={
                        deletingId ===
                        submission.id
                      }
                    >
                      <Trash2 size={15} />

                      {deletingId ===
                      submission.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </article>
              )
            )}

          </div>
        )
      )}

      {/* MESSAGE MODAL */}

      {selectedMessage && (
        <div
          className="admin-contact-modal-backdrop"
          onClick={() =>
            setSelectedMessage(null)
          }
        >

          <div
            className="admin-contact-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="admin-contact-modal-close"
              onClick={() =>
                setSelectedMessage(null)
              }
            >
              <X size={20} />
            </button>

            <div className="admin-contact-modal-head">

              <div className="admin-contact-modal-icon">
                <MessageSquare size={22} />
              </div>

              <div>
                <span>
                  CONTACT MESSAGE
                </span>

                <h2>
                  {selectedMessage.name ||
                    "Unknown User"}
                </h2>

                <p>
                  {formatDateTime(
                    selectedMessage.submittedAt
                  )}
                </p>
              </div>

            </div>

            <div className="admin-contact-modal-info">

              <div>
                <User size={17} />

                <span>
                  <small>Name</small>

                  <strong>
                    {selectedMessage.name ||
                      "—"}
                  </strong>
                </span>
              </div>

              <div>
                <Mail size={17} />

                <span>
                  <small>Email</small>

                  <a
                    href={`mailto:${
                      selectedMessage.email ||
                      ""
                    }`}
                  >
                    {selectedMessage.email ||
                      "—"}
                  </a>
                </span>
              </div>

            </div>

            <div className="admin-contact-full-message">

              <span>
                <MessageSquare size={15} />
                MESSAGE
              </span>

              <p>
                {selectedMessage.message ||
                  "No message content."}
              </p>

            </div>

            <div className="admin-contact-modal-actions">

              <a
                href={`mailto:${
                  selectedMessage.email ||
                  ""
                }`}
                className="admin-contact-reply"
              >
                <Mail size={16} />
                Reply by Email
              </a>

              <button
                type="button"
                className="admin-contact-delete"
                onClick={() =>
                  handleDelete(
                    selectedMessage.id
                  )
                }
              >
                <Trash2 size={15} />
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}