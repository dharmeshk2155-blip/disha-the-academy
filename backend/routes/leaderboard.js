import { useEffect, useState } from "react";
import "./ExtraPages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>🏆 Leaderboard</h1>
        <p>Top scorers across all mock tests.</p>
      </div>

      {loading && <div className="xp-status">Loading leaderboard...</div>}
      {error && <div className="xp-status xp-error">{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="xp-status">No test attempts yet. Be the first!</div>
      )}

      {rows.map((row, i) => (
        <div key={row.name + i} className="xp-leaderboard-row">
          <div className={`xp-rank ${i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""}`}>
            {i + 1}
          </div>
          <div className="xp-leaderboard-name">{row.name}</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>{row.testsTaken} tests</div>
          <div className="xp-leaderboard-score">{row.totalScore} pts</div>
        </div>
      ))}
    </div>
  );
}