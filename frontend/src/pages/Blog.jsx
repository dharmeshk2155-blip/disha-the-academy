import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  Lightbulb,
  BookOpen,
  BarChart3,
  FileText,
  Globe2,
  GraduationCap,
  Brain,
  Trophy,
  Bell,
  CalendarDays,
  Clock3,
  ArrowRight,
} from "lucide-react";

import "./Blog.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const CATEGORY_TABS = [
  {
    label: "All Articles",
    value: "All",
    icon: FileText,
  },
  {
    label: "Current Affairs",
    value: "Current Affairs",
    icon: Globe2,
  },
  {
    label: "Exam Tips",
    value: "Exam Tips",
    icon: GraduationCap,
  },
  {
    label: "General Knowledge",
    value: "General Knowledge",
    icon: Brain,
  },
  {
    label: "Study Strategy",
    value: "Study Strategy",
    icon: BarChart3,
  },
  {
    label: "Success Stories",
    value: "Success Stories",
    icon: Trophy,
  },
  {
    label: "Notifications",
    value: "Notifications",
    icon: Bell,
  },
];

const HERO_FEATURES = [
  {
    icon: Lightbulb,
    text: "Exam Tips & Strategies",
  },
  {
    icon: BookOpen,
    text: "Subject-wise Guides",
  },
  {
    icon: BarChart3,
    text: "Current Affairs Analysis",
  },
  {
    icon: FileText,
    text: "Study Resources & More",
  },
];

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function readingTime(content = "") {
  const words = String(content)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(
    1,
    Math.ceil(words / 200)
  );
}

function normalize(value = "") {
  return String(value)
    .trim()
    .toLowerCase();
}

function matchesSelectedCategory(
  blogCategory,
  selected
) {
  if (selected === "All") {
    return true;
  }

  const category =
    normalize(blogCategory);

  const active =
    normalize(selected);

  if (
    active ===
    "current affairs"
  ) {
    return (
      category.includes("current") ||
      category.includes("national") ||
      category.includes("international")
    );
  }

  if (active === "exam tips") {
    return (
      category.includes("exam") ||
      category.includes("tip")
    );
  }

  if (
    active ===
    "general knowledge"
  ) {
    return (
      category.includes("general") ||
      category.includes("gk")
    );
  }

  if (
    active ===
    "study strategy"
  ) {
    return (
      category.includes("study") ||
      category.includes("strategy")
    );
  }

  if (
    active ===
    "success stories"
  ) {
    return category.includes(
      "success"
    );
  }

  if (
    active ===
    "notifications"
  ) {
    return (
      category.includes(
        "notification"
      ) ||
      category.includes("notice")
    );
  }

  return category === active;
}

function getCategoryTheme(
  category = ""
) {
  const value =
    normalize(category);

  if (
    value.includes(
      "international"
    )
  ) {
    return "purple";
  }

  if (
    value.includes("exam") ||
    value.includes("study")
  ) {
    return "green";
  }

  if (
    value.includes("national")
  ) {
    return "gold";
  }

  return "blue";
}

/* ======================================================
   HERO SVG
====================================================== */

function BlogHeroIllustration() {
  return (
    <svg
      className="blog-v2-hero-art"
      viewBox="0 0 650 340"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="blogCap"
          x1="0"
          x2="1"
        >
          <stop
            offset="0%"
            stopColor="#061b43"
          />

          <stop
            offset="100%"
            stopColor="#15477f"
          />
        </linearGradient>

        <linearGradient
          id="blogBook"
          x1="0"
          x2="1"
        >
          <stop
            offset="0%"
            stopColor="#0a2b5d"
          />

          <stop
            offset="100%"
            stopColor="#1760a4"
          />
        </linearGradient>

        <linearGradient
          id="blogGold"
          x1="0"
          x2="1"
        >
          <stop
            offset="0%"
            stopColor="#ef9400"
          />

          <stop
            offset="100%"
            stopColor="#ffc64c"
          />
        </linearGradient>

        <radialGradient id="bulbGlow">
          <stop
            offset="0%"
            stopColor="#fffbe8"
          />

          <stop
            offset="50%"
            stopColor="#ffd45f"
          />

          <stop
            offset="100%"
            stopColor="#f5a400"
          />
        </radialGradient>

        <filter
          id="blogShadow"
          x="-20%"
          y="-20%"
          width="150%"
          height="150%"
        >
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="8"
            floodColor="#03183a"
            floodOpacity=".2"
          />
        </filter>
      </defs>

      {/* Leaves */}

      <g opacity=".85">
        <path
          d="M458 219c-8-69 17-113 64-139 13 55-5 101-64 139Z"
          fill="#4171a7"
        />

        <path
          d="M489 234c26-68 63-96 111-92-8 57-43 88-111 92Z"
          fill="#6c8fba"
        />

        <path
          d="M425 235c-49-48-55-95-30-139 42 35 52 81 30 139Z"
          fill="#264d81"
        />

        <path
          d="M166 224c-34-49-36-91-13-126 35 39 40 80 13 126Z"
          fill="#183d73"
        />

        <path
          d="M147 229c-52-25-73-61-63-100 45 19 69 54 63 100Z"
          fill="#305f96"
        />
      </g>

      {/* Light bulb */}

      <g filter="url(#blogShadow)">
        <circle
          cx="242"
          cy="112"
          r="40"
          fill="url(#bulbGlow)"
        />

        <path
          d="M224 110c13 7 18 19 18 35M260 110c-13 7-18 19-18 35"
          fill="none"
          stroke="#db7c00"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M227 146h30v12h-30Z"
          fill="#17355e"
        />

        <rect
          x="231"
          y="158"
          width="22"
          height="12"
          rx="5"
          fill="#0a214a"
        />

        <g
          stroke="#ffc346"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M242 50V31" />
          <path d="m205 62-12-14" />
          <path d="m278 62 13-14" />
          <path d="M191 100h-18" />
          <path d="M292 100h18" />
        </g>
      </g>

      {/* Books */}

      <g filter="url(#blogShadow)">
        <rect
          x="245"
          y="143"
          width="270"
          height="37"
          rx="12"
          fill="url(#blogGold)"
        />

        <rect
          x="270"
          y="181"
          width="278"
          height="39"
          rx="12"
          fill="url(#blogBook)"
        />

        <rect
          x="257"
          y="219"
          width="286"
          height="40"
          rx="12"
          fill="#f8fbff"
        />

        <rect
          x="277"
          y="258"
          width="290"
          height="42"
          rx="13"
          fill="url(#blogBook)"
        />

        <path
          d="M284 228h233c10 0 17 6 17 11s-7 11-17 11H284Z"
          fill="#dde8f5"
        />
      </g>

      {/* Cap */}

      <g filter="url(#blogShadow)">
        <polygon
          points="280,77 390,39 510,75 394,113"
          fill="url(#blogCap)"
        />

        <path
          d="M326 95v51c40 19 91 19 134 0V95"
          fill="#09285a"
        />

        <path
          d="M510 76v65"
          stroke="#ffb21b"
          strokeWidth="5"
        />

        <circle
          cx="510"
          cy="143"
          r="6"
          fill="#ffb21b"
        />

        <path
          d="m510 148-8 27h16Z"
          fill="#ffb21b"
        />
      </g>

      {/* Pencil cup */}

      <g filter="url(#blogShadow)">
        <path
          d="M158 188h56l-6 94h-44Z"
          fill="#f7fbff"
        />

        <path
          d="m173 192-13-82 8-2 15 83Z"
          fill="#ffb332"
        />

        <path
          d="m190 190 2-86h8l-1 87Z"
          fill="#f09b00"
        />

        <path
          d="m203 194 25-74 8 3-24 73Z"
          fill="#e87820"
        />
      </g>

      {/* Handwritten statement */}

      <g transform="translate(526 58) rotate(-6)">
        <text
          x="0"
          y="0"
          fill="#082451"
          fontSize="23"
          fontFamily="cursive"
          fontStyle="italic"
        >
          Knowledge
        </text>

        <text
          x="15"
          y="35"
          fill="#082451"
          fontSize="23"
          fontFamily="cursive"
          fontStyle="italic"
        >
          Today
        </text>

        <text
          x="5"
          y="72"
          fill="#082451"
          fontSize="23"
          fontFamily="cursive"
          fontStyle="italic"
        >
          Success
        </text>

        <text
          x="24"
          y="108"
          fill="#082451"
          fontSize="23"
          fontFamily="cursive"
          fontStyle="italic"
        >
          Tomorrow
        </text>

        <path
          d="M28 122 116 103"
          stroke="#f1a000"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Plane */}

      <g transform="translate(95 30)">
        <path
          d="M0 0 72 22 30 38Z"
          fill="#71a6f3"
        />

        <path
          d="M30 38 72 22 40 61Z"
          fill="#3979d5"
        />

        <path
          d="M72 22c35 61 73 27 105 31 35 4 44 33 54 57"
          fill="none"
          stroke="#6d9feb"
          strokeWidth="2"
          strokeDasharray="9 8"
        />
      </g>
    </svg>
  );
}

function Blog() {
  const [blogs, setBlogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    activeCategory,
    setActiveCategory,
  ] = useState("All");

  useEffect(() => {
    async function loadBlogs() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/api/blog`
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load blogs"
          );
        }

        const data =
          await response.json();

        setBlogs(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load articles right now."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBlogs();
  }, []);

  const filteredBlogs =
    useMemo(() => {
      const query =
        normalize(search);

      return blogs.filter(
        (blog) => {
          const matchesCategory =
            matchesSelectedCategory(
              blog.category,
              activeCategory
            );

          const matchesSearch =
            !query ||
            normalize(
              blog.title
            ).includes(query) ||
            normalize(
              blog.summary
            ).includes(query) ||
            normalize(
              blog.category
            ).includes(query) ||
            normalize(
              blog.author
            ).includes(query);

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      blogs,
      search,
      activeCategory,
    ]);

  function handleSearch(event) {
    event.preventDefault();

    setSearch(
      searchInput.trim()
    );
  }

  function viewAllArticles() {
    setActiveCategory("All");
    setSearch("");
    setSearchInput("");
  }

  return (
    <main className="blog-v2-page">

      {/* ==============================================
          HERO
      ============================================== */}

      <section className="blog-v2-hero">

        <div className="blog-v2-hero-copy">

          <span className="blog-v2-eyebrow">
            DISHA LEARNING JOURNAL
          </span>

          <h1>
            Learn Better.
            <br />

            Prepare Smarter.
            <br />

            <span>
              Achieve More.
            </span>
          </h1>

          <p>
            Exam tips, subject-wise strategies,
            current affairs analysis and useful
            resources to help you in your
            preparation journey.
          </p>

          <form
            className="blog-v2-search"
            onSubmit={handleSearch}
          >
            <Search size={21} />

            <input
              type="text"
              value={searchInput}
              placeholder="Search articles..."
              onChange={(event) => {
                const value =
                  event.target.value;

                setSearchInput(value);

                if (!value.trim()) {
                  setSearch("");
                }
              }}
            />

            <button type="submit">
              Search
            </button>
          </form>

        </div>

        <div className="blog-v2-visual">
          <BlogHeroIllustration />
        </div>

        <div className="blog-v2-feature-strip">

          {HERO_FEATURES.map(
            (feature) => {
              const Icon =
                feature.icon;

              return (
                <div
                  className="blog-v2-feature"
                  key={feature.text}
                >
                  <div className="blog-v2-feature-icon">
                    <Icon />
                  </div>

                  <span>
                    {feature.text}
                  </span>
                </div>
              );
            }
          )}

        </div>

      </section>

      {/* ==============================================
          CATEGORY NAV
      ============================================== */}

      <section className="blog-v2-categories">

        {CATEGORY_TABS.map(
          (category) => {
            const Icon =
              category.icon;

            const active =
              activeCategory ===
              category.value;

            return (
              <button
                type="button"
                key={category.value}
                className={
                  active
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveCategory(
                    category.value
                  )
                }
              >
                <Icon />

                <span>
                  {category.label}
                </span>
              </button>
            );
          }
        )}

      </section>

      {/* ==============================================
          CONTENT
      ============================================== */}

      <section className="blog-v2-content">

        <div className="blog-v2-section-head">

          <div>
            <span className="blog-v2-title-line" />

            <h2>
              Latest Articles
            </h2>
          </div>

          <button
            type="button"
            onClick={viewAllArticles}
          >
            View All Articles

            <ArrowRight size={20} />
          </button>

        </div>

        {loading && (
          <div className="blog-v2-state">
            <div className="blog-v2-loader" />

            <h3>
              Loading articles...
            </h3>
          </div>
        )}

        {!loading && error && (
          <div className="blog-v2-state">
            <h3>
              Something went wrong
            </h3>

            <p>{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredBlogs.length ===
            0 && (
            <div className="blog-v2-state">
              <h3>
                No articles found
              </h3>

              <p>
                Try another search or
                category.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredBlogs.length >
            0 && (
            <div className="blog-v2-grid">

              {filteredBlogs.map(
                (blog) => {
                  const id =
                    blog.id ??
                    blog.Id;

                  const date =
                    blog.date ||
                    blog.createdAt;

                  return (
                    <article
                      className="blog-v2-card"
                      key={id}
                    >

                      <div className="blog-v2-card-image">

                        {blog.imageUrl ? (
                          <img
                            src={
                              blog.imageUrl
                            }
                            alt={
                              blog.title
                            }
                          />
                        ) : (
                          <div className="blog-v2-placeholder">
                            <BookOpen />

                            <span>
                              Disha The
                              Academy
                            </span>
                          </div>
                        )}

                        <span
                          className={`blog-v2-card-category ${getCategoryTheme(
                            blog.category
                          )}`}
                        >
                          {blog.category ||
                            "Education"}
                        </span>

                      </div>

                      <div className="blog-v2-card-body">

                        <h3>
                          {blog.title}
                        </h3>

                        <p>
                          {blog.summary}
                        </p>

                        <div className="blog-v2-card-footer">

                          <div className="blog-v2-card-meta">

                            <span>
                              <CalendarDays />

                              {formatDate(
                                date
                              )}
                            </span>

                            <span>
                              <Clock3 />

                              {readingTime(
                                blog.content
                              )}{" "}
                              min read
                            </span>

                          </div>

                          <Link
                            to={`/blog/${id}`}
                          >
                            Read More

                            <ArrowRight />
                          </Link>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </section>

    </main>
  );
}

export default Blog;