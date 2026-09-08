import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ExtraPages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("dishaUser") || "null");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/api/tests/results/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const testsTaken = results.length;
  const avgScore =
    testsTaken > 0
      ? (results.reduce((sum, r) => sum + r.score, 0) / testsTaken).toFixed(1)
      : "0";
  const bestScore =
    testsTaken > 0 ? Math.max(...results.map((r) => r.score)) : "0";

  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Welcome back{user ? `, ${user.fullName}` : ""} 👋</h1>
        <p>Here's a quick look at your learning progress.</p>
      </div>

      {loading ? (
        <div className="xp-status">Loading your dashboard...</div>
      ) : (
        <>
          <div className="xp-dash-grid">
            <div className="xp-stat-card">
              <div className="xp-stat-value">{testsTaken}</div>
              <div className="xp-stat-label">Tests Taken</div>
            </div>
            <div className="xp-stat-card">
              <div className="xp-stat-value">{avgScore}</div>
              <div className="xp-stat-label">Average Score</div>
            </div>
            <div className="xp-stat-card">
              <div className="xp-stat-value">{bestScore}</div>
              <div className="xp-stat-label">Best Score</div>
            </div>
          </div>

          <div className="xp-quick-links">
            <Link to="/my-results" className="xp-quick-link">My Results</Link>
            <Link to="/take-mock-test" className="xp-quick-link">Take a Mock Test</Link>
            <Link to="/notes" className="xp-quick-link">Browse Notes</Link>
            <Link to="/leaderboard" className="xp-quick-link">Leaderboard</Link>
          </div>

          {testsTaken === 0 && (
            <div className="xp-status">
              You haven't taken any mock tests yet.{" "}
              <Link to="/take-mock-test">Start your first test →</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}   