import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  BarChart3,
  Crown,
  Medal,
  Star,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";

import "./Leaderboard.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const FILTERS = [
  "All Exams",
  "HP Police",
  "SSC",
  "Railway",
  "Banking",
  "Teaching",
  "State Exams",
];

function normalize(value = "") {
  return String(value)
    .trim()
    .toLowerCase();
}

function getExam(row) {
  return (
    row.exam ||
    row.examName ||
    row.category ||
    row.testName ||
    "General"
  );
}

function getBestScore(row) {
  const value =
    row.bestScore ??
    row.bestPercentage ??
    row.percentage;

  if (value === undefined || value === null) {
    return "—";
  }

  const text = String(value);

  return text.includes("%")
    ? text
    : `${text}%`;
}

function getTotalScore(row) {
  return Number(
    row.totalScore ??
      row.score ??
      row.points ??
      0
  );
}

function getTestsTaken(row) {
  return (
    row.testsTaken ??
    row.testsAttempted ??
    row.attempts ??
    0
  );
}

function getAvatarInitials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";

  return parts
    .slice(0, 2)
    .map((item) =>
      item.charAt(0).toUpperCase()
    )
    .join("");
}

function matchesFilter(row, filter) {
  if (filter === "All Exams") {
    return true;
  }

  const exam = normalize(getExam(row));

  if (filter === "HP Police") {
    return (
      exam.includes("hp police") ||
      exam.includes("police constable")
    );
  }

  if (filter === "SSC") {
    return (
      exam.includes("ssc") ||
      exam.includes("cgl") ||
      exam.includes("chsl") ||
      exam.includes("mts") ||
      exam.includes("cpo") ||
      exam.includes("gd")
    );
  }

  if (filter === "Railway") {
    return (
      exam.includes("railway") ||
      exam.includes("rrb")
    );
  }

  if (filter === "Banking") {
    return (
      exam.includes("bank") ||
      exam.includes("ibps") ||
      exam.includes("sbi")
    );
  }

  if (filter === "Teaching") {
    return (
      exam.includes("teaching") ||
      exam.includes("teacher") ||
      exam.includes("tet")
    );
  }

  if (filter === "State Exams") {
    return (
      exam.includes("state") ||
      exam.includes("pcs") ||
      exam.includes("hppsc") ||
      exam.includes("hprca")
    );
  }

  return exam.includes(
    normalize(filter)
  );
}

export default function Leaderboard() {
  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("All Exams");

  useEffect(() => {
    let ignore = false;

    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/leaderboard`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load leaderboard."
          );
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.rows)
            ? data.rows
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(
                data?.leaderboard
              )
            ? data.leaderboard
            : [];

        if (!ignore) {
          setRows(list);
        }
      } catch (err) {
        console.error(
          "Leaderboard error:",
          err
        );

        if (!ignore) {
          setError(
            err.message ||
              "Unable to load leaderboard."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      ignore = true;
    };
  }, []);

  const sortedRows = useMemo(() => {
    return [...rows].sort(
      (a, b) =>
        getTotalScore(b) -
        getTotalScore(a)
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    return sortedRows.filter((row) =>
      matchesFilter(
        row,
        activeFilter
      )
    );
  }, [
    sortedRows,
    activeFilter,
  ]);

  const topThree =
  sortedRows.slice(0, 3);
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  const currentUser =
    rows.find(
      (row) =>
        row.isCurrentUser ||
        row.currentUser
    ) || null;

  const currentUserRank =
    currentUser
      ? sortedRows.findIndex(
          (row) =>
            row === currentUser
        ) + 1
      : null;

  const topPerformer =
    sortedRows[0];

  return (
    <main className="lb-page">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="lb-hero">

        <div className="lb-hero-copy">

          <div className="lb-title-wrap">

            <Crown className="lb-title-crown" />

            <h1>
              Leader<span>board</span>
            </h1>

          </div>

          <p>
            Top scorers across all
            mock tests.
          </p>

          <div className="lb-benefits">

            <div>
              <span>
                <Target />
              </span>

              <p>
                <strong>
                  Compete
                </strong>

                with others
              </p>
            </div>

            <div>
              <span>
                <BarChart3 />
              </span>

              <p>
                <strong>
                  Track
                </strong>

                your progress
              </p>
            </div>

            <div>
              <span>
                <Star />
              </span>

              <p>
                <strong>
                  Improve
                </strong>

                your rank
              </p>
            </div>

          </div>

        </div>


        {/* TROPHY ILLUSTRATION */}

        <div className="lb-trophy-art">

          <div className="lb-trophy-glow" />

          <div className="lb-laurel lb-laurel-left">
            ❧
          </div>

          <div className="lb-laurel lb-laurel-right">
            ❧
          </div>

          <div className="lb-trophy">

            <Crown className="lb-trophy-crown" />

            <Trophy />

            <div className="lb-trophy-base">
              ★
            </div>

          </div>

        </div>


        <div className="lb-hero-message">
          Learn
          <br />
          Practice
          <br />
          Compete
          <br />
          Grow
        </div>


        {/* =====================================
            TOP 3 PODIUM
        ===================================== */}

        {!loading &&
  !error &&
  topThree.length > 0 && (
    <div className="lb-podium">

      {second && (
        <PodiumCard
          row={second}
          rank={2}
        />
      )}

      {first && (
        <PodiumCard
          row={first}
          rank={1}
        />
      )}

      {third && (
        <PodiumCard
          row={third}
          rank={3}
        />
      )}

    </div>
)}

      </section>


      {/* =========================================
          MAIN AREA
      ========================================= */}

      <section className="lb-main-grid">

        <section className="lb-ranking-panel">

          {/* FILTERS */}

          <div className="lb-filter-bar">

            {FILTERS.map(
              (filter) => (
                <button
                  type="button"
                  key={filter}
                  className={
                    activeFilter ===
                    filter
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveFilter(
                      filter
                    )
                  }
                >
                  {filter}
                </button>
              )
            )}

          </div>


          {/* LOADING */}

          {loading && (
            <div className="lb-state">

              <div className="lb-loader" />

              <h3>
                Loading leaderboard...
              </h3>

            </div>
          )}


          {/* ERROR */}

          {!loading && error && (
            <div className="lb-state">

              <Trophy />

              <h3>
                Unable to load
                leaderboard
              </h3>

              <p>{error}</p>

            </div>
          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            filteredRows.length === 0 && (
            <div className="lb-state">

              <Medal />

              <h3>
                No rankings yet
              </h3>

              <p>
                Be the first to
                attempt a mock test.
              </p>

            </div>
          )}


          {/* TABLE */}

          {!loading &&
            !error &&
            filteredRows.length > 0 && (
            <div className="lb-table-wrap">

              <table className="lb-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Exam</th>
                    <th>
                      Tests Attempted
                    </th>
                    <th>
                      Best Score
                    </th>
                    <th>
                      Total Score
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredRows.map(
                    (
                      row,
                      index
                    ) => (
                      <tr
                        key={
                          row.id ||
                          `${row.name}-${index}`
                        }
                      >

                        <td>
                          <RankBadge
                            rank={
                              index +
                              1
                            }
                          />
                        </td>

                        <td>

                          <div className="lb-user-cell">

                            <Avatar
                              name={
                                row.name
                              }
                              rank={
                                index +
                                1
                              }
                            />

                            <strong>
                              {row.name ||
                                "Student"}
                            </strong>

                          </div>

                        </td>

                        <td>
                          {getExam(
                            row
                          )}
                        </td>

                        <td>
                          {getTestsTaken(
                            row
                          )}
                        </td>

                        <td className="lb-best-score">
                          {getBestScore(
                            row
                          )}
                        </td>

                        <td className="lb-total-score">
                          {getTotalScore(
                            row
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>


        {/* =========================================
            SIDEBAR
        ========================================= */}

        <aside className="lb-sidebar">

          {/* YOUR RANK */}

          <section className="lb-side-card lb-rank-card">

            <div className="lb-side-heading">

              <span className="lb-side-icon">
                <BarChart3 />
              </span>

              <div>
                <h2>
                  Your Rank
                </h2>

                <p>
                  Keep attempting
                  tests to get on the
                  leaderboard!
                </p>
              </div>

            </div>


            {currentUser ? (
              <div className="lb-current-user">

                <Avatar
                  name={
                    currentUser.name
                  }
                />

                <div>
                  <small>
                    Current Rank
                  </small>

                  <strong>
                    #
                    {
                      currentUserRank
                    }
                  </strong>

                  <span>
                    {getTotalScore(
                      currentUser
                    )}{" "}
                    points
                  </span>
                </div>

              </div>
            ) : (
              <div className="lb-not-ranked">

                <span>
                  <UserRound />
                </span>

                <div>
                  <strong>
                    Not Ranked Yet
                  </strong>

                  <p>
                    Attempt a mock test
                    now and start
                    climbing!
                  </p>
                </div>

              </div>
            )}


            <Link
              to="/mock-tests"
              className="lb-test-button"
            >
              Take a Mock Test

              <ArrowRight />
            </Link>

          </section>


          {/* TOP PERFORMER */}

          {topPerformer && (
            <section className="lb-side-card lb-top-card">

              <div className="lb-top-heading">

                <Crown />

                <h2>
                  Top Performer
                </h2>

              </div>


              <div className="lb-top-user">

                <Avatar
                  name={
                    topPerformer.name
                  }
                  rank={1}
                  large
                />

                <div className="lb-top-user-info">

                  <strong>
                    {topPerformer.name}
                  </strong>

                  <span>
                    {getExam(
                      topPerformer
                    )}
                  </span>

                </div>


                <div className="lb-top-score">

                  {getTotalScore(
                    topPerformer
                  )}

                  <span>
                    /1000
                  </span>

                </div>

              </div>

            </section>
          )}

        </aside>

      </section>

    </main>
  );
}


/* ======================================================
   PODIUM CARD
====================================================== */

function PodiumCard({
  row,
  rank,
}) {
  return (
    <article
      className={`lb-podium-card lb-podium-${rank}`}
    >

      <div className="lb-podium-medal">

        <Medal />

        <span>
          {rank}
        </span>

      </div>


      <Avatar
        name={row.name}
        rank={rank}
        large
      />


      {rank === 1 && (
        <div className="lb-winner-leaves">
          <span>❧</span>
          <span>❧</span>
        </div>
      )}


      <h3>
        {row.name ||
          "Student"}
      </h3>

      <p>
        {getExam(row)}
      </p>


      <strong className="lb-podium-score">

        {getTotalScore(row)}

        <span>
          /1000
        </span>

      </strong>

    </article>
  );
}


/* ======================================================
   AVATAR
====================================================== */

function Avatar({
  name,
  rank,
  large = false,
}) {
  return (
    <div
      className={[
        "lb-avatar",
        large
          ? "large"
          : "",
        rank
          ? `rank-${rank}`
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {getAvatarInitials(
        name
      )}
    </div>
  );
}


/* ======================================================
   RANK BADGE
====================================================== */

function RankBadge({
  rank,
}) {
  if (rank <= 3) {
    return (
      <div
        className={`lb-rank-medal rank-${rank}`}
      >
        <Medal />

        <span>
          {rank}
        </span>
      </div>
    );
  }

  return (
    <span className="lb-normal-rank">
      {rank}
    </span>
  );
}