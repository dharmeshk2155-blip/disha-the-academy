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

import {
  NOTE_CATEGORIES,
} from "../data/notesContent";

import "./NotesFlow.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

export default function NoteCategory() {
  const { categorySlug } =
    useParams();

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
          "Category notes error:",
          err
        );

        setError(
          err.message ||
            "Unable to load category."
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

  const categoryData =
    useMemo(() => {
      const categoryNotes =
        notes.filter(
          (note) =>
            note.categorySlug ===
            categorySlug
        );

      if (
        categoryNotes.length === 0
      ) {
        return null;
      }

      const staticCategory =
        NOTE_CATEGORIES.find(
          (category) =>
            category.slug ===
            categorySlug
        );

      const subcategoryMap =
        new Map();

      categoryNotes.forEach(
        (note) => {
          const slug =
            note.subcategorySlug;

          if (!slug) {
            return;
          }

          if (
            !subcategoryMap.has(
              slug
            )
          ) {
            subcategoryMap.set(
              slug,
              {
                slug,
                title:
                  note.subcategoryTitle ||
                  "Study Notes",
                totalCount: 0,
                availableCount: 0,
              }
            );
          }

          const subcategory =
            subcategoryMap.get(
              slug
            );

          subcategory.totalCount += 1;

          if (note.pdf) {
            subcategory.availableCount +=
              1;
          }
        }
      );

      const subcategories =
        Array.from(
          subcategoryMap.values()
        );

      return {
        slug: categorySlug,

        title:
          categoryNotes[0]
            ?.categoryTitle ||
          staticCategory?.title ||
          "Study Notes",

        subject:
          staticCategory?.subject ||
          "Competitive Exam Preparation",

        subcategories,
      };
    }, [notes, categorySlug]);

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
          Loading category...
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

  if (!categoryData) {
    return (
      <div className="nf-page">
        <Link
          to="/notes"
          className="nf-back-link"
        >
          ← Back to Notes
        </Link>

        <div className="nf-status">
          Category not found.
        </div>
      </div>
    );
  }

  return (
    <div className="nf-page">
      <button
        className="nf-back-link"
        onClick={() =>
          navigate("/notes")
        }
      >
        ← Back to Notes
      </button>

      <div className="nf-header">
        <h1>
          {categoryData.title}
        </h1>

        <p>
          {categoryData.subject} —
          choose a topic area below.
        </p>
      </div>

      <div className="nf-grid">
        {categoryData.subcategories.map(
          (sub) => (
            <div
              key={sub.slug}
              className="nf-card"
              onClick={() =>
                navigate(
                  `/notes/${categoryData.slug}/${sub.slug}`
                )
              }
            >
              <div className="nf-card-icon">
                📄
              </div>

              <div className="nf-card-info">
                <div className="nf-card-title">
                  {sub.title}
                </div>

                <div className="nf-card-subtitle">
                  {sub.availableCount >
                  0
                    ? `${sub.availableCount} ${
                        sub.availableCount ===
                        1
                          ? "note"
                          : "notes"
                      } available`
                    : "Coming soon"}
                </div>
              </div>

              <button
                type="button"
                className="nf-card-btn"
              >
                View
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}