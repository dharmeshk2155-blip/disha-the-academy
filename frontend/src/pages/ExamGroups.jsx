import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileText,
  Search,
  Target,
  Trophy,
  Users,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  EXAM_TAXONOMY,
} from "../data/examTaxonomy";

import "./ExamGroups.css";


import useTaxonomy from "../data/useTaxonomy";
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";


function makeStatsKey(
  topCategory,
  subExam
) {
  return `${String(
    topCategory || ""
  ).toLowerCase()}|${String(
    subExam || ""
  ).toLowerCase()}`;
}


export default function ExamGroups() {
  useTaxonomy();
  const navigate =
    useNavigate();

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
  ] = useState("all");

  const [
    testStats,
    setTestStats,
  ] = useState({});

  const [
    loadingStats,
    setLoadingStats,
  ] = useState(true);


  /* =========================================
     LOAD TEST STATS
  ========================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadTests() {
      try {
        setLoadingStats(true);

        const response =
          await fetch(
            `${API_BASE}/api/tests`,
            {
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load tests"
          );
        }

        const data =
          await response.json();

        const allTests =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.tests
              )
            ? data.tests
            : Array.isArray(
                data?.data
              )
            ? data.data
            : [];

        const stats = {};

        allTests.forEach(
          (test) => {
            const key =
              makeStatsKey(
                test.topCategory,
                test.subExam
              );

            if (!stats[key]) {
              stats[key] = {
                seriesCount: 0,
                questionCount: 0,
                studentsCount: 0,
              };
            }

            stats[key].seriesCount +=
              1;

            stats[
              key
            ].questionCount +=
              Number(
                test.totalQuestions
              ) || 0;

            stats[
              key
            ].studentsCount +=
              Number(
                test.studentsCount ??
                  test.studentCount ??
                  test.attemptCount ??
                  test.totalAttempts ??
                  0
              ) || 0;
          }
        );

        setTestStats(stats);
      } catch (error) {
        if (
          error.name !==
          "AbortError"
        ) {
          console.error(
            "Test stats error:",
            error
          );
        }
      } finally {
        setLoadingStats(false);
      }
    }

    loadTests();

    return () => {
      controller.abort();
    };
  }, []);


  /* =========================================
     FLATTEN EXAM TAXONOMY
  ========================================= */

  const allSubExams =
    useMemo(() => {
      const list = [];

      EXAM_TAXONOMY.forEach(
        (group) => {
          group.subExams.forEach(
            (sub) => {
              list.push({
                group,
                sub,
              });
            }
          );
        }
      );

      return list;
    }, []);


  /* =========================================
     FILTERING
  ========================================= */

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return allSubExams.filter(
        ({
          group,
          sub,
        }) => {
          const matchesCategory =
            activeCategory ===
              "all" ||
            group.slug ===
              activeCategory;

          const matchesSearch =
            !query ||
            sub.name
              .toLowerCase()
              .includes(query) ||
            group.title
              .toLowerCase()
              .includes(query);

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      allSubExams,
      activeCategory,
      search,
    ]);


  const mainCategories =
    EXAM_TAXONOMY.slice(
      0,
      4
    );

  const moreCategories =
    EXAM_TAXONOMY.slice(
      4
    );


  function handleSearch(
    event
  ) {
    event.preventDefault();

    setSearch(
      searchInput.trim()
    );
  }


  function selectCategory(
    slug
  ) {
    setActiveCategory(
      slug
    );
  }


  return (
    <main className="mth-page">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="mth-hero">

        <div className="mth-hero-left">

          <button
            type="button"
            className="mth-back"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <ArrowLeft />

            Back to Dashboard
          </button>


          <h1>
            Take a{" "}

            <span>
              Mock Test
            </span>
          </h1>


          <p className="mth-subtitle">
            Choose an exam to see
            available mock tests and
            start your preparation.
          </p>


          {/* FEATURES */}

          <div className="mth-features">

            <Feature
              icon={
                <FileText />
              }
              line1="Latest Exam"
              line2="Pattern"
            />

            <Feature
              icon={
                <BarChart3 />
              }
              line1="Exam Level"
              line2="Practice"
            />

            <Feature
              icon={
                <Target />
              }
              line1="Detailed"
              line2="Performance Analysis"
            />

            <Feature
              icon={
                <Trophy />
              }
              line1="Improve"
              line2="Your Rank"
            />

          </div>

        </div>


        {/* =====================================
            HERO ILLUSTRATION
        ===================================== */}

        <div className="mth-hero-art">

          <div className="mth-art-glow" />

          <div className="mth-art-leaf mth-leaf-1" />
          <div className="mth-art-leaf mth-leaf-2" />
          <div className="mth-art-leaf mth-leaf-3" />
          <div className="mth-art-leaf mth-leaf-4" />


          <div className="mth-books">

            <div className="mth-book mth-book-1" />
            <div className="mth-book mth-book-2" />
            <div className="mth-book mth-book-3" />

          </div>


          <div className="mth-clipboard">

            <div className="mth-clipboard-top" />

            <strong>
              MOCK TEST
            </strong>


            <div className="mth-check-row">
              <span>✓</span>
              <i />
            </div>

            <div className="mth-check-row">
              <b />
              <i />
            </div>

            <div className="mth-check-row">
              <b />
              <i />
            </div>

          </div>


          <div className="mth-clock">

            <Clock3 />

          </div>


          <div className="mth-art-pencil" />


          <div className="mth-art-tagline">
            Practice
            <br />
            Evaluate
            <br />
            Improve
            <br />
            Succeed

            <span />
          </div>

        </div>

      </section>


      {/* =========================================
          SEARCH + FILTER TOOLBAR
      ========================================= */}

      <button
        type="button"
        className="mth-quick"
        onClick={() => navigate("/mock-tests")}
      >
        <span className="mth-quick-icon">
          <Clock3 size={20} />
        </span>

        <span className="mth-quick-text">
          <small>QUICK ACCESS</small>
          <strong>All / Recently added tests</strong>
          <em>Search and filter by exam, category, type and language</em>
        </span>

        <ArrowRight size={20} />
      </button>

      <section className="mth-toolbar">

        <form
          className="mth-search"
          onSubmit={
            handleSearch
          }
        >

          <Search />

          <input
            type="text"
            placeholder="Search exams (e.g. HP Police, SSC, Railway...)"
            value={
              searchInput
            }
            onChange={(
              event
            ) => {
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


        <div className="mth-toolbar-divider" />


        <div className="mth-pills">

          <div className="mth-pills-label">
            <span>
              Browse by
            </span>

            <strong>
              Category:
            </strong>
          </div>


          <button
            type="button"
            className={
              activeCategory ===
              "all"
                ? "active"
                : ""
            }
            onClick={() =>
              selectCategory(
                "all"
              )
            }
          >
            All
          </button>


          {mainCategories.map(
            (group) => (
              <button
                type="button"
                key={
                  group.slug
                }
                className={
                  activeCategory ===
                  group.slug
                    ? "active"
                    : ""
                }
                onClick={() =>
                  selectCategory(
                    group.slug
                  )
                }
              >
                {group.title}
              </button>
            )
          )}


          {moreCategories.length >
            0 && (
            <div className="mth-more-select">

              <select
                value={
                  moreCategories.some(
                    (group) =>
                      group.slug ===
                      activeCategory
                  )
                    ? activeCategory
                    : ""
                }
                onChange={(
                  event
                ) => {
                  if (
                    event.target
                      .value
                  ) {
                    selectCategory(
                      event.target
                        .value
                    );
                  }
                }}
              >

                <option value="">
                  More
                </option>

                {moreCategories.map(
                  (group) => (
                    <option
                      key={
                        group.slug
                      }
                      value={
                        group.slug
                      }
                    >
                      {
                        group.title
                      }
                    </option>
                  )
                )}

              </select>

              <ChevronDown />

            </div>
          )}

        </div>

      </section>


      {/* =========================================
          EXAMS GRID
      ========================================= */}

      <section className="mth-grid">

        {filtered.map(
          (
            {
              group,
              sub,
            },
            index
          ) => {
            const key =
              makeStatsKey(
                group.slug,
                sub.slug
              );

            const stats =
              testStats[key] || {
                seriesCount: 0,
                questionCount: 0,
                studentsCount: 0,
              };

            return (
              <article
                key={key}
                className={[
                  "mth-card",

                  index === 0
                    ? "mth-card-featured"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >

                <div className="mth-card-logo">

                  {sub.iconUrl ? (
                    <img
                      src={
                        sub.iconUrl
                      }
                      alt={
                        sub.name
                      }
                    />
                  ) : (
                    <span>
                      {group.icon ||
                        "🎓"}
                    </span>
                  )}

                </div>


                <div className="mth-card-content">

                  <h2>
                    {sub.name}
                  </h2>

                  <p>
                    {group.title}
                  </p>


                  <div className="mth-card-stats">

                    <span>
                      <ClipboardCheck />

                      {loadingStats
                        ? "..."
                        : stats.seriesCount}

                      {" "}
                      Test Series
                    </span>


                    <span>
                      <FileText />

                      {loadingStats
                        ? "..."
                        : stats.questionCount}

                      + Questions
                    </span>


                    <span>
                      <Users />

                      {loadingStats
                        ? "..."
                        : formatStudents(
                            stats.studentsCount
                          )}

                      {" "}
                      Students
                    </span>

                  </div>

                </div>


                <button
                  type="button"
                  className="mth-card-btn"
                  onClick={() =>
                    navigate(
                      `/take-mock-test/${group.slug}/${sub.slug}`
                    )
                  }
                >
                  Go To Test Series

                  <ArrowRight />
                </button>

              </article>
            );
          }
        )}

      </section>


      {/* EMPTY SEARCH */}

      {filtered.length ===
        0 && (
        <section className="mth-empty">

          <Search />

          <h3>
            No exams found
          </h3>

          <p>
            Try another exam name
            or select a different
            category.
          </p>


          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setActiveCategory(
                "all"
              );
            }}
          >
            Clear Filters
          </button>

        </section>
      )}

    </main>
  );
}


/* =========================================
   FEATURE
========================================= */

function Feature({
  icon,
  line1,
  line2,
}) {
  return (
    <div className="mth-feature">

      <span className="mth-feature-icon">
        {icon}
      </span>

      <p>
        <strong>
          {line1}
        </strong>

        {line2}
      </p>

    </div>
  );
}


/* =========================================
   STUDENT NUMBER FORMAT
========================================= */

function formatStudents(
  value
) {
  const number =
    Number(value || 0);

  if (number >= 1000) {
    const amount =
      number / 1000;

    return `${
      Number.isInteger(
        amount
      )
        ? amount
        : amount.toFixed(1)
    }K+`;
  }

  if (number > 0) {
    return `${number}+`;
  }

  return "0";
}