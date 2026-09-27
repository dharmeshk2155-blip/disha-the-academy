import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
  Link,
} from "react-router-dom";

import "./NotesFlow.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

export default function NoteSubcategory() {
  const {
    categorySlug,
    subcategorySlug,
  } = useParams();

  const navigate =
    useNavigate();

  const [notes, setNotes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadNotes() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/notes`,
          {
            signal:
              controller.signal,
          }
        );

        const data = await response
          .json()
          .catch(() => []);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load notes."
          );
        }

        setNotes(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        if (
          err.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Subcategory notes error:",
          err
        );

        setError(
          err.message ||
            "Unable to load notes."
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotes();

    return () => {
      controller.abort();
    };
  }, []);

  const pageData =
    useMemo(() => {
      const filteredNotes =
        notes.filter(
          (note) =>
            note.categorySlug ===
              categorySlug &&
            note.subcategorySlug ===
              subcategorySlug
        );

      if (
        filteredNotes.length ===
        0
      ) {
        return null;
      }

      return {
        category: {
          slug: categorySlug,
          title:
            filteredNotes[0]
              ?.categoryTitle ||
            "Study Notes",
        },

        subcategory: {
          slug: subcategorySlug,
          title:
            filteredNotes[0]
              ?.subcategoryTitle ||
            "Study Notes",
        },

        topics: filteredNotes,
      };
    }, [
      notes,
      categorySlug,
      subcategorySlug,
    ]);

  if (loading) {
    return (
      <div className="nf-page">
        <Link
          to="/notes"
          className="nf-back-link"
        >
          ← Back to Notes
        </Link>

        <div className="nf-status">
          Loading notes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nf-page">
        <Link
          to="/notes"
          className="nf-back-link"
        >
          ← Back to Notes
        </Link>

        <div className="nf-status">
          {error}
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="nf-page">
        <Link
          to="/notes"
          className="nf-back-link"
        >
          ← Back to Notes
        </Link>

        <div className="nf-status">
          Notes not found.
        </div>
      </div>
    );
  }

  const {
    category,
    subcategory,
    topics,
  } = pageData;

  return (
    <div className="nf-page">
      <button
        className="nf-back-link"
        onClick={() =>
          navigate(
            `/notes/${category.slug}`
          )
        }
      >
        ← Back to{" "}
        {category.title}
      </button>

      <div className="nf-header">
        <h1>
          {subcategory.title}
        </h1>

        <p>
          {category.title}
        </p>
      </div>

      <div className="nf-topic-list">
        {topics.map(
          (topic) => (
            <div
              key={topic.id}
              className="nf-topic-row"
            >
              <div className="nf-topic-icon">
                📚
              </div>

              <div className="nf-topic-info">
                <div className="nf-topic-title">
                  {topic.title}
                </div>

                {!topic.pdf && (
                  <span className="nf-coming-soon-tag">
                    Coming soon
                  </span>
                )}
              </div>

              {topic.pdf ? (
                <>
                  <div className="nf-topic-price">
                    ₹{topic.price}
                  </div>

                  <Link
                    to={`/note/${topic.id}`}
                    className="nf-topic-btn"
                  >
                    View Notes →
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  className="nf-topic-btn disabled"
                  disabled
                >
                  Not available yet
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}