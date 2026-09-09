import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExamGroup, getSubExam } from "../data/examTaxonomy";
import "./ExamCategories.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ExamDetail() {
  const { topSlug, subSlug } = useParams();
  const navigate = useNavigate();
  const group = getExamGroup(topSlug);
  const subExam = getSubExam(topSlug, subSlug);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="ec-page">
        <button className="ec-back-btn" onClick={() => navigate("/take-mock-test")}>
          ← Back to Exams
        </button>
        <div className="ec-status">Exam not found.</div>
      </div>
    );
  }

  if (loading) {
    return <div className="ec-status">Loading...</div>;
  }

  if (error) {
    return <div className="ec-status ec-error">Error: {error}</div>;
  }

  // Group tests by their subject field into "sections"
  const sectionCounts = tests.reduce((acc, t) => {
    const key = t.subject || "General";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const sections = Object.entries(sectionCounts); // [ [name, count], ... ]

  return (
    <div className="ec-page">
      <button className="ec-back-btn" onClick={() => navigate("/take-mock-test")}>
        ← Back to Exams
      </button>

      <div className="ec-header">
        <h1>{group.icon} {subExam.name}</h1>
        <p>{group.title} · {tests.length} Total Tests</p>
      </div>

      {sections.length === 0 && (
        <div className="ec-status">
          No mock tests available for {subExam.name} yet. Check back soon!
        </div>
      )}

      <div className="ec-grid">
        {sections.map(([sectionName, count]) => (
          <div
            key={sectionName}
            className="ec-card"
            onClick={() =>
              navigate(`/take-mock-test/${topSlug}/${subSlug}/${encodeURIComponent(sectionName)}`)
            }
          >
            <div className="ec-card-icon">📄</div>
            <div className="ec-card-info">
              <div className="ec-card-title">{sectionName}</div>
              <div className="ec-card-subtitle">{count} Tests</div>
            </div>
            <button className="ec-card-btn">View Tests</button>
          </div>
        ))}
      </div>
    </div>
  );
}