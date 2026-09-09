import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExamCategories.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function TestSeries() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/tests`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch tests");
        return res.json();
      })
      .then((data) => {
        // Group tests by their real exam category (e.g. "SSC CGL", "HP Police Constable")
        const map = {};
        data.forEach((t) => {
          if (!map[t.category]) {
            map[t.category] = { category: t.category, totalTests: 0, subjects: new Set() };
          }
          map[t.category].totalTests += 1;
          map[t.category].subjects.add(t.subject);
        });
        const list = Object.values(map).map((s) => ({
          ...s,
          subjects: Array.from(s.subjects),
        }));
        setSeries(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="ec-status">Loading test series...</div>;
  if (error) return <div className="ec-status ec-error">Error: {error}</div>;

  return (
    <div className="ec-page">
      <button className="ec-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="ec-header">
        <h1>Take a Mock Test</h1>
        <p>Choose a test series to start practicing.</p>
      </div>

      {series.length === 0 && (
        <div className="ec-status">No test series available right now.</div>
      )}

      <div className="ec-grid">
        {series.map((s) => (
          <div
            key={s.category}
            className="ec-card"
            onClick={() => navigate(`/take-mock-test/${encodeURIComponent(s.category)}`)}
          >
            <div className="ec-card-icon">📝</div>
            <div className="ec-card-info">
              <div className="ec-card-title">{s.category} Mock Test Series</div>
              <div className="ec-card-subtitle">
                {s.totalTests} {s.totalTests === 1 ? "Test" : "Tests"} · {s.subjects.join(", ")}
              </div>
            </div>
            <button className="ec-card-btn">View Test Series</button>
          </div>
        ))}
      </div>
    </div>
  );
}