import { useEffect, useState } from "react";
import "./ExtraPages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function MyResults() {
  const user = JSON.parse(localStorage.getItem("dishaUser") || "null");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setError("Please log in to see your results.");
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/tests/results/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>My Results</h1>
        <p>All your mock test attempts, most recent first.</p>
      </div>

      {loading && <div className="xp-status">Loading results...</div>}
      {error && <div className="xp-status xp-error">{error}</div>}

      {!loading && !error && results.length === 0 && (
        <div className="xp-status">You haven't attempted any mock tests yet.</div>
      )}

      {results.map((r) => (
        <div key={r.resultId} className="xp-card">
          <h3>{r.testTitle}</h3>
          <div className="xp-meta-row">
            <span>Correct: {r.correctCount} | Wrong: {r.wrongCount} | Unanswered: {r.unansweredCount}</span>
            <span className="xp-score-pill">Score: {r.score} / {r.totalMarks}</span>
          </div>
          <div className="xp-meta-row">
            <span>{new Date(r.submittedAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}