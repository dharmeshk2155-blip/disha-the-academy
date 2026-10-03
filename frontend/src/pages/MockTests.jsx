import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getExamGroup,
  getSubExam,
} from "../data/examTaxonomy";
import "./MockTests.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

function formatDuration(seconds) {
  const totalSeconds = Number(seconds) || 0;
  const mins = Math.floor(totalSeconds / 60);

  return `${mins} min`;
}

// kinds of test shown as tabs (order = tab order)
const CATEGORY_TABS = [
  { value: "full", label: "Full Tests" },
  { value: "sectional", label: "Sectional Tests" },
  { value: "previous_year", label: "Previous Year Tests" },
];

export default function MockTests() {
  const { topSlug, subSlug } = useParams();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const examGroup = getExamGroup(topSlug);
  const subExam = getSubExam(topSlug, subSlug);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTests() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/api/tests`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tests.");
        }

        const data = await response.json();

        const allTests = Array.isArray(data)
          ? data
          : Array.isArray(data.tests)
            ? data.tests
            : [];

        const filteredTests = allTests.filter((test) => {
          return (
            String(test.topCategory || "").toLowerCase() ===
              String(topSlug || "").toLowerCase() &&
            String(test.subExam || "").toLowerCase() ===
              String(subSlug || "").toLowerCase()
          );
        });

        setTests(filteredTests);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Mock tests loading error:", err);

        setError(
          err.message || "Unable to load mock tests."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTests();

    return () => {
      controller.abort();
    };
  }, [topSlug, subSlug]);

  if (!examGroup || !subExam) {
    return (
      <div className="mt-page">
        <button
          className="mt-back-btn"
          onClick={() => navigate("/take-mock-test")}
        >
          ← Back to Test Series
        </button>

        <div className="mt-status mt-error">
          Exam not found.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-page">
        <div className="mt-status">
          Loading mock tests...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-page">
        <button
          className="mt-back-btn"
          onClick={() =>
            navigate(`/take-mock-test/${topSlug}`)
          }
        >
          ← Back
        </button>

        <div className="mt-status mt-error">
          Error: {error}
        </div>
      </div>
    );
  }

  // old tests that have no category yet stay visible in an "Other" tab
  const categoryOf = (test) =>
    CATEGORY_TABS.some((c) => c.value === test.testCategory)
      ? test.testCategory
      : "other";

  const tabs = [
    ...CATEGORY_TABS,
    ...(tests.some((t) => categoryOf(t) === "other")
      ? [{ value: "other", label: "Other Tests" }]
      : []),
  ].map((tab) => ({
    ...tab,
    count: tests.filter((t) => categoryOf(t) === tab.value).length,
  }));

  // open the first tab that has tests, unless the student picked one
  const currentCategory =
    activeCategory ||
    tabs.find((tab) => tab.count > 0)?.value ||
    "full";

  const visibleTests = tests.filter(
    (t) => categoryOf(t) === currentCategory
  );

  return (
    <div className="mt-page">
      <button
        className="mt-back-btn"
        onClick={() =>
          navigate(`/take-mock-test/${topSlug}`)
        }
      >
        ← Back to {examGroup.title}
      </button>

      <div className="mt-header">
        <h1>{subExam.name} Mock Test Series</h1>

        <p>
          {tests.length}{" "}
          {tests.length === 1 ? "test" : "tests"} available.
          Choose one to start.
        </p>
      </div>

      {tests.length > 0 && (
        <div
          className="mt-tabs"
          role="tablist"
          aria-label="Test category"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={currentCategory === tab.value}
              className={`mt-tab ${
                currentCategory === tab.value ? "active" : ""
              }`}
              onClick={() => setActiveCategory(tab.value)}
            >
              {tab.label}
              <span className="mt-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {tests.length === 0 ? (
        <div className="mt-status">
          No mock tests available for {subExam.name} yet.
        </div>
      ) : visibleTests.length === 0 ? (
        <div className="mt-status">
          No tests in this category yet.
        </div>
      ) : (
        <div className="mt-grid">
          {visibleTests.map((test) => {
            const testId = test.id || test.testId;

            return (
              <div
                key={testId}
                className="mt-card"
              >
                <div className="mt-card-top">
                  <span className="mt-subject-badge">
                    {test.subject || "General"}
                  </span>

                  <span className="mt-questions-count">
                    {Number(test.totalQuestions) || 0} Qs
                  </span>
                </div>

                <h3 className="mt-card-title">
                  {test.title}
                </h3>

                <div className="mt-card-meta">
                  <span>
                    ⏱ {formatDuration(test.duration)}
                  </span>

                  <span>
                    +{Number(test.marksPerCorrect) || 0} / -
                    {Number(test.negativeMarking) || 0}
                  </span>
                </div>

                <button
                  className="mt-start-btn"
                  onClick={() =>
                    navigate(
                      `/mock-test/${encodeURIComponent(
                        testId
                      )}`
                    )
                  }
                >
                  Start Test
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}