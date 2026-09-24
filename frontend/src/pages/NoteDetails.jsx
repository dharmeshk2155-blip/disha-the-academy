import { useParams, Link } from "react-router-dom";
import { getTopicById } from "../data/notesContent";

function NoteDetails() {
  const { id } = useParams();
  const found = getTopicById(id);

  if (!found) {
    return (
      <div className="note-details-page">
        <div className="details-card">
          <h1>Note Not Found</h1>
          <Link to="/notes" className="back-button">
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  const { topic, subcategory, category } = found;

  return (
    <div className="note-details-page">
      <div className="details-card">
        <Link
          to={`/notes/${category.slug}/${subcategory.slug}`}
          className="back-link"
        >
          ← Back to {subcategory.title}
        </Link>

        <div className="details-icon">📚</div>

        <span className="details-badge">PDF Notes</span>

        <h1>{topic.title}</h1>

        <p className="details-subject">
          {category.title} · {subcategory.title}
        </p>

        <p className="details-description">
          {category.description}
        </p>

        {topic.pdf ? (
          <div className="purchase-box">
            <div>
              <span className="price-label">Price</span>
              <div className="details-price">₹{topic.price}</div>
            </div>

            <Link to={`/checkout/${topic.id}`} className="buy-button">
              Buy Now
            </Link>
          </div>
        ) : (
          <div className="purchase-box">
            <div>
              <span className="price-label">Status</span>
              <div className="details-price" style={{ fontSize: 18 }}>
                Coming Soon
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteDetails;