import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  ChevronDown,
  FileText,
  LayoutGrid,
  Mountain,
  Search,
  ShieldCheck,
  Star,
  Target,
  Users,
} from "lucide-react";

import {
  NOTE_CATEGORIES,
} from "../data/notesContent";

import "./NotesPage.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

// =====================================================
// SMALL DRAWING HELPERS (hero + card artwork)
// =====================================================

function Spark({ x, y, s = 1 }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-9 L2.5-2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5-2.5Z"
      fill="#f7c948"
    />
  );
}

function Tree({ x, y, s = 1, fill }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-46 L11-26 L5-26 L15-8 L6-8 L18 12 L-18 12 L-6-8 L-15-8 L-5-26 L-11-26Z"
      fill={fill}
    />
  );
}

function HeroArt() {
  return (
    <svg
      className="sn-hero-art"
      viewBox="0 0 620 300"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
    >
      {/* mountains */}
      <path
        d="M0 300V175l60-55 45 35 70-85 55 60 60-45 70 70 55-40 65 55 65-60 75 55V300Z"
        fill="rgba(130,170,240,.30)"
      />
      <path
        d="M180 300 L260 190 L300 225 L370 130 L440 235 L500 190 L620 260 V300Z"
        fill="rgba(70,110,200,.50)"
      />

      {/* trees */}
      <Tree x={330} y={284} s={1.3} fill="rgba(15,45,115,.75)" />
      <Tree x={362} y={286} s={1} fill="rgba(15,45,115,.75)" />
      <Tree x={394} y={282} s={1.5} fill="rgba(15,45,115,.8)" />
      <Tree x={556} y={286} s={1.2} fill="rgba(15,45,115,.8)" />
      <Tree x={590} y={282} s={1.5} fill="rgba(15,45,115,.85)" />
      <Tree x={612} y={288} s={1.1} fill="rgba(15,45,115,.85)" />

      {/* faded open book + bulb sketches */}
      <g
        stroke="rgba(255,255,255,.4)"
        strokeWidth="1.6"
        fill="none"
        transform="rotate(-10 320 90)"
      >
        <path d="M270 70 L318 78 L318 122 L270 114Z" />
        <path d="M318 78 L366 70 L366 114 L318 122Z" />
      </g>
      <g stroke="rgba(255,255,255,.35)" strokeWidth="1.6" fill="none">
        <circle cx="250" cy="158" r="16" />
        <path d="M244 176h12M246 182h8" />
      </g>

      {/* paper plane */}
      <path
        d="M300 112 C330 60 390 80 440 52"
        stroke="rgba(255,255,255,.55)"
        strokeWidth="1.6"
        strokeDasharray="4 6"
        fill="none"
      />
      <path d="M440 48 L512 22 L470 62 L462 46Z" fill="#f7d774" />
      <path d="M462 46 L512 22 L470 62Z" fill="#e0a92a" opacity=".85" />

      {/* sparkles */}
      <Spark x={560} y={60} s={1.1} />
      <Spark x={330} y={30} s={0.8} />
      <Spark x={606} y={206} s={0.9} />

      {/* pencil cup */}
      <rect x="357" y="150" width="6" height="52" rx="2" fill="#2f6bff" transform="rotate(-8 360 200)" />
      <rect x="368" y="146" width="6" height="56" rx="2" fill="#f2b52e" transform="rotate(6 371 200)" />
      <rect x="350" y="196" width="34" height="46" rx="6" fill="#eef2fb" />

      {/* books */}
      <rect x="392" y="232" width="190" height="30" rx="5" fill="#173f94" />
      <rect x="402" y="240" width="172" height="8" rx="2" fill="#f4e7c3" />
      <rect x="404" y="204" width="172" height="30" rx="5" fill="#f2b52e" />
      <rect x="414" y="212" width="152" height="8" rx="2" fill="#fbf1d0" />
      <rect x="416" y="180" width="152" height="26" rx="5" fill="#0f2c6e" />
      <rect x="426" y="187" width="134" height="7" rx="2" fill="#e9eefb" />

      {/* graduation cap */}
      <path d="M448 140v26c0 12 22 20 52 20s52-8 52-20v-26z" fill="#0c2560" />
      <polygon points="500,92 596,122 500,152 404,122" fill="#123274" />
      <polygon
        points="500,92 596,122 500,152 404,122"
        fill="none"
        stroke="rgba(255,255,255,.25)"
        strokeWidth="1.5"
      />
      <circle cx="500" cy="122" r="5" fill="#f2b52e" />
      <path d="M500 122L588 128V170" stroke="#f2b52e" strokeWidth="3" fill="none" />
      <rect x="583" y="168" width="10" height="26" rx="4" fill="#f2b52e" />
    </svg>
  );
}

function CardDecor({ type }) {
  const blueTree = "rgba(90,140,220,.55)";
  const goldTree = "rgba(225,170,50,.45)";

  return (
    <svg
      className="sn-card-decor"
      viewBox="0 0 300 200"
      preserveAspectRatio="xMaxYMin slice"
      aria-hidden="true"
    >
      {type === "mountain" && (
        <>
          <path d="M40 200 L120 95 L155 135 L205 60 L300 170 V200Z" fill="rgba(120,165,240,.35)" />
          <path d="M120 200 L190 120 L230 160 L275 105 L300 130 V200Z" fill="rgba(90,140,225,.35)" />
          <Tree x={205} y={190} s={1.1} fill={blueTree} />
          <Tree x={232} y={196} s={0.9} fill={blueTree} />
          <Tree x={262} y={188} s={1.2} fill={blueTree} />
          <Tree x={288} y={196} s={0.9} fill={blueTree} />
        </>
      )}

      {type === "shield" && (
        <>
          <path
            d="M215 30 L268 50 V105 C268 140 244 160 215 172 C186 160 162 140 162 105 V50Z"
            fill="rgba(245,195,80,.25)"
            stroke="rgba(230,170,50,.45)"
            strokeWidth="2"
          />
          <Tree x={268} y={186} s={1.1} fill={goldTree} />
          <Tree x={292} y={192} s={0.9} fill={goldTree} />
        </>
      )}

      {type === "math" && (
        <g
          fill="rgba(70,120,220,.45)"
          fontFamily="Georgia, serif"
          fontWeight="700"
        >
          <text x="170" y="80" fontSize="44">+</text>
          <text x="238" y="60" fontSize="46">π</text>
          <text x="120" y="130" fontSize="36">÷</text>
          <text x="196" y="150" fontSize="40">×</text>
        </g>
      )}

      {type === "bulb" && (
        <g>
          <circle cx="225" cy="85" r="34" fill="rgba(250,205,90,.28)" stroke="rgba(240,180,50,.55)" strokeWidth="2" />
          <path d="M213 122h24M216 130h18" stroke="rgba(240,180,50,.55)" strokeWidth="3" strokeLinecap="round" />
          <g stroke="rgba(240,180,50,.6)" strokeWidth="3" strokeLinecap="round">
            <path d="M225 28v-14" />
            <path d="M270 42l10-10" />
            <path d="M180 42l-10-10" />
            <path d="M285 88h14" />
            <path d="M165 88h-14" />
          </g>
        </g>
      )}
    </svg>
  );
}

// =====================================================
// CATEGORY -> ICON / ARTWORK
// =====================================================

function pickIcon(category) {
  const text = `${category.slug} ${category.title}`.toLowerCase();

  if (text.includes("police")) return ShieldCheck;
  if (text.includes("math") || text.includes("quant")) return Calculator;
  if (text.includes("reason")) return Brain;
  if (
    text.includes("hp") ||
    text.includes("general") ||
    text.includes("gk") ||
    text.includes("himachal")
  ) {
    return Mountain;
  }

  return BookOpen;
}

function pickDecor(category, index) {
  const text = `${category.slug} ${category.title}`.toLowerCase();

  if (text.includes("police")) return "shield";
  if (text.includes("math") || text.includes("quant")) return "math";
  if (text.includes("reason")) return "bulb";
  if (
    text.includes("hp") ||
    text.includes("general") ||
    text.includes("gk") ||
    text.includes("himachal")
  ) {
    return "mountain";
  }

  return ["mountain", "shield", "math", "bulb"][index % 4];
}

const FEATURES = [
  {
    icon: BookOpen,
    tone: "blue",
    title: "Well Structured Notes",
    text: "Exam focused content",
  },
  {
    icon: Target,
    tone: "gold",
    title: "Updated Material",
    text: "Based on latest pattern",
  },
  {
    icon: Users,
    tone: "blue",
    title: "Multiple Subjects",
    text: "All in one place",
  },
  {
    icon: Star,
    tone: "gold",
    title: "Trusted by Aspirants",
    text: "Quality content",
  },
];

// =====================================================
// PAGE
// =====================================================

function Notes() {
  const [notes, setNotes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

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

  // =====================================================
  // SEARCH + CATEGORY FILTER
  // =====================================================

  const visibleCategories =
    useMemo(() => {
      const q = query
        .trim()
        .toLowerCase();

      return categories.filter(
        (category) => {
          if (
            selectedCategory !==
              "all" &&
            category.slug !==
              selectedCategory
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          const categoryText = [
            category.title,
            category.subject,
            category.description,
          ]
            .join(" ")
            .toLowerCase();

          if (
            categoryText.includes(q)
          ) {
            return true;
          }

          // Also match topic names inside this category.
          return notes.some(
            (note) =>
              note.categorySlug ===
                category.slug &&
              [
                note.title,
                note.subcategoryTitle,
              ]
                .join(" ")
                .toLowerCase()
                .includes(q)
          );
        }
      );
    }, [
      categories,
      notes,
      query,
      selectedCategory,
    ]);

  function handleSearch(event) {
    event.preventDefault();

    document
      .getElementById("sn-browse")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function resetFilters() {
    setQuery("");
    setSelectedCategory("all");
  }

  return (
    <main className="sn-page">
      {/* ================= HERO ================= */}

      <section className="sn-hero">
        <HeroArt />

        <div className="sn-hero-text">
          <span className="sn-badge">
            <BookOpen size={15} />
            EXPLORE · LEARN · SUCCEED
          </span>

          <h1 className="sn-title">
            Study{" "}
            <span className="sn-title-gold">
              Notes
              <svg
                className="sn-swoosh"
                viewBox="0 0 200 12"
                aria-hidden="true"
              >
                <path
                  d="M2 9 Q100 -2 198 6"
                  stroke="#f2b52e"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="sn-subtitle">
            Quality study material for
            competitive exam preparation
          </p>
        </div>

        <svg
          className="sn-wave"
          viewBox="0 0 1200 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 80V38C90 12 170 8 250 24c-70-6-160 10-250 42Z"
            fill="#f6c454"
          />
          <path
            d="M0 80V52C160 20 330 40 520 58c190 18 380 6 680-40V80Z"
            fill="#f8faff"
          />
        </svg>
      </section>

      {/* ================= SEARCH ================= */}

      <form
        className="sn-search"
        onSubmit={handleSearch}
      >
        <label className="sn-search-field">
          <Search size={20} />

          <input
            type="text"
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Search notes by subject, exam or topic..."
            aria-label="Search notes"
          />
        </label>

        <label className="sn-search-select">
          <LayoutGrid size={18} />

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(
                event.target.value
              )
            }
            aria-label="Filter by category"
          >
            <option value="all">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.slug}
                  value={category.slug}
                >
                  {category.title}
                </option>
              )
            )}
          </select>

          <ChevronDown size={18} />
        </label>

        <button
          type="submit"
          className="sn-search-btn"
        >
          Search Notes
          <ArrowRight size={18} />
        </button>
      </form>

      {/* ================= FEATURES ================= */}

      <section className="sn-features">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              className="sn-feature"
              key={feature.title}
            >
              <span
                className={`sn-feature-icon ${feature.tone}`}
              >
                <Icon size={22} />
              </span>

              <div>
                <strong>
                  {feature.title}
                </strong>

                <span>
                  {feature.text}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ================= BROWSE ================= */}

      <section
        className="sn-browse"
        id="sn-browse"
      >
        <div className="sn-browse-head">
          <div className="sn-browse-title">
            <span className="sn-bar" />

            <div>
              <span className="sn-eyebrow">
                POPULAR NOTES
              </span>

              <h2>
                Browse Study Notes
              </h2>

              <p>
                Choose a subject to
                access high-quality
                notes, important topics
                and practice material.
              </p>
            </div>
          </div>

          <div className="sn-quote">
            <svg
              viewBox="0 0 60 40"
              aria-hidden="true"
            >
              <path
                d="M52 6 C30 4 12 14 8 32"
                stroke="#7d8db0"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M4 24 L8 34 L18 28"
                stroke="#7d8db0"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span>
              Your success begins with
              the right notes
            </span>
          </div>
        </div>

        {loading && (
          <div className="sn-status">
            <h3>
              Loading Study Notes...
            </h3>

            <p>
              Please wait a moment.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="sn-status error">
            <h3>
              Unable to load notes
            </h3>

            <p>{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          categories.length === 0 && (
            <div className="sn-status">
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
          categories.length > 0 &&
          visibleCategories.length ===
            0 && (
            <div className="sn-status">
              <h3>
                No matching notes found
              </h3>

              <p>
                Try a different word or
                choose another category.
              </p>

              <button
                type="button"
                className="sn-reset-btn"
                onClick={resetFilters}
              >
                Clear search
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          visibleCategories.length >
            0 && (
            <div className="sn-grid">
              {visibleCategories.map(
                (category, index) => {
                  const Icon =
                    pickIcon(
                      category
                    );

                  const tone =
                    index % 2 === 0
                      ? "blue"
                      : "gold";

                  return (
                    <article
                      className={`sn-card ${tone}`}
                      key={
                        category.slug
                      }
                    >
                      <CardDecor
                        type={pickDecor(
                          category,
                          index
                        )}
                      />

                      <span
                        className={`sn-card-icon ${tone}`}
                      >
                        <Icon size={38} />
                      </span>

                      <div className="sn-card-body">
                        <h3>
                          <Link
                            to={`/notes/${category.slug}`}
                          >
                            {
                              category.title
                            }
                          </Link>
                        </h3>

                        <span className="sn-card-subject">
                          {
                            category.subject
                          }
                        </span>

                        <p className="sn-card-desc">
                          {
                            category.description
                          }
                        </p>

                        <div className="sn-card-foot">
                          <span className="sn-card-count">
                            <FileText
                              size={16}
                            />

                            {
                              category.count
                            }{" "}
                            {category.count ===
                            1
                              ? "note"
                              : "notes"}
                          </span>

                          <Link
                            to={`/notes/${category.slug}`}
                            className="sn-card-btn"
                          >
                            View Notes
                            <ArrowRight
                              size={16}
                            />
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

export default Notes;