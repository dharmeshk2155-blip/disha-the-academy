import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Blog.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readingTime(content = "") {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function loadBlogs() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/api/blog`);

        if (!response.ok) {
          throw new Error("Unable to load blogs");
        }

        const data = await response.json();
        setBlogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load articles right now.");
      } finally {
        setLoading(false);
      }
    }

    loadBlogs();
  }, []);

  const categories = useMemo(() => {
    const values = blogs
      .map((blog) => blog.category)
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return blogs.filter((blog) => {
      const matchesCategory =
        activeCategory === "All" ||
        blog.category === activeCategory;

      const matchesSearch =
        !query ||
        blog.title?.toLowerCase().includes(query) ||
        blog.summary?.toLowerCase().includes(query) ||
        blog.category?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [blogs, search, activeCategory]);

  const featuredBlog = filteredBlogs[0];
  const remainingBlogs = filteredBlogs.slice(1);

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="blog-hero-inner">
          <span className="blog-eyebrow">DISHA LEARNING JOURNAL</span>

          <h1>
            Learn Better. Prepare Smarter.
            <span> Achieve More.</span>
          </h1>

          <p>
            Practical preparation strategies, study guides and useful
            resources designed to help students prepare with confidence.
          </p>

          <div className="blog-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="blog-content">
        <div className="blog-category-bar">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={
                activeCategory === category ? "active" : ""
              }
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading && (
          <div className="blog-state">
            <div className="blog-loader" />
            <h3>Loading articles...</h3>
          </div>
        )}

        {!loading && error && (
          <div className="blog-state blog-error">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredBlogs.length === 0 && (
          <div className="blog-state">
            <h3>No articles found</h3>
            <p>
              Try another search or category.
            </p>
          </div>
        )}

        {!loading && !error && featuredBlog && (
          <>
            <article className="blog-featured">
              <div className="blog-featured-image">
                {featuredBlog.imageUrl ? (
                  <img
                    src={featuredBlog.imageUrl}
                    alt={featuredBlog.title}
                  />
                ) : (
                  <div className="blog-image-placeholder">
                    <span>D</span>
                    <small>Disha The Academy</small>
                  </div>
                )}
              </div>

              <div className="blog-featured-content">
                <span className="blog-featured-label">
                  FEATURED ARTICLE
                </span>

                <div className="blog-meta">
                  <span>
                    {featuredBlog.category || "Education"}
                  </span>
                  <span>•</span>
                  <span>{formatDate(featuredBlog.date)}</span>
                </div>

                <h2>{featuredBlog.title}</h2>

                <p>{featuredBlog.summary}</p>

                <div className="blog-author-row">
                  <div>
                    <strong>
                      {featuredBlog.author ||
                        "Disha The Academy"}
                    </strong>

                    <span>
                      {readingTime(featuredBlog.content)} min read
                    </span>
                  </div>

                  <Link
                    to={`/blog/${featuredBlog.id}`}
                    className="blog-read-btn"
                  >
                    Read Full Article →
                  </Link>
                </div>
              </div>
            </article>

            {remainingBlogs.length > 0 && (
              <div className="blog-section-heading">
                <div>
                  <span>LATEST ARTICLES</span>
                  <h2>Explore More Resources</h2>
                </div>

                <p>
                  Helpful guides created for competitive exam
                  aspirants.
                </p>
              </div>
            )}

            <div className="blog-grid">
              {remainingBlogs.map((blog) => (
                <article className="blog-card" key={blog.id}>
                  <div className="blog-card-image">
                    {blog.imageUrl ? (
                      <img src={blog.imageUrl} alt={blog.title} />
                    ) : (
                      <div className="blog-image-placeholder">
                        <span>D</span>
                        <small>Disha The Academy</small>
                      </div>
                    )}

                    <span className="blog-card-category">
                      {blog.category || "Education"}
                    </span>
                  </div>

                  <div className="blog-card-body">
                    <div className="blog-card-meta">
                      <span>{formatDate(blog.date)}</span>
                      <span>
                        {readingTime(blog.content)} min read
                      </span>
                    </div>

                    <h3>{blog.title}</h3>

                    <p>{blog.summary}</p>

                    <div className="blog-card-footer">
                      <span>
                        By {blog.author || "Disha The Academy"}
                      </span>

                      <Link to={`/blog/${blog.id}`}>
                        Read Article →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Blog;