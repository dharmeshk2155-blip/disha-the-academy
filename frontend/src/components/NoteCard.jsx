import { Link } from "react-router-dom";

function NoteCard({ id, title, subject, price }) {
  return (
    <div className="note-card">
      <div className="note-icon">
        📚
      </div>

      <h3>{title}</h3>

      <p>{subject}</p>

      <div className="note-bottom">
        <span className="note-price">₹{price}</span>

        <Link
          to={`/note/${id}`}
          className="note-btn"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default NoteCard;