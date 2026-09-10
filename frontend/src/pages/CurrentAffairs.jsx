import { useEffect, useState } from "react";
import "./ExtraPages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function CurrentAffairs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/current-affairs`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load current affairs");
        return res.json();
      })
      .then((data) => {
        setItems(data);
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
        <h1>Current Affairs</h1>
        <p>Daily updates relevant to competitive exam preparation.</p>
      </div>

      {loading && <div className="xp-status">Loading...</div>}
      {error && <div className="xp-status xp-error">Error: {error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="xp-status">No current affairs posted yet. Check back soon!</div>
      )}

      {items.map((item) => (
        <div key={item.id} className="xp-card">
          <h3>{item.title}</h3>
          <div className="xp-meta-row">
            <span>{item.date?.slice(0, 10)}</span>
          </div>
          <p>{item.summary}</p>
        </div>
      ))}
    </div>
  );
}