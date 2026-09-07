import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./TestAttempt.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const LANGUAGES = ["English", "Hindi"];

function formatTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h} : ${m} : ${s}`;
}

export default function TestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Instructions / pre-start screen
  const [testStarted, setTestStarted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [language, setLanguage] = useState("English");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startingTest, setStartingTest] = useState(false);

  const timerRef = useRef(null);

  // Fetch test data
  useEffect(() => {
    fetch(`${API_BASE}/api/tests/${testId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Test not found");
        return res.json();
      })
      .then((data) => {
        setTest(data);
        setTimeLeft(data.duration);
        const initialStatus = {};
        data.questions.forEach((q, i) => {
          initialStatus[q.id] = i === 0 ? "notAnswered" : "notVisited";
        });
        setStatus(initialStatus);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [testId]);

  const handleSubmit = useCallback(async () => {
    if (!test || submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const langParam = language === "Hindi" ? "hi" : "en";
      const res = await fetch(
        `${API_BASE}/api/tests/${testId}/submit?lang=${langParam}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        }
      );
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Failed to submit test. Please try again.");
      setSubmitting(false);
    }
  }, [test, testId, answers, submitting, language]);

  // Called when user clicks "Start Mock Test" - fetches questions in the chosen language
  async function handleStartTest() {
    setStartingTest(true);
    try {
      const langParam = language === "Hindi" ? "hi" : "en";
      const res = await fetch(
        `${API_BASE}/api/tests/${testId}?lang=${langParam}`
      );
      if (!res.ok) throw new Error("Failed to load test");
      const data = await res.json();
      setTest(data);
      const initialStatus = {};
      data.questions.forEach((q, i) => {
        initialStatus[q.id] = i === 0 ? "notAnswered" : "notVisited";
      });
      setStatus(initialStatus);
      setTestStarted(true);
    } catch (err) {
      alert("Failed to start test. Please try again.");
    } finally {
      setStartingTest(false);
    }
  }

  // Timer countdown - only runs once the test has actually started
  useEffect(() => {
    if (!test || result || !testStarted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [test, result, testStarted, handleSubmit]);

  if (loading) return <div className="ta-status">Loading test...</div>;
  if (error) return <div className="ta-status ta-error">Error: {error}</div>;

  // ---------- INSTRUCTIONS SCREEN (before test starts) ----------
  if (!testStarted && !result) {
    return (
      <div className="ta-instructions-page">
        <div className="ta-instructions-card">
          <h2>{test.title}</h2>
          <p className="ta-instructions-sub">
            {test.subject} &middot; {test.questions.length} Questions &middot;{" "}
            {Math.floor(test.duration / 60)} minutes
          </p>

          <h3>General Instructions</h3>
          <ul className="ta-instructions-list">
            <li>The test contains {test.questions.length} questions, to be answered in {Math.floor(test.duration / 60)} minutes.</li>
            <li>Each question has one correct answer. Select the option you think is correct.</li>
            <li>Correct answer: +{test.marksPerCorrect} mark(s). Wrong answer: -{test.negativeMarking} mark(s) (negative marking).</li>
            <li>Unanswered questions carry no marks, positive or negative.</li>
            <li>You can navigate between questions freely using the question palette, and change your answer any time before submitting.</li>
            <li>Use "Mark for Review & Next" to flag a question and come back to it later.</li>
            <li>The test will auto-submit when the timer reaches zero.</li>
            <li>Do not refresh or close the browser tab during the test.</li>
          </ul>

          <div className="ta-language-select">
            <label htmlFor="ta-language">Choose your language for this test:</label>
            <select
              id="ta-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <label className="ta-agree-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I have read and understood the instructions. I agree that I will not engage in
            any unfair practice and understand that the test may auto-submit when time runs out.
          </label>

          <button
            className="ta-btn ta-btn-primary ta-start-wide"
            disabled={!agreed || startingTest}
            onClick={handleStartTest}
          >
            {startingTest ? "Loading..." : "Start Mock Test"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- RESULT VIEW ----------
  if (result) {
    return (
      <div className="ta-result-page">
        <div className="ta-result-card">
          <h2>Test Submitted!</h2>
          <h3>{result.testTitle}</h3>
          <div className="ta-result-stats">
            <div className="ta-stat ta-stat-score">
              <span>{result.score}</span>
              <label>Score</label>
            </div>
            <div className="ta-stat ta-stat-correct">
              <span>{result.correctCount}</span>
              <label>Correct</label>
            </div>
            <div className="ta-stat ta-stat-wrong">
              <span>{result.wrongCount}</span>
              <label>Wrong</label>
            </div>
            <div className="ta-stat ta-stat-unanswered">
              <span>{result.unansweredCount}</span>
              <label>Unanswered</label>
            </div>
          </div>
          <button
            className="ta-btn ta-btn-primary"
            onClick={() => navigate("/take-mock-test")}
          >
            Back to Mock Tests
          </button>
        </div>

        <div className="ta-review-list">
          <h3>Answer Review</h3>
          {result.review.map((r, idx) => (
            <div key={r.questionId} className={`ta-review-item ta-review-${r.status}`}>
              <p className="ta-review-q">
                Q{idx + 1}. {r.question}
              </p>
              <div className="ta-review-options">
                {r.options.map((opt, i) => {
                  let cls = "ta-review-option";
                  if (i === r.correctAnswer) cls += " correct";
                  if (i === r.selected && i !== r.correctAnswer) cls += " wrong-selected";
                  return (
                    <div key={i} className={cls}>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {r.status === "unanswered" && (
                <p className="ta-review-tag">Not attempted</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- TEST TAKING VIEW ----------
  const currentQ = test.questions[currentIndex];
  const selectedOption = answers[currentQ.id];

  const counts = Object.values(status).reduce(
    (acc, s) => {
      if (s === "answered") acc.answered++;
      else if (s === "marked") acc.marked++;
      else if (s === "markedAnswered") acc.markedAnswered++;
      else if (s === "notAnswered") acc.notAnswered++;
      else acc.notVisited++;
      return acc;
    },
    { answered: 0, marked: 0, markedAnswered: 0, notAnswered: 0, notVisited: 0 }
  );

  function selectOption(optionIndex) {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }));
  }

  function goToQuestion(index) {
    setCurrentIndex(index);
    const q = test.questions[index];
    setStatus((prev) => {
      if (prev[q.id] === "notVisited") {
        return { ...prev, [q.id]: "notAnswered" };
      }
      return prev;
    });
  }

  function saveAndNext() {
    const hasAnswer = answers[currentQ.id] !== undefined;
    setStatus((prev) => ({
      ...prev,
      [currentQ.id]: hasAnswer ? "answered" : "notAnswered",
    }));
    if (currentIndex < test.questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  }

  function markForReviewAndNext() {
    const hasAnswer = answers[currentQ.id] !== undefined;
    setStatus((prev) => ({
      ...prev,
      [currentQ.id]: hasAnswer ? "markedAnswered" : "marked",
    }));
    if (currentIndex < test.questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  }

  function clearResponse() {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
    setStatus((prev) => ({ ...prev, [currentQ.id]: "notAnswered" }));
  }

  return (
    <div className="ta-page">
      <div className="ta-topbar">
        <div>
          <span className="ta-test-title">{test.title}</span>
          <span className="ta-lang-badge">{language}</span>
        </div>
        <div className="ta-timer">
          <span className="ta-timer-label">Time Left</span>
          <span className="ta-timer-value">{formatTime(timeLeft)}</span>
        </div>
        <button
          className="ta-btn ta-btn-danger"
          onClick={() => setShowConfirm(true)}
        >
          Submit Test
        </button>
      </div>

      <div className="ta-body">
        <div className="ta-main">
          <div className="ta-q-header">
            <span>Question No. {currentIndex + 1}</span>
            <div className="ta-marks">
              <span className="ta-mark-pos">+{test.marksPerCorrect}</span>
              <span className="ta-mark-neg">-{test.negativeMarking}</span>
            </div>
          </div>

          <p className="ta-q-text">{currentQ.question}</p>

          <div className="ta-options">
            {currentQ.options.map((opt, i) => (
              <label
                key={i}
                className={`ta-option ${selectedOption === i ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name={`q-${currentQ.id}`}
                  checked={selectedOption === i}
                  onChange={() => selectOption(i)}
                />
                {opt}
              </label>
            ))}
          </div>

          <div className="ta-actions">
            <button className="ta-btn ta-btn-outline" onClick={markForReviewAndNext}>
              Mark for Review &amp; Next
            </button>
            <button className="ta-btn ta-btn-outline" onClick={clearResponse}>
              Clear Response
            </button>
            <button className="ta-btn ta-btn-primary" onClick={saveAndNext}>
              Save &amp; Next
            </button>
          </div>
        </div>

        <div className="ta-sidebar">
          <div className="ta-status-summary">
            <div className="ta-status-row">
              <span className="ta-dot answered" /> Answered: {counts.answered + counts.markedAnswered}
            </div>
            <div className="ta-status-row">
              <span className="ta-dot marked" /> Marked: {counts.marked}
            </div>
            <div className="ta-status-row">
              <span className="ta-dot not-visited" /> Not Visited: {counts.notVisited}
            </div>
            <div className="ta-status-row">
              <span className="ta-dot not-answered" /> Not Answered: {counts.notAnswered}
            </div>
          </div>

          <h4 className="ta-section-label">Questions</h4>
          <div className="ta-q-grid">
            {test.questions.map((q, i) => (
              <button
                key={q.id}
                className={`ta-q-btn ${status[q.id] || "notVisited"} ${
                  i === currentIndex ? "current" : ""
                }`}
                onClick={() => goToQuestion(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            className="ta-btn ta-btn-danger ta-submit-wide"
            onClick={() => setShowConfirm(true)}
          >
            Submit Test
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="ta-modal-overlay">
          <div className="ta-modal">
            <h3>Submit Test?</h3>
            <p>
              Answered: {counts.answered + counts.markedAnswered} / {test.questions.length}
              <br />
              Not Answered: {counts.notAnswered + counts.notVisited}
            </p>
            <div className="ta-modal-actions">
              <button
                className="ta-btn ta-btn-outline"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="ta-btn ta-btn-primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}