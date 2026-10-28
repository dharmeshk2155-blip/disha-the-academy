import { useEffect, useMemo, useState } from "react";
import useAutoFullscreen from "../hooks/useAutoFullscreen";
import { Link, useParams } from "react-router-dom";
import ArticleBody, { ArticleToc } from "../components/ArticleBody";
import { parseArticle } from "../utils/articleParser";
import "./BlogDetails.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getReadingTime(content = "") {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function BlogDetails() {
  useAutoFullscreen();

  const { id } = useParams();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState("");

  // headings, tables, lists ... found in the article text
  const parsed = useMemo(() => parseArticle(blog?.content || "", { title: blog?.title }), [blog]);

  // highlight the heading that is being read
  useEffect(() => {
    if (!parsed.toc.length || typeof IntersectionObserver === "undefined") return undefined;

    const seen = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const first = parsed.toc.find((t) => seen.get(t.id));
        if (first) setActiveId(first.id);
      },
      { rootMargin: "-90px 0px -65% 0px" }
    );

    parsed.toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [parsed]);

  useEffect(() => {
    async function loadBlog() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/blog/${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Blog article not found.");
          }

          throw new Error("Unable to load this article.");
        }

        const data = await response.json();
        setBlog(data);
      } catch (err) {
        console.error("Blog details error:", err);
        setError(err.message || "Unable to load this article.");
      } finally {
        setLoading(false);
      }
    }

    loadBlog();
  }, [id]);

  if (loading) {
    return (
      <main className="blog-details-page">
        <div className="blog-details-state">
          <div className="blog-details-loader" />
          <h2>Loading article...</h2>
        </div>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="blog-details-page">
        <div className="blog-details-state">
          <span className="blog-details-state-icon">!</span>

          <h2>Article unavailable</h2>

          <p>{error || "This article could not be found."}</p>

          <Link to="/blog" className="blog-details-back-btn">
            ← Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="blog-details-page">
      <section className="blog-details-hero">
        <div className="blog-details-hero-inner">
          <div className="blog-details-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/blog">Blog</Link>
            <span>/</span>
            <span>Article</span>
          </div>

          <span className="blog-details-category">
            {blog.category || "Education"}
          </span>

          <h1>{blog.title}</h1>

          <p className="blog-details-summary">
            {blog.summary}
          </p>

          <div className="blog-details-meta">
            <div>
              <span>Written by</span>
              <strong>
                {blog.author || "Disha The Academy"}
              </strong>
            </div>

            <div className="blog-details-divider" />

            <div>
              <span>Published</span>
              <strong>{formatDate(blog.date)}</strong>
            </div>

            <div className="blog-details-divider" />

            <div>
              <span>Reading time</span>
              <strong>
                {getReadingTime(blog.content)} min read
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-details-container">
        {blog.imageUrl && (
          <div className="blog-details-cover">
            <img src={blog.imageUrl} alt={blog.title} />
          </div>
        )}

        <div className="blog-details-layout">
          <article className="blog-details-article">
            <div className="blog-details-intro">
              {blog.summary}
            </div>

            {parsed.toc.length >= 3 && (
              <details className="ab-toc-mobile">
                <summary>In this article</summary>
                <ArticleToc items={parsed.toc} activeId={activeId} />
              </details>
            )}

            <div className="blog-details-body">
              <ArticleBody parsed={parsed} />
            </div>

            <div className="blog-details-end">
              <span>DISHA THE ACADEMY</span>

              <h3>Keep learning. Keep improving.</h3>

              <p>
                Explore more preparation guides, current affairs
                and study resources created for competitive exam
                aspirants.
              </p>

              <Link to="/blog">
                Explore More Articles →
              </Link>
            </div>
          </article>

          <aside className="blog-details-sidebar">
            {parsed.toc.length >= 3 && (
              <div className="ab-toc-side">
                <ArticleToc items={parsed.toc} activeId={activeId} />
              </div>
            )}

            <div className="blog-details-side-card">
              <span className="blog-details-side-label">
                ARTICLE DETAILS
              </span>

              <div className="blog-details-side-row">
                <span>Category</span>
                <strong>{blog.category || "Education"}</strong>
              </div>

              <div className="blog-details-side-row">
                <span>Author</span>
                <strong>
                  {blog.author || "Disha The Academy"}
                </strong>
              </div>

              <div className="blog-details-side-row">
                <span>Published</span>
                <strong>{formatDate(blog.date)}</strong>
              </div>

              <div className="blog-details-side-row">
                <span>Read Time</span>
                <strong>
                  {getReadingTime(blog.content)} min
                </strong>
              </div>
            </div>

            <div className="blog-details-exam-card">
              <span>PREPARATION HUB</span>

              <h3>Prepare smarter with Disha</h3>

              <p>
                Practice mock tests and stay updated with important
                current affairs alongside your daily preparation.
              </p>

              <Link to="/take-mock-test">
                Take a Mock Test →
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default BlogDetails;