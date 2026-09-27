import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./CurrentAffairDetails.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

function formatDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getReadingTime(article) {
  const text = `${article?.summary || ""} ${article?.content || ""}`;
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function getKeyPoints(value) {
  if (!value) return [];

  return value
    .split(/\n+/)
    .map((item) =>
      item
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
    async function fetchArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/current-affairs/${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          throw new Error("Article not found");
        }

        const data = await response.json();
        setArticle(data);
      } catch (err) {
        console.error("Current affair error:", err);
        setError(err.message || "Unable to load article");
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <main className="ca-detail-page">
        <div className="ca-detail-state">
          <div className="ca-detail-loader"></div>
          <h2>Loading Current Affair...</h2>
          <p>Please wait while we prepare the article.</p>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="ca-detail-page">
        <div className="ca-detail-state">
          <div className="ca-state-icon">!</div>

          <h2>Article Not Available</h2>

          <p>{error || "This article could not be found."}</p>

          <Link to="/current-affairs" className="ca-state-button">
            ← Back to Current Affairs
          </Link>
        </div>
      </main>
    );
  }

  const keyPoints = getKeyPoints(article.keyPoints);
  const publishedDate = formatDate(article.date);
  const readingTime = getReadingTime(article);

  return (
    <main className="ca-detail-page">
      <div className="ca-detail-container">

        {/* BREADCRUMB */}
        <div className="ca-detail-top">
          <Link to="/current-affairs" className="ca-back-link">
            <span>←</span>
            Back to Current Affairs
          </Link>

          <span className="ca-brand-small">
            DISHA THE ACADEMY
          </span>
        </div>

        {/* ARTICLE */}
        <article className="ca-detail-article">

          {/* ARTICLE HEADER */}
          <header className="ca-detail-header">
            <div className="ca-category-badge">
              {article.category || "Current Affairs"}
            </div>

            <h1>{article.title}</h1>

            <p className="ca-detail-summary">
              {article.summary}
            </p>

            <div className="ca-article-meta">
              {publishedDate && (
                <span>
                  <span className="ca-meta-icon">◷</span>
                  {publishedDate}
                </span>
              )}

              <span>
                <span className="ca-meta-icon">◉</span>
                {readingTime}
              </span>

              <span>
                <span className="ca-meta-icon">✓</span>
                Exam Relevant
              </span>
            </div>
          </header>

          {/* IMAGE */}
          {article.imageUrl && (
            <div className="ca-featured-image">
              <img
                src={article.imageUrl}
                alt={article.title}
              />

              <div className="ca-image-badge">
                Current Affairs
              </div>
            </div>
          )}

          {/* BODY */}
          <div className="ca-article-layout">

            {/* MAIN COLUMN */}
            <div className="ca-article-main">

              <section className="ca-reading-section">
                <div className="ca-section-heading">
                  <div className="ca-heading-icon">
                    01
                  </div>

                  <div>
                    <span>DETAILED EXPLANATION</span>
                    <h2>What You Need to Know</h2>
                  </div>
                </div>

                <div className="ca-article-content">
                  {(article.content || article.summary)
                    .split(/\n+/)
                    .filter((paragraph) => paragraph.trim())
                    .map((paragraph, index) => (
                      <p key={index}>
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </section>

              {/* KEY POINTS */}
              {keyPoints.length > 0 && (
                <section className="ca-exam-points">
                  <div className="ca-exam-points-header">
                    <div className="ca-bulb">
                      ★
                    </div>

                    <div>
                      <span>QUICK REVISION</span>
                      <h2>Key Points for Exams</h2>
                    </div>
                  </div>

                  <div className="ca-points-list">
                    {keyPoints.map((point, index) => (
                      <div
                        className="ca-point"
                        key={index}
                      >
                        <div className="ca-point-number">
                          {index + 1}
                        </div>

                        <p>{point}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* REVISION NOTE */}
              <div className="ca-revision-note">
                <div className="ca-revision-icon">
                  ✓
                </div>

                <div>
                  <strong>Revision Tip</strong>

                  <p>
                    Focus on important names, dates,
                    organisations, schemes, reports and key
                    facts. These are commonly useful in
                    competitive examinations.
                  </p>
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="ca-detail-sidebar">

              <div className="ca-info-card">
                <span className="ca-card-label">
                  ARTICLE DETAILS
                </span>

                <div className="ca-info-row">
                  <span>Category</span>
                  <strong>
                    {article.category || "Current Affairs"}
                  </strong>
                </div>

                <div className="ca-info-row">
                  <span>Published</span>
                  <strong>
                    {publishedDate || "Not available"}
                  </strong>
                </div>

                <div className="ca-info-row">
                  <span>Reading Time</span>
                  <strong>{readingTime}</strong>
                </div>
              </div>

              <div className="ca-exam-focus-card">
                <div className="ca-focus-icon">
                  ◎
                </div>

                <span>FOR COMPETITIVE EXAMS</span>

                <h3>Exam Focus</h3>

                <p>
                  Read the key facts carefully and revise them
                  regularly for better retention.
                </p>
              </div>

              <Link
                to="/current-affairs"
                className="ca-more-button"
              >
                ← More Current Affairs
              </Link>

            </aside>
          </div>
        </article>
      </div>
    </main>
  );
}