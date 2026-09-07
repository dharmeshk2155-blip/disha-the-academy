import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExamCategories.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ExamCategories() {
  const [categories, setCategories] = useState([]);
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
        const map = {};
        data.forEach((t) => {
          if (!map[t.category]) map[t.category] = 0;
          map[t.category]++;
        });
        const list = Object.entries(map).map(([category, count]) => ({
          category,
          count,
        }));
        setCategories(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="ec-status">Loading exams...</div>;
  if (error) return <div className="ec-status ec-error">Error: {error}</div>;

  return (
    <div className="ec-page">
        <button className="ec-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="ec-header">
          <h1>Take a Mock Test</h1>
          <p>Choose an exam category to see available mock tests.</p>
        </div>

        {categories.length === 0 && (
          <div className="ec-status">No exam categories available right now.</div>
        )}

        <div className="ec-grid">
          {categories.map((c) => (
            <button
              key={c.category}
              className="ec-card"
              onClick={() =>
                navigate(`/take-mock-test/${encodeURIComponent(c.category)}`)
              }
            >
              <span className="ec-card-title">{c.category}</span>
              <span className="ec-card-count">
                {c.count} {c.count === 1 ? "test" : "tests"} available
              </span>
              <span className="ec-card-arrow">→</span>
            </button>
          ))}
        </div>
    </div>
  );
}