import { useParams, useNavigate, Link } from "react-router-dom";
import { getCategory } from "../data/notesContent";
import "./NotesFlow.css";

export default function NoteCategory() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const category = getCategory(categorySlug);

  if (!category) {
    return (
      <div className="nf-page">
        <Link to="/notes" className="nf-back-link">← Back to Notes</Link>
        <div className="nf-status">Category not found.</div>
      </div>
    );
  }

  return (
    <div className="nf-page">
      <button className="nf-back-link" onClick={() => navigate("/notes")}>
        ← Back to Notes
      </button>

      <div className="nf-header">
        <h1>{category.title}</h1>
        <p>{category.subject} — choose a topic area below.</p>
      </div>

      <div className="nf-grid">
        {category.subcategories.map((sub) => {
          const availableCount = sub.topics.filter((t) => t.pdf).length;
          return (
            <div
              key={sub.slug}
              className="nf-card"
              onClick={() => navigate(`/notes/${category.slug}/${sub.slug}`)}
            >
              <div className="nf-card-icon">📄</div>
              <div className="nf-card-info">
                <div className="nf-card-title">{sub.title}</div>
                <div className="nf-card-subtitle">
                  {availableCount > 0
                    ? `${availableCount} note${availableCount > 1 ? "s" : ""} available`
                    : "Coming soon"}
                </div>
              </div>
              <button className="nf-card-btn">View</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}