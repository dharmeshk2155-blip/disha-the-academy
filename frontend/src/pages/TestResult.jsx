import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

import { API_BASE } from "../config/api";
import useGoBack from "../hooks/useGoBack";

import "./TestResult.css";

const LETTERS = ["A", "B", "C", "D"];

// 38 -> "00:38",  125 -> "02:05",  null -> "—"
function clock(seconds) {
  if (seconds === null || seconds === undefined) return "—";

  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");

  return `${m}:${s}`;
}

const num = (n) => (Number.isInteger(n) ? n : Number(n).toFixed(2));

async function getJson(path) {
  const token = localStorage.getItem("dishaToken");

  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || "Could not load this page."
    );
  }

  return data;
}

/*
  TEST RESULT   (/test-result/:resultId   and   /results/:resultId)
    Overview      score, rank, accuracy, comparison with topper
    Solutions     question by question, with explanation
    Leaderboard   this test only, FIRST attempts only (side panel)

  Rank / percentile / topper / leaderboard always use the student's FIRST
  attempt. A student can re-attempt a test, but that never changes the rank.
*/
export default function TestResult() {
  const { resultId } = useParams();
  const goBack = useGoBack("/my-results");

  const [data, setData] = useState(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("overview"); // overview | solutions | leaderboard

  // solutions view
  const [filter, setFilter] = useState("all");
  const [position, setPosition] = useState(0);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      setTab("overview");
      setPosition(0);
      setFilter("all");

      try {
        const result = await getJson(`/api/tests/result/${resultId}`);

        if (!alive) return;

        setData(result);

        // the leaderboard is a nice-to-have: the page works without it
        getJson(`/api/tests/${encodeURIComponent(result.test.testId)}/leaderboard`)
          .then((b) => alive && setBoard(b))
          .catch(() => alive && setBoard({ failed: true }));
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [resultId]);

  const solutions = data?.solutions || [];

  const counts = useMemo(() => {
    const c = { all: solutions.length, correct: 0, wrong: 0, unanswered: 0 };

    solutions.forEach((s) => {
      if (c[s.status] !== undefined) c[s.status] += 1;
    });

    return c;
  }, [solutions]);

  const shown = useMemo(
    () =>
      filter === "all"
        ? solutions
        : solutions.filter((s) => s.status === filter),
    [solutions, filter]
  );

  // the scrolling question panel goes back to the top for every question
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0 });
  }, [position, filter, lang]);

  // keyboard: left / right arrow = previous / next question
  useEffect(() => {
    if (tab !== "solutions") return undefined;

    function onKey(event) {
      if (event.target.matches?.("input, select, textarea")) return;

      if (event.key === "ArrowRight") {
        setPosition((p) => Math.min(shown.length - 1, p + 1));
      } else if (event.key === "ArrowLeft") {
        setPosition((p) => Math.max(0, p - 1));
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, shown.length]);

  if (loading) {
    return (
      <div className="tr-page">
        <div className="tr-status">Loading your result…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="tr-page">
        <button type="button" className="tr-back" onClick={goBack}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="tr-status tr-error">
          {error || "Result not found."}
        </div>

        <div className="tr-center">
          <Link to="/my-results" className="tr-btn">
            Go to My Results
          </Link>
        </div>
      </div>
    );
  }

  const { test, attempt, comparison, bilingual } = data;

  // the OFFICIAL result is the first attempt; fall back to this attempt
  const official = data.official || {
    ...attempt,
    rank: null,
    totalParticipants: 0,
    percentile: null,
  };

  const reattemptPath = test.isFree
    ? `/free-tests/attempt/${test.testId}`
    : `/mock-test/${test.testId}`;

  const durationMin = Math.round((test.durationSeconds || 0) / 60);

  const current = shown[Math.min(position, shown.length - 1)];

  function pickFilter(next) {
    setFilter(next);
    setPosition(0);
  }

  /* ---------------- one solution ---------------- */

  function renderSolution(q) {
    const hindi = lang === "hi" && q.question.hi;
    const text = hindi ? q.question.hi : q.question.en;
    const options =
      hindi && q.options.hi.some(Boolean) ? q.options.hi : q.options.en;

    const explanation = hindi
      ? q.explanation.hi || q.explanation.en
      : q.explanation.en || q.explanation.hi;

    const marks =
      q.status === "correct"
        ? `+${num(test.marksPerCorrect)}`
        : q.status === "wrong"
          ? `-${num(test.negativeMarking)}`
          : "0";

    const correctLetter = LETTERS[q.correctAnswer - 1];
    const correctText = options[q.correctAnswer - 1];

    return (
      <article className="tr-q">
        <header className="tr-q-head">
          <div className="tr-q-title">
            <span className="tr-q-no">{q.number}</span>

            <strong>
              Question {q.number}
              <small> of {test.totalQuestions}</small>
            </strong>
          </div>

          <div className="tr-chips">
            <span className={`tr-chip tr-chip-${q.status}`}>
              {q.status === "correct"
                ? "Correct"
                : q.status === "wrong"
                  ? "Incorrect"
                  : "Not attempted"}
            </span>

            <span className="tr-pill">Marks {marks}</span>

            {q.timeSpent !== null && (
              <span className="tr-pill">Time {clock(q.timeSpent)}</span>
            )}

            {q.percentCorrect !== null && (
              <span className="tr-pill tr-pill-green">
                {num(q.percentCorrect)}% answered correctly
              </span>
            )}
          </div>
        </header>

        <p className="tr-q-text" lang={hindi ? "hi" : "en"}>
          {text}
        </p>

        <ul className="tr-options" lang={hindi ? "hi" : "en"}>
          {options.map((option, i) => {
            const number = i + 1;
            const isRight = number === q.correctAnswer;
            const isMine = number === q.selected;

            const cls = isRight
              ? "tr-opt tr-opt-right"
              : isMine
                ? "tr-opt tr-opt-wrong"
                : "tr-opt";

            return (
              <li key={number} className={cls}>
                <span className="tr-opt-mark">
                  {isRight ? (
                    <Check size={16} strokeWidth={3} />
                  ) : isMine ? (
                    <X size={16} strokeWidth={3} />
                  ) : (
                    LETTERS[i]
                  )}
                </span>

                <span className="tr-opt-text">{option}</span>

                {isMine && <em className="tr-opt-tag">Your answer</em>}

                {isRight && !isMine && (
                  <em className="tr-opt-tag">Correct answer</em>
                )}
              </li>
            );
          })}
        </ul>

        {q.status === "unanswered" && (
          <p className="tr-unattempted">You did not attempt this question.</p>
        )}

        <section className="tr-solution">
          <h4>Solution</h4>

          <p className="tr-answer-line">
            Correct answer: <b>Option {correctLetter}</b>
            {correctText ? ` — ${correctText}` : ""}
          </p>

          {explanation ? (
            <p className="tr-explain" lang={hindi ? "hi" : "en"}>
              {explanation}
            </p>
          ) : (
            <p className="tr-muted">
              A written explanation has not been added for this question yet.
            </p>
          )}
        </section>
      </article>
    );
  }

  /* ---------------- leaderboard (side panel) ---------------- */

  function renderBoardRow(entry, key) {
    return (
      <li
        key={key}
        className={`tr-lb-row ${entry.isMe ? "tr-lb-me" : ""}`}
      >
        <span className="tr-lb-rank">#{entry.rank}</span>

        <span className="tr-lb-avatar" aria-hidden="true">
          {(entry.name || "S").trim().charAt(0).toUpperCase()}
        </span>

        <span className="tr-lb-name">
          {entry.name}
          {entry.isMe && <b> (You)</b>}
        </span>

        <span className="tr-lb-score">
          {num(entry.score)}
          <small>/{num(entry.totalMarks)}</small>
        </span>
      </li>
    );
  }

  const leaderboard = (
    <aside
      className={`tr-side ${tab === "leaderboard" ? "tr-side-open" : ""}`}
    >
      <div className="tr-card">
        <h3>Leaderboard</h3>
        <p className="tr-muted tr-small">
          This test only. Rank counts each student&apos;s first attempt.
        </p>

        {!board && <p className="tr-muted">Loading…</p>}

        {board?.failed && (
          <p className="tr-muted">Leaderboard could not be loaded.</p>
        )}

        {board && !board.failed && (
          <>
            <p className="tr-lb-summary">
              {board.myRank ? (
                <>
                  Your rank <b>#{board.myRank}</b> of{" "}
                  {board.totalParticipants}
                </>
              ) : (
                <>{board.totalParticipants} students</>
              )}
            </p>

            {board.entries.length === 0 ? (
              <p className="tr-muted">No one is on the leaderboard yet.</p>
            ) : (
              <ol className="tr-lb">
                {board.entries.map((e) => renderBoardRow(e, e.rank))}

                {board.me && (
                  <>
                    <li className="tr-lb-gap" aria-hidden="true">
                      …
                    </li>
                    {renderBoardRow(board.me, "me")}
                  </>
                )}
              </ol>
            )}
          </>
        )}
      </div>
    </aside>
  );

  /* ---------------------- page ---------------------- */

  const fit = tab === "solutions";

  return (
    <div className={`tr-page ${fit ? "tr-fit" : ""}`}>
      <header className="tr-top">
        <button type="button" className="tr-back" onClick={goBack}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="tr-top-title">
          <h1>{test.title}</h1>
          <p>
            Attempt {attempt.attemptNumber}
            {attempt.totalAttempts > 1 && ` of ${attempt.totalAttempts}`}
          </p>
        </div>

        <div className="tr-top-actions">
          <Link to={reattemptPath} className="tr-btn tr-btn-primary">
            Reattempt Test
          </Link>
          <Link to="/mock-tests" className="tr-btn">
            Go to Tests
          </Link>
        </div>
      </header>

      <nav className="tr-tabs" role="tablist" aria-label="Result sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "overview"}
          className={tab === "overview" ? "on" : ""}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === "solutions"}
          className={tab === "solutions" ? "on" : ""}
          onClick={() => setTab("solutions")}
        >
          Solutions
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === "leaderboard"}
          className={`tr-tab-phone ${tab === "leaderboard" ? "on" : ""}`}
          onClick={() => setTab("leaderboard")}
        >
          Leaderboard
        </button>
      </nav>

      <div className={`tr-layout ${fit ? "tr-layout-solo" : ""}`}>
        <main className={`tr-main ${tab === "leaderboard" ? "tr-main-hide" : ""}`}>
          {/* ================= OVERVIEW ================= */}
          {tab === "overview" && (
            <>
              {!attempt.isFirstAttempt ? (
                <div className="tr-note tr-note-warn">
                  <p>
                    This is <b>attempt {attempt.attemptNumber}</b>. Your rank,
                    percentile and the leaderboard use your{" "}
                    <b>first attempt</b>, so this attempt does not change them.
                  </p>
                  <p>
                    This attempt: <b>{num(attempt.score)}</b> /{" "}
                    {num(attempt.totalMarks)} · {attempt.correct} correct ·{" "}
                    {attempt.wrong} wrong
                  </p>
                  <Link
                    to={`/test-result/${attempt.firstResultId}`}
                    className="tr-link"
                  >
                    View first attempt result <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="tr-note">
                  Only your first attempt counts for rank. You can reattempt
                  this test any time to practise.
                </div>
              )}

              <section className="tr-section">
                <h2>Overall Performance Summary</h2>

                <div className="tr-stats">
                  <div className="tr-stat">
                    <strong>
                      {official.rank ?? "—"}
                      {official.totalParticipants > 0 && (
                        <small> / {official.totalParticipants}</small>
                      )}
                    </strong>
                    <span>Rank</span>
                  </div>

                  <div className="tr-stat">
                    <strong>
                      {num(official.score)}
                      <small> / {num(official.totalMarks)}</small>
                    </strong>
                    <span>Score</span>
                  </div>

                  <div className="tr-stat">
                    <strong>
                      {official.attempted}
                      <small> / {test.totalQuestions}</small>
                    </strong>
                    <span>Attempted</span>
                  </div>

                  <div className="tr-stat">
                    <strong>
                      {num(official.accuracy)}
                      <small>%</small>
                    </strong>
                    <span>Accuracy</span>
                  </div>

                  <div className="tr-stat">
                    <strong>
                      {official.percentile === null
                        ? "—"
                        : num(official.percentile)}
                      <small>%</small>
                    </strong>
                    <span>Percentile</span>
                  </div>
                </div>
              </section>

              <section className="tr-section">
                <h2>Sectional Summary</h2>

                <div className="tr-scroll">
                  <table className="tr-table">
                    <thead>
                      <tr>
                        <th>Section</th>
                        <th>Score</th>
                        <th>Attempted</th>
                        <th>Accuracy</th>
                        <th>Time</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>{test.subject || "Test"}</td>
                        <td>
                          {num(official.score)}
                          <small> / {num(official.totalMarks)}</small>
                        </td>
                        <td>
                          {official.attempted}
                          <small> / {test.totalQuestions}</small>
                        </td>
                        <td>{num(official.accuracy)}%</td>
                        <td>
                          {clock(official.timeTakenSeconds)}
                          <small> / {durationMin} min</small>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="tr-section">
                <h2>Compare with topper</h2>

                <div className="tr-scroll">
                  <table className="tr-table">
                    <thead>
                      <tr>
                        <th />
                        <th>Score</th>
                        <th>Accuracy</th>
                        <th>Correct</th>
                        <th>Wrong</th>
                        <th>Time</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr className="tr-row-you">
                        <td>You</td>
                        <td>{num(official.score)}</td>
                        <td>{num(official.accuracy)}%</td>
                        <td>{official.correct}</td>
                        <td>{official.wrong}</td>
                        <td>{clock(official.timeTakenSeconds)}</td>
                      </tr>

                      {comparison.topper && (
                        <tr>
                          <td>Topper</td>
                          <td>{num(comparison.topper.score)}</td>
                          <td>{num(comparison.topper.accuracy)}%</td>
                          <td>{comparison.topper.correct}</td>
                          <td>{comparison.topper.wrong}</td>
                          <td>{clock(comparison.topper.timeTakenSeconds)}</td>
                        </tr>
                      )}

                      {comparison.average && (
                        <tr>
                          <td>Average</td>
                          <td>{num(comparison.average.score)}</td>
                          <td>{num(comparison.average.accuracy)}%</td>
                          <td>{num(comparison.average.correct)}</td>
                          <td>{num(comparison.average.wrong)}</td>
                          <td>{clock(comparison.average.timeTakenSeconds)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="tr-center">
                <button
                  type="button"
                  className="tr-btn tr-btn-primary"
                  onClick={() => setTab("solutions")}
                >
                  View Solutions <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ================= SOLUTIONS ================= */}
          {tab === "solutions" && (
            <section className="tr-sol">
              {solutions.length === 0 ? (
                <div className="tr-status">
                  Solutions are not available for this result.
                </div>
              ) : (
                <>
                  <div className="tr-sol-bar">
                    <div className="tr-filters" role="group" aria-label="Filter questions">
                      {[
                        ["all", "All", counts.all],
                        ["correct", "Correct", counts.correct],
                        ["wrong", "Incorrect", counts.wrong],
                        ["unanswered", "Skipped", counts.unanswered],
                      ].map(([value, label, count]) => (
                        <button
                          key={value}
                          type="button"
                          className={`tr-filter tr-filter-${value} ${
                            filter === value ? "on" : ""
                          }`}
                          onClick={() => pickFilter(value)}
                        >
                          {value !== "all" && <i className="tr-fdot" />}
                          {label}
                          <b>{count}</b>
                        </button>
                      ))}
                    </div>

                    {bilingual && (
                      <div className="tr-seg" role="group" aria-label="Language">
                        <button
                          type="button"
                          className={lang === "en" ? "on" : ""}
                          onClick={() => setLang("en")}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          className={lang === "hi" ? "on" : ""}
                          onClick={() => setLang("hi")}
                        >
                          हिन्दी
                        </button>
                      </div>
                    )}
                  </div>

                  {shown.length === 0 ? (
                    <div className="tr-status">
                      No questions in this filter.
                    </div>
                  ) : (
                    <div className="tr-sol-grid">
                      <div className="tr-sol-main">
                        <div className="tr-q-scroll" ref={scrollRef}>
                          {current && renderSolution(current)}
                        </div>

                        <div className="tr-pager">
                          <button
                            type="button"
                            className="tr-btn"
                            onClick={() => setPosition((p) => Math.max(0, p - 1))}
                            disabled={position <= 0}
                          >
                            <ArrowLeft size={16} /> Previous
                          </button>

                          <span className="tr-pager-count">
                            {Math.min(position, shown.length - 1) + 1} of{" "}
                            {shown.length}
                          </span>

                          <button
                            type="button"
                            className="tr-btn tr-btn-primary"
                            onClick={() =>
                              setPosition((p) =>
                                Math.min(shown.length - 1, p + 1)
                              )
                            }
                            disabled={position >= shown.length - 1}
                          >
                            Next <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>

                      <aside className="tr-palette">
                        <h4>Question palette</h4>

                        <div className="tr-pal-grid">
                          {shown.map((q, i) => (
                            <button
                              key={q.questionId}
                              type="button"
                              className={`tr-pal tr-pal-${q.status} ${
                                i === position ? "tr-pal-now" : ""
                              }`}
                              onClick={() => setPosition(i)}
                              aria-label={`Question ${q.number}`}
                              aria-current={i === position}
                            >
                              {q.number}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="tr-btn tr-palette-back"
                          onClick={() => setTab("overview")}
                        >
                          Back to Overview
                        </button>
                      </aside>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </main>

        {!fit && leaderboard}
      </div>
    </div>
  );
}