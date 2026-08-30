import { useParams, Link } from "react-router-dom";

const notes = {
  1: {
    title: "HP General Knowledge",
    subject: "Himachal Pradesh GK",
    price: 49,
    description:
      "Complete Himachal Pradesh General Knowledge notes for competitive exam preparation.",
    topics: [
      "Himachal Pradesh History",
      "Himachal Pradesh Geography",
      "HP Polity",
      "HP Current Affairs",
      "Important MCQs",
    ],
  },

  2: {
    title: "HP Police Constable",
    subject: "Complete Exam Preparation",
    price: 99,
    description:
      "Complete study material for HP Police Constable examination preparation.",
    topics: [
      "General Knowledge",
      "General Science",
      "Mathematics",
      "Reasoning",
      "Current Affairs",
    ],
  },

  3: {
    title: "Mathematics Notes",
    subject: "Quantitative Aptitude",
    price: 49,
    description:
      "Important mathematics concepts, formulas and practice questions.",
    topics: [
      "Percentage",
      "Profit & Loss",
      "Ratio & Proportion",
      "Average",
      "Time & Work",
    ],
  },

  4: {
    title: "Reasoning Notes",
    subject: "Verbal & Non-Verbal Reasoning",
    price: 49,
    description:
      "Important reasoning concepts and practice questions for competitive exams.",
    topics: [
      "Analogy",
      "Series",
      "Coding-Decoding",
      "Blood Relations",
      "Direction Test",
    ],
  },

  5: {
    title: "General Science",
    subject: "Physics, Chemistry & Biology",
    price: 59,
    description:
      "Important science notes covering Physics, Chemistry and Biology.",
    topics: [
      "Physics",
      "Chemistry",
      "Biology",
      "Human Body",
      "Important Science MCQs",
    ],
  },

  6: {
    title: "English Notes",
    subject: "Grammar & Vocabulary",
    price: 49,
    description:
      "Useful English grammar and vocabulary notes for competitive exams.",
    topics: [
      "Parts of Speech",
      "Tenses",
      "Articles",
      "Prepositions",
      "Vocabulary",
    ],
  },

  7: {
    title: "Indian Polity",
    subject: "Constitution & Government",
    price: 59,
    description:
      "Important Indian Polity concepts for competitive examination preparation.",
    topics: [
      "Indian Constitution",
      "Fundamental Rights",
      "Parliament",
      "President",
      "Supreme Court",
    ],
  },

  8: {
    title: "Current Affairs",
    subject: "Important Current Affairs",
    price: 39,
    description:
      "Important current affairs and general awareness topics.",
    topics: [
      "National Affairs",
      "International Affairs",
      "Sports",
      "Awards",
      "Important Events",
    ],
  },

  9: {
    title: "General Hindi",
    subject: "Hindi Grammar & Vocabulary",
    price: 49,
    description:
      "Important Hindi grammar and vocabulary notes for competitive exams.",
    topics: [
      "संधि",
      "समास",
      "पर्यायवाची शब्द",
      "विलोम शब्द",
      "मुहावरे",
    ],
  },
};

function NoteDetails() {
  const { id } = useParams();

  const note = notes[id];

  if (!note) {
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

  return (
    <div className="note-details-page">

      <div className="details-card">

        <Link to="/notes" className="back-link">
          ← Back to Notes
        </Link>

        <div className="details-icon">
          📚
        </div>

        <span className="details-badge">
          PDF Notes
        </span>

        <h1>{note.title}</h1>

        <p className="details-subject">
          {note.subject}
        </p>

        <p className="details-description">
          {note.description}
        </p>

        <div className="details-content">

          <h2>What you will get</h2>

          <ul>
            {note.topics.map((topic, index) => (
              <li key={index}>
                ✓ {topic}
              </li>
            ))}
          </ul>

        </div>

        <div className="purchase-box">

          <div>
            <span className="price-label">
              Price
            </span>

            <div className="details-price">
              ₹{note.price}
            </div>
          </div>

         <Link
  to={`/checkout/${id}`}
  className="buy-button"
>
  Buy Now
</Link>

        </div>

      </div>

    </div>
  );
}

export default NoteDetails;