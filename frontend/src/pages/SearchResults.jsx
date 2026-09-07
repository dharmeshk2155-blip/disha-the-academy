import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./ExtraPages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").toLowerCase().trim();

  const [notes, setNotes] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/notes`).then((r) => r.json()),
      fetch(`${API_BASE}/api/tests`).then((r) => r.json()),
    ])
      .then(([notesData, testsData]) => {
        setNotes(Array.isArray(notesData) ? notesData : []);
        setTests(Array.isArray(testsData) ? testsData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const matchedNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query) ||
      n.subject.toLowerCase().includes(query)
  );
  const matchedTests = tests.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      (t.category || "").toLowerCase().includes(query)
  );

  const totalResults = matchedNotes.length + matchedTests.length;

  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Search Results</h1>
        <p>{query ? `Showing results for "${query}"` : "Enter a search term above"}</p>
      </div>

      {loading && <div className="xp-status">Searching...</div>}

      {!loading && query && totalResults === 0 && (
        <div className="xp-status">No matching notes or tests found.</div>
      )}

      {matchedNotes.length > 0 && (
        <>
          <h3 style={{ color: "#0b1f4d", marginBottom: 12 }}>Notes</h3>
          {matchedNotes.map((n) => (
            <Link key={n.id} to={`/note/${n.id}`} style={{ textDecoration: "none" }}>
              <div className="xp-card">
                <h3>{n.title}</h3>
                <p>{n.subject}</p>
              </div>
            </Link>
          ))}
        </>
      )}

      {matchedTests.length > 0 && (
        <>
          <h3 style={{ color: "#0b1f4d", margin: "20px 0 12px" }}>Mock Tests</h3>
          {matchedTests.map((t) => (
            <Link key={t.id} to={`/mock-test/${t.id}`} style={{ textDecoration: "none" }}>
              <div className="xp-card">
                <h3>{t.title}</h3>
                <p>{t.subject} · {t.category}</p>
              </div>
            </Link>
          ))}
        </>
      )}
    </div>
  );
}