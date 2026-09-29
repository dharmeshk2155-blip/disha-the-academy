import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileText,
  Flame,
  GraduationCap,
  Search,
  Target,
  Trophy,
} from "lucide-react";

import "./Dashboard.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";


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
        Number(
          String(direct).replace("%", "")
        ) || 0
      )
    );
  }

  const score =
    Number(result.score || 0);

  const total =
    Number(result.totalMarks || 0);

  if (!total) {
    return score;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (score / total) * 100
    )
  );
}


export default function Dashboard() {
  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("dishaUser") ||
          "null"
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


  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/tests/results/${encodeURIComponent(
            user.id
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load dashboard data."
          );
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.data)
            ? data.data
            : [];

        if (!ignore) {
          setResults(list);
        }
      } catch (err) {
        console.error(
          "Dashboard error:",
          err
        );

        if (!ignore) {
          setError(
            err.message ||
              "Unable to load dashboard."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [user?.id]);


  const stats =
    useMemo(() => {
      if (!results.length) {
        return {
          testsTaken: 0,
          average: 0,
          best: 0,
        };
      }

      const scores =
        results.map(
          getPercentage
        );

      const average =
        scores.reduce(
          (sum, score) =>
            sum + score,
          0
        ) / scores.length;

      return {
        testsTaken:
          results.length,

        average:
          Math.round(average),

        best:
          Math.round(
            Math.max(...scores)
          ),
      };
    }, [results]);


  const displayName =
    user?.fullName ||
    user?.name ||
    "Student";


  return (
    <main className="db-page">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="db-hero">

        <div className="db-hero-left">

          <div className="db-brand-line">

            <span />

            DISHA THE ACADEMY

          </div>


          <h1>
            Welcome back,{" "}

            <span>
              {displayName}
            </span>{" "}

            <span className="db-wave">
              👋
            </span>
          </h1>


          <p>
            Keep going! Here's a
            quick look at your
            learning progress.
          </p>


          {/* STAT CARDS */}

          <div className="db-stats">

            <DashboardStat
              theme="blue"
              icon={
                <FileText />
              }
              value={
                stats.testsTaken
              }
              label="Tests Taken"
              decoration="chart"
            />


            <DashboardStat
              theme="gold"
              icon={
                <BarChart3 />
              }
              value={
                results.length
                  ? `${stats.average}%`
                  : "0"
              }
              label="Average Score"
              decoration="bars"
            />


            <DashboardStat
              theme="green"
              icon={
                <Trophy />
              }
              value={
                results.length
                  ? `${stats.best}%`
                  : "0"
              }
              label="Best Score"
              decoration="trend"
            />

          </div>

        </div>


        {/* =========================================
            HERO ILLUSTRATION
        ========================================= */}

        <div className="db-hero-art">

          <div className="db-art-glow" />

          <div className="db-art-message">
            Smaller
            <br />
            Steps
            <br />
            Bigger
            <br />
            Results

            <span />
          </div>


          <div className="db-book-stack">

            <div className="db-book db-book-one">
              <strong>
                DISHA
              </strong>
            </div>

            <div className="db-book db-book-two">
              THE ACADEMY
            </div>

            <div className="db-book db-book-three" />

          </div>


          <div className="db-cap">

            <GraduationCap />

            <span />

          </div>


          <div className="db-plant">

            <div className="db-leaf db-leaf-1" />
            <div className="db-leaf db-leaf-2" />
            <div className="db-leaf db-leaf-3" />
            <div className="db-leaf db-leaf-4" />

            <div className="db-plant-pot" />

          </div>

        </div>

      </section>


      {/* =========================================
          QUICK LINKS
      ========================================= */}

      <section className="db-quick-bar">

        <QuickLink
          to="/my-results"
          icon={
            <FileText />
          }
          title="My Results"
          subtitle="View your performance"
        />


        <QuickLink
          to="/mock-tests"
          icon={
            <ClipboardCheck />
          }
          title="Take a Mock Test"
          subtitle="Practice and improve"
        />


        <QuickLink
          to="/notes"
          icon={
            <BookOpen />
          }
          title="Browse Notes"
          subtitle="Study smartly"
        />


        <QuickLink
          to="/leaderboard"
          icon={
            <Trophy />
          }
          title="Leaderboard"
          subtitle="See how you rank"
        />

      </section>


      {/* =========================================
          LOADING
      ========================================= */}

      {loading && (
        <section className="db-loading">

          <div className="db-loader" />

          <p>
            Loading your dashboard...
          </p>

        </section>
      )}


      {!loading && error && (
        <section className="db-error">
          {error}
        </section>
      )}


      {/* =========================================
          DASHBOARD CONTENT
      ========================================= */}

      {!loading &&
        !error && (
          <section className="db-content-grid">

            <div className="db-main-content">

              {results.length ===
              0 ? (

                /* EMPTY STATE */

                <section className="db-empty">

                  <div className="db-empty-art">

                    <div className="db-empty-circle" />

                    <div className="db-empty-paper">

                      <ClipboardCheck />

                    </div>


                    <div className="db-empty-search">

                      <Search />

                    </div>


                    <span className="db-empty-dot db-dot-one" />
                    <span className="db-empty-dot db-dot-two" />

                  </div>


                  <div className="db-empty-copy">

                    <span>
                      NO MOCK TESTS YET
                    </span>

                    <h2>
                      You haven't taken
                      any mock tests yet.
                    </h2>

                    <p>
                      Start your first
                      mock test to track
                      your progress,
                      identify strong
                      topics and work on
                      areas of
                      improvement.
                    </p>

                    <Link
                      to="/mock-tests"
                      className="db-start-button"
                    >
                      Start your first
                      test

                      <ArrowRight />
                    </Link>

                  </div>

                </section>

              ) : (

                /* USER HAS RESULTS */

                <section className="db-progress-panel">

                  <div className="db-progress-head">

                    <div>
                      <span>
                        YOUR PROGRESS
                      </span>

                      <h2>
                        Recent Test
                        Performance
                      </h2>
                    </div>

                    <Link to="/my-results">
                      View All Results

                      <ArrowRight />
                    </Link>

                  </div>


                  <div className="db-recent-results">

                    {results
                      .slice(0, 3)
                      .map(
                        (
                          result,
                          index
                        ) => (
                          <div
                            className="db-recent-row"
                            key={
                              result.resultId ||
                              result.id ||
                              index
                            }
                          >

                            <div className="db-recent-icon">
                              <ClipboardCheck />
                            </div>

                            <div className="db-recent-info">

                              <strong>
                                {result.testTitle ||
                                  result.title ||
                                  "Mock Test"}
                              </strong>

                              <span>
                                {Math.round(
                                  getPercentage(
                                    result
                                  )
                                )}
                                % Score
                              </span>

                            </div>

                            <div className="db-recent-score">

                              {result.score ??
                                0}

                              {result.totalMarks
                                ? ` / ${result.totalMarks}`
                                : ""}

                            </div>

                          </div>
                        )
                      )}

                  </div>

                </section>
              )}

            </div>


            {/* =====================================
                RIGHT SIDEBAR
            ===================================== */}

            <aside className="db-sidebar">

              {/* STREAK */}

              <section className="db-side-card db-streak-card">

                <div className="db-side-icon db-fire">
                  <Flame />
                </div>


                <div className="db-side-copy">

                  <strong>
                    Learning Streak
                  </strong>

                  <p>
                    Keep the momentum
                    going!
                  </p>

                  <div>
                    <b>
                      {results.length
                        ? 1
                        : 0}
                    </b>

                    <span>
                      days
                    </span>
                  </div>

                </div>


                <div className="db-week">

                  {[
                    "M",
                    "T",
                    "W",
                    "T",
                    "F",
                    "S",
                    "S",
                  ].map(
                    (
                      day,
                      index
                    ) => (
                      <div
                        key={`${day}-${index}`}
                      >
                        <span
                          className={
                            results.length &&
                            index === 0
                              ? "active"
                              : ""
                          }
                        />

                        <small>
                          {day}
                        </small>
                      </div>
                    )
                  )}

                </div>

              </section>


              {/* NEXT GOAL */}

              <Link
                to="/mock-tests"
                className="db-side-card db-goal-card"
              >

                <div className="db-side-icon db-target">
                  <Target />
                </div>


                <div className="db-side-copy">

                  <strong>
                    Next Goal
                  </strong>

                  <p>
                    {results.length
                      ? "Improve your best score"
                      : "Take your first mock test"}
                  </p>

                </div>


                <span className="db-side-arrow">
                  <ArrowRight />
                </span>

              </Link>


              {/* RECOMMENDED */}

              <Link
                to="/notes"
                className="db-side-card db-recommend-card"
              >

                <div className="db-side-icon db-book-icon">
                  <BookOpen />
                </div>


                <div className="db-side-copy">

                  <strong>
                    Recommended for You
                  </strong>

                  <p>
                    Explore our most
                    popular notes and
                    tests
                  </p>

                </div>


                <span className="db-side-arrow">
                  <ArrowRight />
                </span>

              </Link>

            </aside>

          </section>
        )}

    </main>
  );
}


/* ======================================================
   STAT CARD
====================================================== */

function DashboardStat({
  theme,
  icon,
  value,
  label,
  decoration,
}) {
  return (
    <article
      className={`db-stat ${theme}`}
    >

      <div className="db-stat-icon">
        {icon}
      </div>


      <div className="db-stat-copy">

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>


      <div
        className={`db-stat-decoration ${decoration}`}
      >
        <i />
        <i />
        <i />
      </div>

    </article>
  );
}


/* ======================================================
   QUICK LINK
====================================================== */

function QuickLink({
  to,
  icon,
  title,
  subtitle,
}) {
  return (
    <Link
      to={to}
      className="db-quick-link"
    >

      <div className="db-quick-icon">
        {icon}
      </div>


      <div className="db-quick-copy">

        <strong>
          {title}
        </strong>

        <span>
          {subtitle}
        </span>

      </div>


      <div className="db-quick-arrow">
        <ArrowRight />
      </div>

    </Link>
  );
}