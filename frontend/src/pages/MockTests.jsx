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

export default function MockTests() {
  const { topSlug, subSlug } = useParams();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {tests.length === 0 ? (
        <div className="mt-status">
          No mock tests available for {subExam.name} yet.
        </div>
      ) : (
        <div className="mt-grid">
          {tests.map((test) => {
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