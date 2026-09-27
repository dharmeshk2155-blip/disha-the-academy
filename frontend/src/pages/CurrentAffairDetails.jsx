import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Newspaper,
  Sparkles,
} from "lucide-react";
import "./CurrentAffairDetails.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80";

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function calculateReadingTime(article) {
  const text = `${article?.summary || ""} ${article?.content || ""}`.trim();

  if (!text) return "1 min read";

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));

  return `${minutes} min read`;
}

function createParagraphs(text) {
  if (!text) return [];

  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function createKeyPoints(text) {
  if (!text) return [];

  return text
    .split(/\n+/)
    .map((point) =>
      point
        .trim()
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
    )
    .filter(Boolean);
}

export default function CurrentAffairDetails() {
  const { id } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/current-affairs/${encodeURIComponent(id)}`
        );

        if (response.status === 404) {
          throw new Error("This current affair could not be found.");
        }

        if (!response.ok) {
          throw new Error("Failed to load this current affair.");
        }

        const data = await response.json();

        if (!ignore) {
          setArticle(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.message ||
              "Unable to load this article. Please try again."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      ignore = true;
    };
  }, [id]);

  const paragraphs = useMemo(
    () => createParagraphs(article?.content || article?.summary),
    [article]
  );

  const keyPoints = useMemo(
    () => createKeyPoints(article?.keyPoints),
    [article]
  );

  if (loading) {
    return (
      <main className="cad-page">
        <div className="cad-state">
          <div className="cad-loader" />

          <h2>Loading Article</h2>

          <p>Please wait while we prepare your current affair.</p>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="cad-page">
        <div className="cad-state cad-error-state">
          <Newspaper size={42} />

          <h2>Article Not Available</h2>

          <p>{error || "This current affair could not be found."}</p>

          <Link to="/current-affairs" className="cad-back-button">
            <ArrowLeft size={17} />
            Back to Current Affairs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cad-page">
      {/* BACK */}
      <div className="cad-topbar">
        <Link to="/current-affairs" className="cad-back-link">
          <ArrowLeft size={16} />
          Current Affairs
        </Link>

        <span>Disha The Academy</span>
      </div>

      {/* ARTICLE HERO */}
      <article className="cad-article">
        <header className="cad-header">
          <div className="cad-category">
            <Sparkles size={13} />
            {article.category || "Current Affairs"}
          </div>

          <h1>{article.title}</h1>

          <p className="cad-summary">{article.summary}</p>

          <div className="cad-meta">
            <span>
              <CalendarDays size={16} />
              {formatDate(article.date)}
            </span>

            <span>
              <Clock3 size={16} />
              {calculateReadingTime(article)}
            </span>

            <span>
              <BookOpen size={16} />
              Exam Preparation
            </span>
          </div>
        </header>

        {/* FEATURED IMAGE */}
        <div className="cad-featured-image">
          <img
            src={article.imageUrl || FALLBACK_IMAGE}
            alt={article.title}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />

          <div className="cad-image-label">
            <Newspaper size={15} />
            Current Affairs
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="cad-layout">
          <div className="cad-main-content">
            <div className="cad-content-heading">
              <span>
                <BookOpen size={18} />
              </span>

              <div>
                <small>Detailed Explanation</small>
                <h2>What You Need to Know</h2>
              </div>
            </div>

            <div className="cad-article-text">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 20)}`}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>{article.summary}</p>
              )}
            </div>

            {/* EXAM KEY POINTS */}
            {keyPoints.length > 0 && (
              <section className="cad-keypoints">
                <div className="cad-keypoints-title">
                  <div className="cad-keypoints-icon">
                    <Sparkles size={19} />
                  </div>

                  <div>
                    <small>Quick Revision</small>
                    <h2>Key Points for Exams</h2>
                  </div>
                </div>

                <div className="cad-keypoints-list">
                  {keyPoints.map((point, index) => (
                    <div
                      className="cad-keypoint"
                      key={`${index}-${point.slice(0, 20)}`}
                    >
                      <CheckCircle2 size={17} />

                      <p>{point}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="cad-end-note">
              <div>
                <Sparkles size={20} />
              </div>

              <div>
                <strong>Keep Revising</strong>

                <p>
                  Regular revision of current affairs can help you perform
                  better in competitive examinations.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="cad-sidebar">
            <div className="cad-sidebar-card">
              <span className="cad-sidebar-label">
                ARTICLE DETAILS
              </span>

              <div className="cad-detail-row">
                <span>Category</span>
                <strong>
                  {article.category || "Current Affairs"}
                </strong>
              </div>

              <div className="cad-detail-row">
                <span>Published</span>
                <strong>{formatDate(article.date)}</strong>
              </div>

              <div className="cad-detail-row">
                <span>Reading Time</span>
                <strong>{calculateReadingTime(article)}</strong>
              </div>
            </div>

            <div className="cad-exam-card">
              <div className="cad-exam-icon">
                <BookOpen size={25} />
              </div>

              <h3>Exam Focus</h3>

              <p>
                Focus on important names, dates, organisations, schemes,
                reports and facts mentioned in this article.
              </p>
            </div>

            <Link
              to="/current-affairs"
              className="cad-sidebar-back"
            >
              <ArrowLeft size={16} />
              More Current Affairs
            </Link>
          </aside>
        </div>
      </article>
    </main>
  );
}