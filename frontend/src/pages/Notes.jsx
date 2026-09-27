import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  NOTE_CATEGORIES,
} from "../data/notesContent";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

function Notes() {
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
          "Notes loading error:",
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

  // =====================================================
  // BUILD CATEGORY LIST FROM SQL NOTES
  // =====================================================

  const categories = useMemo(() => {
    const categoryMap =
      new Map();

    notes.forEach((note) => {
      const slug =
        note.categorySlug;

      if (!slug) {
        return;
      }

      if (
        !categoryMap.has(slug)
      ) {
        const staticCategory =
          NOTE_CATEGORIES.find(
            (category) =>
              category.slug ===
              slug
          );

        categoryMap.set(slug, {
          slug,

          title:
            note.categoryTitle ||
            staticCategory?.title ||
            "Study Notes",

          subject:
            staticCategory?.subject ||
            "Competitive Exam Preparation",

          description:
            staticCategory
              ?.description ||
            "Study notes and PDF material for competitive exam preparation.",

          count: 0,
        });
      }

      const category =
        categoryMap.get(slug);

      category.count += 1;
    });

    const dynamicCategories =
      Array.from(
        categoryMap.values()
      );

    // Keep original category order
    // wherever possible.
    return dynamicCategories.sort(
      (a, b) => {
        const aIndex =
          NOTE_CATEGORIES.findIndex(
            (item) =>
              item.slug === a.slug
          );

        const bIndex =
          NOTE_CATEGORIES.findIndex(
            (item) =>
              item.slug === b.slug
          );

        if (
          aIndex !== -1 &&
          bIndex !== -1
        ) {
          return aIndex - bIndex;
        }

        if (aIndex !== -1) {
          return -1;
        }

        if (bIndex !== -1) {
          return 1;
        }

        return a.title.localeCompare(
          b.title
        );
      }
    );
  }, [notes]);

  return (
    <main className="notes-page">
      <section className="notes-header">
        <h1>
          Study Notes
        </h1>

        <p>
          Quality study material for
          competitive exam preparation
        </p>
      </section>

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
          }}
        >
          <h3>
            Loading Study Notes...
          </h3>

          <p>
            Please wait a moment.
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            maxWidth: "650px",
            margin: "30px auto",
            padding: "20px",
            borderRadius: "12px",
            background: "#fff1f1",
            color: "#b42318",
            textAlign: "center",
          }}
        >
          <strong>
            Unable to load notes
          </strong>

          <p
            style={{
              marginBottom: 0,
            }}
          >
            {error}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        categories.length === 0 && (
          <div
            style={{
              textAlign:
                "center",
              padding:
                "50px 20px",
            }}
          >
            <h3>
              No Notes Available
            </h3>

            <p>
              Study notes will be
              available soon.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        categories.length > 0 && (
          <section className="notes-grid">
            {categories.map(
              (category) => (
                <div
                  className="note-card"
                  key={
                    category.slug
                  }
                >
                  <div className="note-icon">
                    📚
                  </div>

                  <div className="note-content">
                    <h2>
                      {
                        category.title
                      }
                    </h2>

                    <p className="note-subject">
                      {
                        category.subject
                      }
                    </p>

                    <p className="note-description">
                      {
                        category.description
                      }
                    </p>

                    <p
                      style={{
                        marginTop:
                          "8px",
                        fontSize:
                          "12px",
                        color:
                          "#7a8494",
                      }}
                    >
                      {
                        category.count
                      }{" "}
                      {category.count ===
                      1
                        ? "note"
                        : "notes"}
                    </p>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      alignItems:
                        "flex-end",
                      flexShrink: 0,
                    }}
                  >
                    <Link
                      to={`/notes/${category.slug}`}
                      className="note-button"
                    >
                      View Notes →
                    </Link>
                  </div>
                </div>
              )
            )}
          </section>
        )}
    </main>
  );
}

export default Notes;