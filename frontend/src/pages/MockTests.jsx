import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExamGroup, getSubExam } from "../data/examTaxonomy";
import "./MockTests.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

export default function MockTests() {
  const { topSlug, subSlug, section } = useParams();
  const group = getExamGroup(topSlug);
  const subExam = getSubExam(topSlug, subSlug);
  const sectionName = section ? decodeURIComponent(section) : null;

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/tests`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch tests");
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter((t) => {
          const matchesExam = t.topCategory === topSlug && t.subExam === subSlug;
          const matchesSection = sectionName
            ? (t.subject || "General") === sectionName
            : true;
          return matchesExam && matchesSection;
        });
        setTests(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [topSlug, subSlug, sectionName]);

  const pageTitle = sectionName || (subExam ? subExam.name : subSlug);
  const backLabel = subExam ? `← Back to ${subExam.name}` : "← Back";

  if (loading) {
    return <div className="mt-status">Loading mock tests...</div>;
  }

  if (error) {
    return <div className="mt-status mt-error">Error: {error}</div>;
  }

  return (
    <div className="mt-page">
      <button
        className="mt-back-btn"
        onClick={() => navigate(`/take-mock-test/${topSlug}/${subSlug}`)}
      >
        {backLabel}
      </button>

      <div className="mt-header">
        <h1>{pageTitle}</h1>
        <p>Choose a test below and start practicing.</p>
      </div>

      {tests.length === 0 && (
        <div className="mt-status">
          No mock tests available here yet. Check back soon!
        </div>
      )}

      <div className="mt-grid">
        {tests.map((test) => (
          <div key={test.id} className="mt-card">
            <div className="mt-card-top">
              <span className="mt-subject-badge">{test.subject}</span>
              <span className="mt-questions-count">
                {test.totalQuestions} Qs
              </span>
            </div>
            <h3 className="mt-card-title">{test.title}</h3>
            <div className="mt-card-meta">
              <span>⏱ {formatDuration(test.duration)}</span>
              <span>+{test.marksPerCorrect} / -{test.negativeMarking}</span>
            </div>
            <button
              className="mt-start-btn"
              onClick={() => navigate(`/mock-test/${test.id}`)}
            >
              Start Test
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}