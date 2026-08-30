import { Link } from "react-router-dom";

const notes = [
  {
    id: 1,
    title: "HP General Knowledge",
    subject: "Himachal Pradesh GK",
    description: "Important Himachal Pradesh General Knowledge notes.",
    price: 49,
  },

  {
    id: 2,
    title: "HP Police Constable",
    subject: "Complete Exam Preparation",
    description: "Important study material for HP Police Constable exam.",
    price: 99,
  },

  {
    id: 3,
    title: "Mathematics Notes",
    subject: "Quantitative Aptitude",
    description: "Important formulas, concepts and mathematics practice.",
    price: 49,
  },

  {
    id: 4,
    title: "Reasoning Notes",
    subject: "Verbal & Non-Verbal Reasoning",
    description: "Reasoning concepts, tricks and important questions.",
    price: 49,
  },

  {
    id: 5,
    title: "General Science",
    subject: "Physics, Chemistry & Biology",
    description: "Important Physics, Chemistry and Biology notes.",
    price: 59,
  },

  {
    id: 6,
    title: "English Notes",
    subject: "Grammar & Vocabulary",
    description: "English grammar, vocabulary and important topics.",
    price: 49,
  },

  {
    id: 7,
    title: "Indian Polity",
    subject: "Constitution & Government",
    description: "Indian Constitution, Government and Polity notes.",
    price: 59,
  },

  {
    id: 8,
    title: "Current Affairs",
    subject: "Important Current Affairs",
    description: "Important current affairs for competitive exams.",
    price: 39,
  },

  {
    id: 9,
    title: "General Hindi",
    subject: "Hindi Grammar & Vocabulary",
    description: "Hindi grammar, vocabulary and important topics.",
    price: 49,
  },
];

function Notes() {
  return (
    <main className="notes-page">

      {/* HEADER */}

      <section className="notes-header">

        <h1>Study Notes</h1>

        <p>
          Quality study material for competitive exam preparation
        </p>

      </section>


      {/* NOTES GRID */}

      <section className="notes-grid">

        {notes.map((note) => (

          <div
            className="note-card"
            key={note.id}
          >

            {/* ICON */}

            <div className="note-icon">
              📚
            </div>


            {/* CONTENT */}

            <div className="note-content">

              <h2>
                {note.title}
              </h2>

              <p className="note-subject">
                {note.subject}
              </p>

              <p className="note-description">
                {note.description}
              </p>


              {/* PRICE */}

              <div className="note-price">
                ₹{note.price}
              </div>


              {/* VIEW BUTTON */}

              <Link
                to={`/note/${note.id}`}
                className="note-button"
              >
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