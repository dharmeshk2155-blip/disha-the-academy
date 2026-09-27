import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Newspaper,
  Search,
  Sparkles,
} from "lucide-react";
import "./CurrentAffairs.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80";

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getReadingTime(item) {
  const text = `${item.summary || ""} ${item.content || ""}`.trim();

  if (!text) return "1 min read";

  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

function getCategory(item) {
  return item.category?.trim() || "Current Affairs";
}

export default function CurrentAffairs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let ignore = false;

    async function loadCurrentAffairs() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/api/current-affairs`);

        if (!response.ok) {
          throw new Error("Failed to load current affairs.");
        }

        const data = await response.json();

        if (!ignore) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.message ||
              "Unable to load current affairs. Please try again."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCurrentAffairs();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        items
          .map((item) => getCategory(item))
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const category = getCategory(item);

      const matchesCategory =
        activeCategory === "All" ||
        category.toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [items, search, activeCategory]);

  const featuredArticle = filteredItems[0];
  const remainingArticles = filteredItems.slice(1);

  return (
    <main className="ca-public-page">
      {/* HERO */}
      <section className="ca-public-hero">
        <div className="ca-public-hero-content">
          <div className="ca-public-eyebrow">
            <Sparkles size={15} />
            <span>Exam Focused Daily Updates</span>
          </div>

          <h1>
            Stay Updated with
            <span> Current Affairs</span>
          </h1>

          <p>
            Important national, international, economy, science, sports and
            exam-relevant updates — explained in a simple way for competitive
            exam preparation.
          </p>

          <div className="ca-public-search">
            <Search size={20} />

            <input
              type="text"
              placeholder="Search current affairs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="ca-public-hero-decoration">
          <div className="ca-public-hero-icon">
            <Newspaper size={44} />
          </div>

          <strong>Daily Current Affairs</strong>
          <span>Read • Learn • Revise</span>
        </div>
      </section>

      {/* CATEGORY FILTERS */}
      {!loading && !error && items.length > 0 && (
        <section className="ca-category-section">
          <div className="ca-category-heading">
            <div>
              <span>Explore Topics</span>
              <h2>Browse by Category</h2>
            </div>

            <p>{filteredItems.length} articles found</p>
          </div>

          <div className="ca-category-list">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={
                  activeCategory === category
                    ? "ca-category-btn active"
                    : "ca-category-btn"
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* LOADING */}
      {loading && (
        <div className="ca-public-state">
          <div className="ca-public-loader" />
          <h3>Loading Current Affairs</h3>
          <p>Please wait while we fetch the latest updates.</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="ca-public-state ca-public-error">
          <Newspaper size={34} />
          <h3>Unable to load Current Affairs</h3>
          <p>{error}</p>
        </div>
      )}

      {/* EMPTY DATABASE */}
      {!loading && !error && items.length === 0 && (
        <div className="ca-public-state">
          <Newspaper size={36} />
          <h3>No Current Affairs Yet</h3>
          <p>New exam-focused updates will appear here soon.</p>
        </div>
      )}

      {/* NO SEARCH RESULTS */}
      {!loading &&
        !error &&
        items.length > 0 &&
        filteredItems.length === 0 && (
          <div className="ca-public-state">
            <Search size={34} />
            <h3>No articles found</h3>
            <p>Try another keyword or select a different category.</p>

            <button
              type="button"
              className="ca-reset-filter"
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

      {/* FEATURED ARTICLE */}
      {!loading && !error && featuredArticle && (
        <>
          <section className="ca-section-title">
            <div>
              <span className="ca-title-line" />
              <div>
                <small>Latest Update</small>
                <h2>Featured Current Affair</h2>
              </div>
            </div>
          </section>

          <article className="ca-featured-card">
            <div className="ca-featured-image">
              <img
                src={featuredArticle.imageUrl || FALLBACK_IMAGE}
                alt={featuredArticle.title}
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />

              <span className="ca-featured-badge">
                <Sparkles size={13} />
                Latest
              </span>
            </div>

            <div className="ca-featured-content">
              <span className="ca-article-category">
                {getCategory(featuredArticle)}
              </span>

              <h2>{featuredArticle.title}</h2>

              <p>{featuredArticle.summary}</p>

              <div className="ca-article-meta">
                <span>
                  <CalendarDays size={15} />
                  {formatDate(featuredArticle.date)}
                </span>

                <span>
                  <Clock3 size={15} />
                  {getReadingTime(featuredArticle)}
                </span>
              </div>

              <button
                type="button"
                className="ca-read-btn"
                onClick={() => {
                  window.location.href = `/current-affairs/${featuredArticle.id}`;
                }}
              >
                Read Full Article
                <ArrowRight size={17} />
              </button>
            </div>
          </article>
        </>
      )}

      {/* ARTICLE GRID */}
      {!loading && !error && remainingArticles.length > 0 && (
        <section className="ca-all-articles">
          <div className="ca-section-title ca-all-title">
            <div>
              <span className="ca-title-line" />

              <div>
                <small>Keep Learning</small>
                <h2>More Current Affairs</h2>
              </div>
            </div>
          </div>

          <div className="ca-articles-grid">
            {remainingArticles.map((item) => (
              <article key={item.id} className="ca-article-card">
                <div className="ca-card-image">
                  <img
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.title}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />

                  <span>{getCategory(item)}</span>
                </div>

                <div className="ca-card-body">
                  <div className="ca-card-date">
                    <CalendarDays size={14} />
                    {formatDate(item.date)}
                  </div>

                  <h3>{item.title}</h3>

                  <p>{item.summary}</p>

                  <div className="ca-card-footer">
                    <span>
                      <Clock3 size={14} />
                      {getReadingTime(item)}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/current-affairs/${item.id}`;
                      }}
                    >
                      Read Article
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}