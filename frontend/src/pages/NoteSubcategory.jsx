import { useParams, useNavigate, Link } from "react-router-dom";
import { getCategory, getSubcategory } from "../data/notesContent";
import "./NotesFlow.css";

export default function NoteSubcategory() {
  const { categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();
  const category = getCategory(categorySlug);
  const sub = getSubcategory(categorySlug, subcategorySlug);

  if (!category || !sub) {
    return (
      <div className="nf-page">
        <Link to="/notes" className="nf-back-link">← Back to Notes</Link>
        <div className="nf-status">Not found.</div>
      </div>
    );
  }

  return (
    <div className="nf-page">
      <button
        className="nf-back-link"
        onClick={() => navigate(`/notes/${category.slug}`)}
      >
        ← Back to {category.title}
      </button>

      <div className="nf-header">
        <h1>{sub.title}</h1>
        <p>{category.title}</p>
      </div>

      <div className="nf-topic-list">
        {sub.topics.map((topic) => (
          <div key={topic.id} className="nf-topic-row">
            <div className="nf-topic-icon">📚</div>
            <div className="nf-topic-info">
              <div className="nf-topic-title">{topic.title}</div>
              {!topic.pdf && (
                <span className="nf-coming-soon-tag">Coming soon</span>
              )}
            </div>
            {topic.pdf ? (
              <>
                <div className="nf-topic-price">₹{topic.price}</div>
                <Link to={`/note/${topic.id}`} className="nf-topic-btn">
                  View Notes →
                </Link>
              </>
            ) : (
              <button className="nf-topic-btn disabled" disabled>
                Not available yet
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}