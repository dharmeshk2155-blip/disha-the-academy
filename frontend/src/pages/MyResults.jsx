import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  Home,
  Medal,
  MoreVertical,
  Play,
  Shield,
  Target,
  Trophy,
} from "lucide-react";

import { Link } from "react-router-dom";

import "./MyResults.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";


const EXAM_TABS = [
  "All Tests",
  "HP Police",
  "SSC",
  "CGL",
  "CHSL",
  "GD",
  "MTS",
];


function normalize(value = "") {
  return String(value)
    .trim()
    .toLowerCase();
}


function getResultId(result) {
  return (
    result.resultId ??
    result.id ??
    result.ResultId
  );
}


function getTitle(result) {
  return (
    result.testTitle ||
    result.title ||
    result.testName ||
    "Mock Test"
  );
}


function getExam(result) {
  return (
    result.exam ||
    result.examName ||
    result.category ||
    result.examCategory ||
    "All Exams"
  );
}


function getQuestionCount(result) {
  return (
    result.totalQuestions ??
    result.questionCount ??
    (
      Number(result.correctCount || 0) +
      Number(result.wrongCount || 0) +
      Number(result.unansweredCount || 0)
    )
  );
}


function getDuration(result) {
  return (
    result.duration ||
    result.durationMinutes ||
    result.testDuration ||
    null
  );
}


function getPercentage(result) {
  const direct =
    result.percentage ??
    result.scorePercentage ??
    result.percent;

  if (
    direct !== undefined &&
    direct !== null &&
    direct !== ""
  ) {
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(
            String(direct).replace("%", "")
          ) || 0
        )
      )
    );
  }

  const score =
    Number(result.score || 0);

  const total =
    Number(result.totalMarks || 0);

  if (!total) return 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (score / total) * 100
      )
    )
  );
}


function getRank(result) {
  const value =
    result.rank ??
    result.position ??
    result.userRank;

  const numeric =
    Number(value);

  return Number.isFinite(numeric) &&
    numeric > 0
    ? numeric
    : null;
}


function getTotalParticipants(result) {
  return (
    result.totalParticipants ??
    result.totalCandidates ??
    result.rankOutOf ??
    null
  );
}


function formatDate(value) {
  if (!value) {
    return {
      date: "Date unavailable",
      time: "",
    };
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return {
      date: String(value),
      time: "",
    };
  }

  return {
    date:
      parsed.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      ),

    time:
      parsed.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      ),
  };
}


function matchesExamTab(
  result,
  tab
) {
  if (tab === "All Tests") {
    return true;
  }

  const text =
    normalize(
      `${getExam(result)} ${getTitle(result)}`
    );

  if (tab === "HP Police") {
    return (
      text.includes("hp police") ||
      text.includes("police constable")
    );
  }

  if (tab === "SSC") {
    return (
      text.includes("ssc") ||
      text.includes("staff selection")
    );
  }

  return text.includes(
    normalize(tab)
  );
}


export default function MyResults() {
  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "dishaUser"
        ) || "null"
      );
    } catch {
      return null;
    }
  }, []);


  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    activeExam,
    setActiveExam,
  ] = useState("All Tests");

  const [
    examFilter,
    setExamFilter,
  ] = useState("All Exams");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("All Test Types");

  const [
    dateFilter,
    setDateFilter,
  ] = useState("All Dates");

  const [
    sortBy,
    setSortBy,
  ] = useState("recent");


  useEffect(() => {
    if (!user?.id) {
      setError(
        "Please log in to see your results."
      );

      setLoading(false);

      return;
    }

    let ignore = false;

    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/api/tests/results/${encodeURIComponent(
              user.id
            )}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "dishaToken"
                )}`,
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load your results."
          );
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.results
              )
            ? data.results
            : Array.isArray(
                data?.data
              )
            ? data.data
            : [];

        if (!ignore) {
          setResults(list);
        }
      } catch (err) {
        console.error(
          "Results error:",
          err
        );

        if (!ignore) {
          setError(
            err.message ||
              "Unable to load your results."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      ignore = true;
    };
  }, [user?.id]);


  /* =========================
     HERO STATS
  ========================= */

  const stats =
    useMemo(() => {
      if (!results.length) {
        return {
          total: 0,
          topRank: "—",
          average: 0,
          best: 0,
        };
      }

      const percentages =
        results.map(
          getPercentage
        );

      const ranks =
        results
          .map(getRank)
          .filter(Boolean);

      return {
        total: results.length,

        topRank:
          ranks.length
            ? Math.min(...ranks)
            : "—",

        average:
          Math.round(
            percentages.reduce(
              (sum, item) =>
                sum + item,
              0
            ) /
              percentages.length
          ),

        best:
          Math.max(
            ...percentages
          ),
      };
    }, [results]);


  const examOptions =
    useMemo(() => {
      const values =
        results
          .map(getExam)
          .filter(Boolean);

      return [
        "All Exams",
        ...new Set(values),
      ];
    }, [results]);


  const filteredResults =
    useMemo(() => {
      let list =
        results.filter(
          (result) =>
            matchesExamTab(
              result,
              activeExam
            )
        );


      if (
        examFilter !==
        "All Exams"
      ) {
        list =
          list.filter(
            (result) =>
              normalize(
                getExam(result)
              ) ===
              normalize(
                examFilter
              )
          );
      }


      if (
        typeFilter !==
        "All Test Types"
      ) {
        list =
          list.filter(
            (result) =>
              normalize(
                result.testType ||
                  result.type ||
                  ""
              ).includes(
                normalize(
                  typeFilter
                )
              )
          );
      }


      if (
        dateFilter !==
        "All Dates"
      ) {
        const now =
          new Date();

        const limit =
          new Date();

        if (
          dateFilter ===
          "Last 7 Days"
        ) {
          limit.setDate(
            now.getDate() - 7
          );
        }

        if (
          dateFilter ===
          "Last 30 Days"
        ) {
          limit.setDate(
            now.getDate() - 30
          );
        }

        if (
          dateFilter ===
          "Last 90 Days"
        ) {
          limit.setDate(
            now.getDate() - 90
          );
        }

        list =
          list.filter(
            (result) => {
              const date =
                new Date(
                  result.submittedAt ||
                    result.date ||
                    result.createdAt
                );

              return (
                !Number.isNaN(
                  date.getTime()
                ) &&
                date >= limit
              );
            }
          );
      }


      return [
        ...list,
      ].sort((a, b) => {
        if (
          sortBy ===
          "score"
        ) {
          return (
            getPercentage(b) -
            getPercentage(a)
          );
        }

        const dateA =
          new Date(
            a.submittedAt ||
              a.date ||
              a.createdAt ||
              0
          ).getTime();

        const dateB =
          new Date(
            b.submittedAt ||
              b.date ||
              b.createdAt ||
              0
          ).getTime();

        return dateB - dateA;
      });
    }, [
      results,
      activeExam,
      examFilter,
      typeFilter,
      dateFilter,
      sortBy,
    ]);


  return (
    <main className="mr-page">

      {/* =========================================
          HERO — ALWAYS VISIBLE
      ========================================= */}

      <section className="mr-hero">

        <div className="mr-hero-left">

          <div className="mr-breadcrumb">
            <Home />

            <span>/</span>

            <strong>
              My Results
            </strong>
          </div>


          <h1>
            My{" "}
            <span>
              Results
            </span>
          </h1>


          <p className="mr-hero-subtitle">
            All your mock test
            attempts, most recent
            first.
          </p>


          <div className="mr-stats">

            <StatCard
              icon={
                <FileText />
              }
              value={
                stats.total
              }
              label="Total Tests Attempted"
              theme="blue"
            />

            <StatCard
              icon={
                <Trophy />
              }
              value={
                stats.topRank
              }
              label="Top Rank Achieved"
              theme="green"
            />

            <StatCard
              icon={
                <BarChart3 />
              }
              value={`${stats.average}%`}
              label="Average Score"
              theme="orange"
            />

            <StatCard
              icon={
                <Target />
              }
              value={`${stats.best}%`}
              label="Best Score"
              theme="purple"
            />

          </div>

        </div>


        {/* HERO ILLUSTRATION */}

        <div className="mr-hero-art">

          <div className="mr-art-glow" />

          <div className="mr-art-trophy">
            <Trophy />
          </div>

          <div className="mr-art-chart">

            <div className="mr-chart-bars">
              <span />
              <span />
              <span />
              <span />
            </div>

            <ArrowRight className="mr-chart-arrow" />

          </div>

          <div className="mr-art-student">

            <div className="mr-student-head" />

            <div className="mr-student-hair" />

            <div className="mr-student-body">
              <span />
            </div>

            <div className="mr-student-laptop">
              <div />
            </div>

          </div>

          <div className="mr-art-message">
            Track
            <br />
            Improve
            <br />
            Succeed

            <span />
          </div>

        </div>

      </section>


      {/* =========================================
          LOADING
      ========================================= */}

      {loading && (
        <section className="mr-state-card">

          <div className="mr-loader" />

          <h2>
            Loading your results...
          </h2>

          <p>
            Please wait while we
            prepare your test history.
          </p>

        </section>
      )}


      {/* =========================================
          ERROR
      ========================================= */}

      {!loading && error && (
        <section className="mr-state-card mr-error-state">

          <FileText />

          <h2>
            Results unavailable
          </h2>

          <p>{error}</p>

        </section>
      )}


      {/* =========================================
          EMPTY USER
      ========================================= */}

      {!loading &&
        !error &&
        results.length === 0 && (
          <EmptyResults />
        )}


      {/* =========================================
          USER HAS ACTIVITY
      ========================================= */}

      {!loading &&
        !error &&
        results.length > 0 && (
          <>

            {/* FILTER BAR */}

            <section className="mr-filter-panel">

              <div className="mr-select-box">

                <select
                  value={
                    examFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setExamFilter(
                      event.target
                        .value
                    )
                  }
                >
                  {examOptions.map(
                    (exam) => (
                      <option
                        key={exam}
                      >
                        {exam}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown />

              </div>


              <div className="mr-select-box">

                <select
                  value={
                    typeFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setTypeFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option>
                    All Test Types
                  </option>

                  <option>
                    Full Test
                  </option>

                  <option>
                    Chapter Test
                  </option>

                  <option>
                    Weekly Test
                  </option>

                  <option>
                    Mock Test
                  </option>
                </select>

                <ChevronDown />

              </div>


              <div className="mr-select-box mr-date-select">

                <CalendarDays />

                <select
                  value={
                    dateFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setDateFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option>
                    All Dates
                  </option>

                  <option>
                    Last 7 Days
                  </option>

                  <option>
                    Last 30 Days
                  </option>

                  <option>
                    Last 90 Days
                  </option>
                </select>

                <ChevronDown />

              </div>


              <button
                type="button"
                className="mr-filter-button"
              >
                <Filter />

                Filter
              </button>

            </section>


            {/* CATEGORY TABS */}

            <section className="mr-tabs">

              {EXAM_TABS.map(
                (tab) => (
                  <button
                    type="button"
                    key={tab}
                    className={
                      activeExam ===
                      tab
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveExam(
                        tab
                      )
                    }
                  >

                    <ExamTabIcon
                      tab={tab}
                    />

                    {tab}

                  </button>
                )
              )}


              <button
                type="button"
                className="mr-more-tab"
              >
                <MoreVertical />

                More Exams

                <ChevronDown />
              </button>

            </section>


            {/* RESULTS HEADER */}

            <section className="mr-results-heading">

              <div>

                <span />

                <h2>
                  Your Test Attempts
                </h2>

              </div>


              <div className="mr-results-sort">

                <span>
                  Showing{" "}
                  {
                    filteredResults.length
                  }{" "}
                  results
                </span>

                <div className="mr-sort-box">

                  <select
                    value={
                      sortBy
                    }
                    onChange={(
                      event
                    ) =>
                      setSortBy(
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="recent">
                      Most Recent
                    </option>

                    <option value="score">
                      Best Score
                    </option>
                  </select>

                  <ChevronDown />

                </div>

              </div>

            </section>


            {/* RESULT ROWS */}

            {filteredResults.length >
            0 ? (
              <section className="mr-results-list">

                {filteredResults.map(
                  (result) => (
                    <ResultRow
                      key={
                        getResultId(
                          result
                        ) ||
                        `${getTitle(
                          result
                        )}-${result.submittedAt}`
                      }
                      result={
                        result
                      }
                    />
                  )
                )}

              </section>
            ) : (
              <section className="mr-filter-empty">

                <ClipboardCheck />

                <h3>
                  No matching results
                </h3>

                <p>
                  Try another exam
                  or filter.
                </p>

              </section>
            )}

          </>
        )}

    </main>
  );
}


/* ======================================================
   STAT CARD
====================================================== */

function StatCard({
  icon,
  value,
  label,
  theme,
}) {
  return (
    <article
      className={`mr-stat-card ${theme}`}
    >

      <span className="mr-stat-icon">
        {icon}
      </span>

      <div>
        <strong>
          {value}
        </strong>

        <p>
          {label}
        </p>
      </div>

    </article>
  );
}


/* ======================================================
   EMPTY STATE
====================================================== */

function EmptyResults() {
  return (
    <section className="mr-empty-card">

      <div className="mr-empty-illustration">

        <div className="mr-empty-blob mr-empty-blob-one" />

        <div className="mr-empty-blob mr-empty-blob-two" />


        <div className="mr-empty-clipboard">

          <ClipboardCheck />

        </div>


        <div className="mr-empty-clock">

          <Clock3 />

        </div>


        <div className="mr-empty-plane">
          ➤
        </div>

      </div>


      <h2>
        No test attempts yet!
      </h2>


      <p>
        You haven't attempted any
        mock tests yet.
        <br />

        Start practicing to see your
        results, track your progress
        and improve your rank.
      </p>


      <Link
        to="/mock-tests"
        className="mr-explore-button"
      >
        <span>
          <Play />
        </span>

        Explore Mock Tests

        <ArrowRight />
      </Link>

    </section>
  );
}


/* ======================================================
   RESULT ROW
====================================================== */

function ResultRow({
  result,
}) {
  const percentage =
    getPercentage(result);

  const score =
    result.score ?? 0;

  const totalMarks =
    result.totalMarks ??
    0;

  const rank =
    getRank(result);

  const participants =
    getTotalParticipants(
      result
    );

  const date =
    formatDate(
      result.submittedAt ||
      result.date ||
      result.createdAt
    );

  const duration =
    getDuration(result);

  return (
    <article className="mr-result-row">

      <div className="mr-test-info">

        <div className="mr-test-icon">
          <GraduationCap />
        </div>


        <div>
          <h3>
            {getTitle(result)}
          </h3>

          <p>
            <span>
              {getExam(result)}
            </span>

            <i />

            <span>
              {getQuestionCount(
                result
              )}{" "}
              Questions
            </span>

            {duration && (
              <>
                <i />

                <span>
                  {duration} Minutes
                </span>
              </>
            )}
          </p>
        </div>

      </div>


      <div className="mr-score-area">

        <ScoreRing
          value={
            percentage
          }
        />

        <div>
          <strong>
            {score} /{" "}
            {totalMarks}
          </strong>

          <span>
            Score
          </span>
        </div>

      </div>


      <div className="mr-rank-area">

        <Trophy />

        <div>
          <span>
            Rank
          </span>

          <strong>
            {rank
              ? `#${rank}`
              : "—"}

            {participants
              ? ` / ${Number(
                  participants
                ).toLocaleString(
                  "en-IN"
                )}`
              : ""}
          </strong>
        </div>

      </div>


      <div className="mr-date-area">

        <CalendarDays />

        <div>
          <strong>
            {date.date}
          </strong>

          <span>
            {date.time}
          </span>
        </div>

      </div>


      <button
        type="button"
        className="mr-view-button"
        onClick={() => {
          const id =
            getResultId(
              result
            );

          if (id) {
            window.location.href =
              `/results/${id}`;
          }
        }}
      >
        View Details

        <ArrowRight />
      </button>

    </article>
  );
}


/* ======================================================
   SCORE CIRCLE
====================================================== */

function ScoreRing({
  value,
}) {
  return (
    <div
      className="mr-score-ring"
      style={{
        "--score":
          `${value * 3.6}deg`,
      }}
    >
      <div>
        {value}%
      </div>
    </div>
  );
}


/* ======================================================
   TAB ICON
====================================================== */

function ExamTabIcon({
  tab,
}) {
  if (
    tab === "HP Police"
  ) {
    return <Shield />;
  }

  if (tab === "SSC") {
    return <GraduationCap />;
  }

  return <FileText />;
}