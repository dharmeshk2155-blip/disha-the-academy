import { Link } from "react-router-dom";
import { NOTE_CATEGORIES } from "../data/notesContent";

function Notes() {
  return (
    <main className="notes-page">
      <section className="notes-header">
        <h1>Study Notes</h1>
        <p>Quality study material for competitive exam preparation</p>
      </section>

      <section className="notes-grid">
        {NOTE_CATEGORIES.map((category) => (
          <div className="note-card" key={category.slug}>
            <div className="note-icon">📚</div>

            <div className="note-content">
              <h2>{category.title}</h2>
              <p className="note-subject">{category.subject}</p>
              <p className="note-description">{category.description}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
              <Link to={`/notes/${category.slug}`} className="note-button">
                View Notes →
              </Link>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default Notes;