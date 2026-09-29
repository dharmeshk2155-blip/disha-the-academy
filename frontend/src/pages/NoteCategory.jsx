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
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Landmark,
  Mountain,
  Newspaper,
  Scale,
} from "lucide-react";

import {
  NOTE_CATEGORIES,
} from "../data/notesContent";

import "./NoteCategoryPage.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

// =====================================================
// TITLE SPLIT — last word(s) rendered in gold, like the
// main Notes page heading ("HP General [Knowledge]")
// =====================================================

function TwoToneTitle({ text }) {
  const words = String(text || "")
    .trim()
    .split(/\s+/);

  if (words.length <= 1) {
    return (
      <span className="ncp-title-gold">
        {text}
      </span>
    );
  }

  const goldWord = words.pop();
  const rest = words.join(" ");

  return (
    <>
      {rest}{" "}
      <span className="ncp-title-gold">
        {goldWord}
      </span>
    </>
  );
}

// =====================================================
// SUBCATEGORY -> ICON + DESCRIPTION
// (subcategory descriptions aren't stored anywhere yet,
// so we infer a sensible one from the slug/title)
// =====================================================

function subcategoryIcon(sub) {
  const text = `${sub.slug} ${sub.title}`.toLowerCase();

  if (text.includes("histor")) return Landmark;
  if (text.includes("geograph")) return Mountain;
  if (text.includes("polity") || text.includes("constitution")) return Scale;
  if (text.includes("current") || text.includes("affair")) return Newspaper;
  if (text.includes("mcq") || text.includes("important")) return ClipboardCheck;
  if (text.includes("science")) return FlaskConical;
  if (
    text.includes("math") ||
    text.includes("percentage") ||
    text.includes("profit") ||
    text.includes("ratio") ||
    text.includes("average") ||
    text.includes("time")
  ) {
    return Calculator;
  }
  if (
    text.includes("reason") ||
    text.includes("analogy") ||
    text.includes("series") ||
    text.includes("coding") ||
    text.includes("blood") ||
    text.includes("direction")
  ) {
    return Brain;
  }

  return BookOpen;
}

function subcategoryDescription(sub, category) {
  const text = `${sub.slug} ${sub.title}`.toLowerCase();

  if (text.includes("histor")) {
    return `Complete notes on the history of ${category.subject}.`;
  }
  if (text.includes("geograph")) {
    return "Detailed notes on physical features, climate, rivers, and more.";
  }
  if (text.includes("polity") || text.includes("constitution")) {
    return "Government structure, administration and important departments.";
  }
  if (text.includes("current") || text.includes("affair")) {
    return `Latest updates related to ${category.subject} for competitive exams.`;
  }
  if (text.includes("mcq") || text.includes("important")) {
    return "Topic-wise important questions for better practice.";
  }
  if (text.includes("science")) {
    return "Key scientific concepts explained for exam preparation.";
  }
  if (text.includes("math")) {
    return "Formulas, shortcuts and practice questions for quick revision.";
  }
  if (text.includes("reason")) {
    return "Concepts and practice questions to sharpen problem solving.";
  }

  return `Study material and practice notes for ${sub.title}.`;
}

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

          // Availability is decided by real content
          // (hasContent), not by a legacy PDF filename.
          if (note.hasContent) {
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
      <div className="ncp-page">
        <Link
          to="/notes"
          className="ncp-back"
        >
          <ArrowLeft size={16} />
          Back to Notes
        </Link>

        <div className="ncp-status">
          Loading category...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ncp-page">
        <Link
          to="/notes"
          className="ncp-back"
        >
          <ArrowLeft size={16} />
          Back to Notes
        </Link>

        <div className="ncp-status">
          {error}
        </div>
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="ncp-page">
        <Link
          to="/notes"
          className="ncp-back"
        >
          <ArrowLeft size={16} />
          Back to Notes
        </Link>

        <div className="ncp-status">
          Category not found.
        </div>
      </div>
    );
  }

  return (
    <div className="ncp-page">
      <button
        type="button"
        className="ncp-back"
        onClick={() =>
          navigate("/notes")
        }
      >
        <ArrowLeft size={16} />
        Back to Notes
      </button>

      <div className="ncp-header">
        <h1>
          <TwoToneTitle
            text={categoryData.title}
          />
        </h1>

        <p>
          {categoryData.subject} —
          choose a topic area below.
        </p>

        <div className="ncp-divider">
          <span />
          <BookOpen size={16} />
          <span />
        </div>
      </div>

      <div className="ncp-grid">
        {categoryData.subcategories.map(
          (sub, index) => {
            const Icon =
              subcategoryIcon(sub);

            const tone =
              index % 2 === 0
                ? "gold"
                : "blue";

            const destination = `/notes/${categoryData.slug}/${sub.slug}`;

            return (
              <article
                key={sub.slug}
                className={`ncp-card ${tone}`}
                onClick={() =>
                  navigate(destination)
                }
              >
                <span
                  className={`ncp-card-icon ${tone}`}
                >
                  <Icon size={30} />
                </span>

                <div className="ncp-card-body">
                  <h3>
                    {sub.title}
                  </h3>

                  <p>
                    {subcategoryDescription(
                      sub,
                      categoryData
                    )}
                  </p>
                </div>

                <div className="ncp-card-foot">
                  <span className="ncp-card-count">
                    <FileText
                      size={15}
                    />

                    {sub.availableCount >
                    0
                      ? `${sub.availableCount} ${
                          sub.availableCount ===
                          1
                            ? "note"
                            : "notes"
                        } available`
                      : "Coming soon"}
                  </span>

                  <Link
                    to={destination}
                    className="ncp-card-btn"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    View
                    <ArrowRight
                      size={15}
                    />
                  </Link>
                </div>
              </article>
            );
          }
        )}
      </div>
    </div>
  );
}