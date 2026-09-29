import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  BarChart3,
  Bookmark,
  CalendarDays,
  ChevronRight,
  Clock3,
  FlaskConical,
  Globe2,
  Grid2X2,
  Landmark,
  Newspaper,
  Search,
  Share2,
  Trophy,
  Zap,
} from "lucide-react";

import "./CurrentAffairs.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80";

const CATEGORY_TABS = [
  {
    label: "All",
    value: "All",
    icon: Grid2X2,
  },
  {
    label: "National",
    value: "National",
    icon: Landmark,
  },
  {
    label: "International",
    value: "International",
    icon: Globe2,
  },
  {
    label: "Economy",
    value: "Economy",
    icon: BarChart3,
  },
  {
    label: "Science & Tech",
    value: "Science & Tech",
    icon: FlaskConical,
  },
  {
    label: "Sports",
    value: "Sports",
    icon: Trophy,
  },
  {
    label: "Important Days",
    value: "Important Days",
    icon: CalendarDays,
  },
];

const CATEGORY_ALIASES = {
  National: [
    "national",
    "india",
    "polity",
    "government",
    "domestic",
  ],

  International: [
    "international",
    "world",
    "global",
    "foreign",
  ],

  Economy: [
    "economy",
    "economic",
    "finance",
    "banking",
    "business",
    "rbi",
    "gst",
  ],

  "Science & Tech": [
    "science",
    "technology",
    "tech",
    "space",
    "isro",
    "ai",
  ],

  Sports: [
    "sports",
    "sport",
    "games",
    "cricket",
    "football",
  ],

  "Important Days": [
    "important day",
    "important days",
    "observance",
    "anniversary",
  ],
};

function normalize(value = "") {
  return String(value)
    .trim()
    .toLowerCase();
}

function getItemId(item) {
  return item?.id ?? item?.Id;
}

function getImage(item) {
  return (
    item?.imageUrl ||
    item?.image ||
    item?.thumbnail ||
    FALLBACK_IMAGE
  );
}

function getSummary(item) {
  return (
    item?.summary ||
    item?.description ||
    item?.excerpt ||
    ""
  );
}

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getReadingTime(item) {
  const content =
    `${getSummary(item)} ${item?.content || ""}`.trim();

  if (!content) {
    return "1 min read";
  }

  const words = content
    .split(/\s+/)
    .filter(Boolean)
    .length;

  return `${Math.max(
    1,
    Math.ceil(words / 200)
  )} min read`;
}

function getCategoryKey(item) {
  const raw = normalize(
    item?.category ||
    item?.type ||
    ""
  );

  for (const [
    category,
    aliases,
  ] of Object.entries(
    CATEGORY_ALIASES
  )) {
    if (
      aliases.some((alias) =>
        raw.includes(alias)
      )
    ) {
      return category;
    }
  }

  return (
    item?.category?.trim() ||
    "Current Affairs"
  );
}

function CurrentAffairs() {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    activeCategory,
    setActiveCategory,
  ] = useState("All");

  useEffect(() => {
    let ignore = false;

    async function loadCurrentAffairs() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/current-affairs`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load current affairs."
          );
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.items
              )
            ? data.items
            : Array.isArray(
                data?.currentAffairs
              )
            ? data.currentAffairs
            : Array.isArray(
                data?.data
              )
            ? data.data
            : [];

        if (!ignore) {
          setItems(list);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError(
            err?.message ||
            "Unable to load current affairs."
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

  const filteredItems =
    useMemo(() => {
      const query =
        normalize(search);

      return items.filter(
        (item) => {
          const category =
            getCategoryKey(item);

          const matchesCategory =
            activeCategory ===
              "All" ||
            category ===
              activeCategory;

          const searchableText =
            normalize(
              [
                item?.title,
                getSummary(item),
                item?.content,
                item?.category,
              ].join(" ")
            );

          const matchesSearch =
            !query ||
            searchableText.includes(
              query
            );

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      items,
      search,
      activeCategory,
    ]);

  const featuredArticle =
    filteredItems[0];

  const sideArticles =
    filteredItems.slice(1, 3);

  const trendingTopics =
    useMemo(() => {
      return items
        .slice(0, 6)
        .map((item) => {
          const text =
            item?.topic ||
            item?.shortTitle ||
            item?.title ||
            "";

          return text.length > 23
            ? `${text.slice(
                0,
                23
              )}...`
            : text;
        })
        .filter(Boolean);
    }, [items]);

  const categoryGroups =
    useMemo(() => {
      const source =
        activeCategory === "All"
          ? filteredItems
          : filteredItems;

      return CATEGORY_TABS
        .filter(
          (category) =>
            category.value !==
            "All"
        )
        .filter(
          (category) =>
            activeCategory ===
              "All" ||
            activeCategory ===
              category.value
        )
        .map((category) => ({
          ...category,

          articles:
            source
              .filter(
                (item) =>
                  getCategoryKey(
                    item
                  ) ===
                  category.value
              )
              .slice(0, 2),
        }))
        .filter(
          (category) =>
            category.articles
              .length > 0
        );
    }, [
      filteredItems,
      activeCategory,
    ]);

  function handleSearch(event) {
    event.preventDefault();

    setSearch(
      searchInput.trim()
    );
  }

  function selectCategory(
    category
  ) {
    setActiveCategory(
      category
    );

    setSearch("");
    setSearchInput("");
  }

  function openArticle(item) {
    const id =
      getItemId(item);

    if (!id) {
      return;
    }

    window.location.href =
      `/current-affairs/${id}`;
  }

  async function shareArticle(
    item
  ) {
    const id =
      getItemId(item);

    const url =
      `${window.location.origin}/current-affairs/${id}`;

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title: item?.title,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(
        url
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className="ca3-page">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="ca3-hero">

        <div className="ca3-hero-left">

          <div className="ca3-eyebrow">
            <Zap size={14} />

            EXAM FOCUSED DAILY
            UPDATES
          </div>

          <h1>
            Daily{" "}

            <span>
              Current Affairs
            </span>
          </h1>

          <p>
            Stay informed with the
            most important national,
            international, economy,
            science, sports and
            exam-relevant updates —
            curated for competitive
            exams.
          </p>

          <form
            className="ca3-search"
            onSubmit={handleSearch}
          >

            <Search size={19} />

            <input
              type="text"
              value={searchInput}
              placeholder="Search for topics, keywords, or current affairs..."
              onChange={(event) => {
                const value =
                  event.target.value;

                setSearchInput(
                  value
                );

                if (
                  !value.trim()
                ) {
                  setSearch("");
                }
              }}
            />

            <button type="submit">
              Search
            </button>

          </form>

          {trendingTopics.length >
            0 && (
            <div className="ca3-trending">

              <strong>
                Trending:
              </strong>

              <div>
                {trendingTopics.map(
                  (
                    topic,
                    index
                  ) => (
                    <button
                      type="button"
                      key={`${topic}-${index}`}
                      onClick={() => {
                        setSearchInput(
                          topic.replace(
                            "...",
                            ""
                          )
                        );

                        setSearch(
                          topic.replace(
                            "...",
                            ""
                          )
                        );
                      }}
                    >
                      {topic}
                    </button>
                  )
                )}
              </div>

            </div>
          )}

        </div>

       <div className="ca3-hero-art">

  <div className="ca3-world-glow" />
  <div className="ca3-world-ring ca3-world-ring-one" />
  <div className="ca3-world-ring ca3-world-ring-two" />

  <svg
    className="ca3-world-map-svg"
    viewBox="0 0 760 380"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        id="ca3GlobeFill"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop
          offset="0%"
          stopColor="#79d2ff"
        />
        <stop
          offset="45%"
          stopColor="#0f7bc0"
        />
        <stop
          offset="100%"
          stopColor="#063f7a"
        />
      </linearGradient>

      <linearGradient
        id="ca3LandFill"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop
          offset="0%"
          stopColor="#dff8ff"
        />
        <stop
          offset="100%"
          stopColor="#9de2ff"
        />
      </linearGradient>

      <filter
        id="ca3WorldShadow"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
      >
        <feDropShadow
          dx="0"
          dy="12"
          stdDeviation="10"
          floodColor="#021731"
          floodOpacity=".28"
        />
      </filter>
    </defs>

    <g filter="url(#ca3WorldShadow)">
      <circle
        cx="390"
        cy="190"
        r="150"
        fill="url(#ca3GlobeFill)"
        stroke="rgba(235,248,255,.65)"
        strokeWidth="5"
      />

      {/* longitude/latitude lines */}
      <ellipse
        cx="390"
        cy="190"
        rx="120"
        ry="150"
        fill="none"
        stroke="rgba(255,255,255,.16)"
        strokeWidth="2"
      />
      <ellipse
        cx="390"
        cy="190"
        rx="82"
        ry="150"
        fill="none"
        stroke="rgba(255,255,255,.14)"
        strokeWidth="2"
      />
      <ellipse
        cx="390"
        cy="190"
        rx="42"
        ry="150"
        fill="none"
        stroke="rgba(255,255,255,.12)"
        strokeWidth="2"
      />

      <ellipse
        cx="390"
        cy="190"
        rx="150"
        ry="118"
        fill="none"
        stroke="rgba(255,255,255,.16)"
        strokeWidth="2"
      />
      <ellipse
        cx="390"
        cy="190"
        rx="150"
        ry="78"
        fill="none"
        stroke="rgba(255,255,255,.14)"
        strokeWidth="2"
      />
      <ellipse
        cx="390"
        cy="190"
        rx="150"
        ry="38"
        fill="none"
        stroke="rgba(255,255,255,.12)"
        strokeWidth="2"
      />

      {/* North America */}
      <path
        d="M252 126
           c-22 6-39 18-54 38
           c-13 18-17 34-12 48
           c5 14 20 18 39 14
           c6 11 17 18 31 20
           c14 2 27-3 35-14
           c9-11 10-25 4-38
           c8-3 16-10 19-20
           c5-15-2-33-18-42
           c-14-8-28-10-44-6z"
        fill="url(#ca3LandFill)"
        opacity=".98"
      />

      {/* Greenland */}
      <path
        d="M320 88
           c11-6 24-7 33-2
           c8 5 10 14 5 23
           c-5 10-17 15-29 12
           c-11-3-17-13-13-22
           c1-4 3-7 4-11z"
        fill="url(#ca3LandFill)"
        opacity=".95"
      />

      {/* South America */}
      <path
        d="M319 225
           c-10 7-17 17-19 30
           c-2 13 2 24 10 33
           c7 8 11 19 10 31
           c-1 9 4 17 11 20
           c8 3 17-2 21-11
           c4-9 5-20 2-30
           c-4-12-8-23-5-35
           c4-16-3-30-18-38
           c-3-2-8-2-12 0z"
        fill="url(#ca3LandFill)"
        opacity=".98"
      />

      {/* Europe */}
      <path
        d="M414 118
           c18-11 42-12 58-3
           c13 7 18 18 13 29
           c-4 11-16 17-31 17
           c-8 0-16-2-24-5
           c-8 6-18 7-27 3
           c-9-4-14-12-12-20
           c2-9 10-16 23-21z"
        fill="url(#ca3LandFill)"
        opacity=".98"
      />

      {/* Africa */}
      <path
        d="M454 162
           c17 4 30 14 36 30
           c7 17 4 35-7 52
           c-10 15-13 28-9 41
           c3 10-2 20-12 24
           c-11 4-22-1-28-12
           c-8-15-9-33-5-50
           c3-14 1-25-6-35
           c-8-12-6-27 5-39
           c7-8 16-12 26-11z"
        fill="url(#ca3LandFill)"
        opacity=".98"
      />

      {/* Asia */}
      <path
        d="M485 120
           c23-14 58-19 95-11
           c29 6 52 20 63 39
           c12 19 8 38-10 49
           c-14 9-32 11-52 7
           c-8 10-19 17-33 19
           c-17 4-35 0-49-11
           c-14-10-23-24-25-40
           c-3-20 1-36 11-52z"
        fill="url(#ca3LandFill)"
        opacity=".98"
      />

      {/* India / South Asia bump */}
      <path
        d="M530 212
           c8 1 15 6 18 13
           c3 8 0 16-7 21
           c-7 5-16 5-23 0
           c-7-5-10-13-7-20
           c3-9 10-14 19-14z"
        fill="url(#ca3LandFill)"
      />

      {/* Australia */}
      <path
        d="M588 272
           c16-9 38-10 55-3
           c13 5 21 15 20 26
           c-1 11-11 20-25 23
           c-15 4-33 3-48-3
           c-14-6-21-17-18-29
           c2-6 7-11 16-14z"
        fill="url(#ca3LandFill)"
        opacity=".98"
      />

      {/* small islands */}
      <circle
        cx="653"
        cy="258"
        r="4"
        fill="#bceeff"
      />
      <circle
        cx="667"
        cy="266"
        r="3"
        fill="#bceeff"
      />
      <circle
        cx="215"
        cy="205"
        r="3"
        fill="#bceeff"
      />
    </g>
  </svg>

  <div className="ca3-map-label ca3-map-label-one">
    National
  </div>

  <div className="ca3-map-label ca3-map-label-two">
    International
  </div>

  <div className="ca3-map-label ca3-map-label-three">
    Economy
  </div>

  <div className="ca3-map-label ca3-map-label-four">
    Science & Tech
  </div>

  <div className="ca3-map-label ca3-map-label-five">
    Sports
  </div>

</div>

      </section>


      {/* =========================================
          CATEGORY BAR
      ========================================= */}

      <section className="ca3-category-bar">

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
                  selectCategory(
                    category.value
                  )
                }
              >

                <Icon />

                <span>
                  {
                    category.label
                  }
                </span>

              </button>
            );
          }
        )}

        <button
          type="button"
          className="ca3-next-category"
          aria-label="More categories"
        >
          <ChevronRight />
        </button>

      </section>


      {/* =========================================
          LOADING
      ========================================= */}

      {loading && (
        <section className="ca3-state">

          <div className="ca3-loader" />

          <h3>
            Loading Current
            Affairs
          </h3>

          <p>
            Fetching the latest
            exam-focused updates.
          </p>

        </section>
      )}


      {/* =========================================
          ERROR
      ========================================= */}

      {!loading && error && (
        <section className="ca3-state">

          <Newspaper size={36} />

          <h3>
            Unable to load
            Current Affairs
          </h3>

          <p>{error}</p>

        </section>
      )}


      {/* =========================================
          EMPTY
      ========================================= */}

      {!loading &&
        !error &&
        filteredItems.length ===
          0 && (
          <section className="ca3-state">

            <Search size={35} />

            <h3>
              No articles found
            </h3>

            <p>
              Try another keyword
              or category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setActiveCategory(
                  "All"
                );
              }}
            >
              Clear Filters
            </button>

          </section>
        )}


      {/* =========================================
          FEATURED AREA
      ========================================= */}

      {!loading &&
        !error &&
        featuredArticle && (
          <section className="ca3-featured-row">

            <article
              className="ca3-feature-main"
              onClick={() =>
                openArticle(
                  featuredArticle
                )
              }
            >

              <img
                src={getImage(
                  featuredArticle
                )}
                alt={
                  featuredArticle.title
                }
                onError={(event) => {
                  event.currentTarget.src =
                    FALLBACK_IMAGE;
                }}
              />

              <div className="ca3-feature-overlay" />

              <div className="ca3-feature-content">

                <div className="ca3-feature-top">

                  <span className="ca3-featured-label">

                    <Zap size={11} />

                    FEATURED

                  </span>

                  <span>
                    {formatDate(
                      featuredArticle.date ||
                      featuredArticle.createdAt
                    )}
                  </span>

                  <span className="ca3-category-label">

                    {getCategoryKey(
                      featuredArticle
                    )}

                  </span>

                </div>

                <h2>
                  {
                    featuredArticle.title
                  }
                </h2>

                <p>
                  {getSummary(
                    featuredArticle
                  )}
                </p>

                <div className="ca3-feature-actions">

                  <button
                    type="button"
                    className="ca3-read-main"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      openArticle(
                        featuredArticle
                      );
                    }}
                  >

                    Read Full Article

                    <ArrowRight
                      size={15}
                    />

                  </button>

                  <span>
                    <Clock3
                      size={14}
                    />

                    {getReadingTime(
                      featuredArticle
                    )}
                  </span>

                  <span>
                    <Bookmark
                      size={14}
                    />

                    Save
                  </span>

                  <button
                    type="button"
                    className="ca3-icon-text-btn"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      shareArticle(
                        featuredArticle
                      );
                    }}
                  >

                    <Share2
                      size={14}
                    />

                    Share

                  </button>

                </div>

              </div>

            </article>


            <div className="ca3-side-news">

              {sideArticles.map(
                (item) => (
                  <article
                    key={
                      getItemId(
                        item
                      )
                    }
                    className="ca3-side-card"
                    onClick={() =>
                      openArticle(
                        item
                      )
                    }
                  >

                    <div className="ca3-side-image">

                      <img
                        src={getImage(
                          item
                        )}
                        alt={
                          item.title
                        }
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            FALLBACK_IMAGE;
                        }}
                      />

                    </div>

                    <div className="ca3-side-body">

                      <span className="ca3-side-category">

                        {getCategoryKey(
                          item
                        )}

                      </span>

                      <h3>
                        {
                          item.title
                        }
                      </h3>

                      <div className="ca3-side-meta">

                        <span>
                          <CalendarDays />

                          {formatDate(
                            item.date ||
                            item.createdAt
                          )}
                        </span>

                        <span>
                          <Clock3 />

                          {getReadingTime(
                            item
                          )}
                        </span>

                        <Share2 />

                      </div>

                    </div>

                  </article>
                )
              )}

            </div>

          </section>
        )}


      {/* =========================================
          CATEGORY SECTIONS
      ========================================= */}

      {!loading &&
        !error &&
        categoryGroups.length >
          0 && (
          <section className="ca3-groups-grid">

            {categoryGroups.map(
              (group) => {
                const Icon =
                  group.icon;

                return (
                  <section
                    className="ca3-group-panel"
                    key={group.value}
                  >

                    <header className="ca3-group-head">

                      <div>

                        <Icon />

                        <h2>
                          {
                            group.label
                          }
                        </h2>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          selectCategory(
                            group.value
                          )
                        }
                      >

                        View All

                        <ArrowRight
                          size={14}
                        />

                      </button>

                    </header>


                    <div className="ca3-group-articles">

                      {group.articles.map(
                        (item) => (
                          <article
                            className="ca3-mini-card"
                            key={
                              getItemId(
                                item
                              )
                            }
                            onClick={() =>
                              openArticle(
                                item
                              )
                            }
                          >

                            <div className="ca3-mini-image">

                              <img
                                src={getImage(
                                  item
                                )}
                                alt={
                                  item.title
                                }
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.src =
                                    FALLBACK_IMAGE;
                                }}
                              />

                            </div>

                            <h3>
                              {
                                item.title
                              }
                            </h3>

                            <div className="ca3-mini-meta">

                              <span>
                                <Clock3 />

                                {formatDate(
                                  item.date ||
                                  item.createdAt
                                )}
                              </span>

                              <span>
                                {getReadingTime(
                                  item
                                )}
                              </span>

                              <Share2 />

                            </div>

                          </article>
                        )
                      )}

                    </div>

                  </section>
                );
              }
            )}

          </section>
        )}

    </main>
  );
}

export default CurrentAffairs;