import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [id]);

  if (loading) {
    return <div style={{ padding: "40px" }}>Loading article...</div>;
  }

  if (error || !article) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Article Not Available</h2>

        <p>{error}</p>

        <Link to="/current-affairs">
          Back to Current Affairs
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 25px",
        boxSizing: "border-box",
      }}
    >
      <Link to="/current-affairs">
        ← Back to Current Affairs
      </Link>

      <p style={{ marginTop: "30px" }}>
        {article.category || "Current Affairs"}
      </p>

      <h1
  style={{
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "clamp(32px, 5vw, 56px)",
    lineHeight: "1.2",
    fontWeight: "800",
    letterSpacing: "-1px",
    margin: "18px 0",
    overflowWrap: "break-word",
  }}
>
  {article.title}
</h1>

      <p>
        {article.date
          ? new Date(article.date).toLocaleDateString("en-IN")
          : ""}
      </p>

      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt={article.title}
          style={{
            width: "100%",
            maxHeight: "500px",
            objectFit: "cover",
            borderRadius: "15px",
            marginTop: "20px",
          }}
        />
      )}

      <h3 style={{ marginTop: "30px" }}>Summary</h3>

      <p>{article.summary}</p>

      <h2 style={{ marginTop: "30px" }}>
        Full Article
      </h2>

      <p style={{ whiteSpace: "pre-line", lineHeight: "1.8" }}>
        {article.content || article.summary}
      </p>

      {article.keyPoints && (
        <>
          <h2 style={{ marginTop: "30px" }}>
            Key Points for Exams
          </h2>

          <div style={{ whiteSpace: "pre-line", lineHeight: "1.8" }}>
            {article.keyPoints}
          </div>
        </>
      )}
    </div>
  );
}