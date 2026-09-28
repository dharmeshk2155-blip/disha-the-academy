import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  NOTE_CATEGORIES,
} from "../data/notesContent";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

function NoteDetails() {
  const { id } = useParams();

  const [note, setNote] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadNote() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/api/notes/${encodeURIComponent(
              id
            )}`,
            {
              signal:
                controller.signal,
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (
          response.status === 404
        ) {
          setNote(null);

          setError(
            "Note not found"
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load note."
          );
        }

        setNote(data);
      } catch (err) {
        if (
          err.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Note details loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load note."
        );

        setNote(null);
      } finally {
        setLoading(false);
      }
    }

    loadNote();

    return () => {
      controller.abort();
    };
  }, [id]);

  const categoryMetadata =
    useMemo(() => {
      if (!note) {
        return null;
      }

      return (
        NOTE_CATEGORIES.find(
          (category) =>
            category.slug ===
            note.categorySlug
        ) || null
      );
    }, [note]);

  if (loading) {
    return (
      <div className="note-details-page">
        <div className="details-card">
          <div className="details-icon">
            📚
          </div>

          <h1>
            Loading Note...
          </h1>

          <p className="details-description">
            Please wait while we
            load the study material.
          </p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="note-details-page">
        <div className="details-card">
          <div className="details-icon">
            📚
          </div>

          <h1>
            Note Not Found
          </h1>

          <p className="details-description">
            This note may no longer
            be available or may have
            been deactivated.
          </p>

          <Link
            to="/notes"
            className="back-button"
          >
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  const description =
    categoryMetadata
      ?.description ||
    `Study material for ${
      note.categoryTitle ||
      "competitive exam preparation"
    }.`;

  return (
    <div className="note-details-page">
      <div className="details-card">

        <Link
          to={`/notes/${note.categorySlug}/${note.subcategorySlug}`}
          className="back-link"
        >
          ← Back to{" "}
          {note.subcategoryTitle ||
            "Notes"}
        </Link>

        <div className="details-icon">
          📖
        </div>

        <span className="details-badge">
          Online Study Notes
        </span>

        <h1>
          {note.title}
        </h1>

        <p className="details-subject">
          {note.categoryTitle}

          {note.subcategoryTitle
            ? ` · ${note.subcategoryTitle}`
            : ""}
        </p>

        <p className="details-description">
          {description}
        </p>

        {note.hasContent ? (
          <div className="purchase-box">

            <div>
              <span className="price-label">
                Price
              </span>

              <div className="details-price">
                ₹{note.price}
              </div>
            </div>

            <Link
              to={`/checkout/${note.id}`}
              className="buy-button"
            >
              Buy Now
            </Link>

          </div>
        ) : (
          <div className="purchase-box">

            <div>
              <span className="price-label">
                Status
              </span>

              <div
                className="details-price"
                style={{
                  fontSize: 18,
                }}
              >
                Coming Soon
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default NoteDetails;