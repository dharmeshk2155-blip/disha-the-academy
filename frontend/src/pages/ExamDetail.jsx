import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExamGroup, getSubExam } from "../data/examTaxonomy";
import "./ExamDetail.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ExamDetail() {
  const { topSlug, subSlug } = useParams();
  const navigate = useNavigate();
  const group = getExamGroup(topSlug);
  const subExam = getSubExam(topSlug, subSlug);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState("mock"); // "mock" | "pyp"

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/tests`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch tests");
        return res.json();
      })
      .then((data) => {
        const filtered = data.filter(
          (t) => t.topCategory === topSlug && t.subExam === subSlug
        );
        setTests(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [topSlug, subSlug]);

  if (!group || !subExam) {
    return (
      <div className="ed-page">
        <button className="ed-back-btn" onClick={() => navigate("/take-mock-test")}>
          ← Back to Exams
        </button>
        <div className="ed-status">Exam not found.</div>
      </div>
    );
  }

  if (loading) {
    return <div className="ed-status">Loading...</div>;
  }

  if (error) {
    return <div className="ed-status ed-error">Error: {error}</div>;
  }

  // PYPs need a dedicated field on the test record (e.g. testType === "pyp").
  // Until that field exists in the backend, "Mock Tests" shows everything
  // and "PYPs" shows an empty state rather than guessing.
  const mockTests = tests.filter((t) => t.testType !== "pyp");
  const pypTests = tests.filter((t) => t.testType === "pyp");
  const visibleTests = activeType === "mock" ? mockTests : pypTests;

  // Group the visible tests by subject into tabbed sections
  const sectionCounts = visibleTests.reduce((acc, t) => {
    const key = t.subject || "General";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const sections = Object.entries(sectionCounts);

  return (
    <div className="ed-page">
      <button className="ed-back-btn" onClick={() => navigate("/take-mock-test")}>
        ← Back to Exams
      </button>

      <div className="ed-header">
        <h1>{group.icon} {subExam.name}</h1>
        <p>{group.title} · {tests.length} Total Tests</p>
      </div>

      {/* Mock Tests / PYPs pill toggle */}
      <div className="ed-type-toggle">
        <button
          className={`ed-type-pill ${activeType === "mock" ? "active" : ""}`}
          onClick={() => setActiveType("mock")}
        >
          Mock Tests
        </button>
        <button
          className={`ed-type-pill ${activeType === "pyp" ? "active" : ""}`}
          onClick={() => setActiveType("pyp")}
        >
          PYPs
        </button>
      </div>

      {/* Section tabs */}
      {sections.length > 0 ? (
        <div className="ed-tabs-bar">
          <div className="ed-tabs-scroll">
            {sections.map(([sectionName, count]) => (
              <button
                key={sectionName}
                className="ed-tab-item"
                onClick={() =>
                  navigate(
                    `/take-mock-test/${topSlug}/${subSlug}/${encodeURIComponent(sectionName)}`
                  )
                }
              >
                {sectionName}({count})
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="ed-status">
          {activeType === "pyp"
            ? "No previous year papers available yet."
            : "No mock tests available for this exam yet. Check back soon!"}
        </div>
      )}
    </div>
  );
}