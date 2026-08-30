import { useParams, Link } from "react-router-dom";

const notes = {
  1: {
    title: "HP General Knowledge",
    subject: "Himachal Pradesh GK",
    price: 49,
  },

  2: {
    title: "HP Police Constable",
    subject: "Complete Exam Preparation",
    price: 99,
  },

  3: {
    title: "Mathematics Notes",
    subject: "Quantitative Aptitude",
    price: 49,
  },

  4: {
    title: "Reasoning Notes",
    subject: "Verbal & Non-Verbal Reasoning",
    price: 49,
  },

  5: {
    title: "General Science",
    subject: "Physics, Chemistry & Biology",
    price: 59,
  },

  6: {
    title: "English Notes",
    subject: "Grammar & Vocabulary",
    price: 49,
  },

  7: {
    title: "Indian Polity",
    subject: "Constitution & Government",
    price: 59,
  },

  8: {
    title: "Current Affairs",
    subject: "Important Current Affairs",
    price: 39,
  },

  9: {
    title: "General Hindi",
    subject: "Hindi Grammar & Vocabulary",
    price: 49,
  },
};

function OrderSuccess() {
  const { id } = useParams();

  const note = notes[id];

  // Razorpay Order ID
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");

  // -----------------------------
  // NOTE NOT FOUND
  // -----------------------------

  if (!note) {
    return (
      <main className="success-page">
        <div className="success-card">
          <div className="success-icon">!</div>

          <h1>Order Not Found</h1>

          <p className="success-info">
            We could not find this note.
          </p>

          <Link to="/notes" className="success-button">
            ← Back to Notes
          </Link>
        </div>
      </main>
    );
  }

  // -----------------------------
  // SUCCESS PAGE
  // -----------------------------

  return (
    <main className="success-page">
      <div className="success-card">

        <div className="success-icon">
          ✓
        </div>

        <h1>Payment Successful!</h1>

        <p className="success-message">
          Thank you for your purchase.
        </p>

        {/* NOTE INFORMATION */}

        <div className="success-note">

          <h2>{note.title}</h2>

          <p>{note.subject}</p>

          <strong>
            ₹{note.price}
          </strong>

        </div>

        {/* PAYMENT MESSAGE */}

        <p className="success-info">
          Your payment has been successfully verified.
          You can now download your purchased PDF.
        </p>

        {/* DOWNLOAD */}

        {orderId ? (
          <a
            href={`http://localhost:5000/api/pdf/download/${encodeURIComponent(
              orderId
            )}`}
            className="success-button"
            target="_blank"
            rel="noopener noreferrer"
          >
            📥 Download Your PDF
          </a>
        ) : (
          <p className="success-info">
            Download link is not available.
          </p>
        )}

        <br />

        {/* BACK TO NOTES */}

        <Link
          to="/notes"
          className="success-button"
        >
          Continue Shopping
        </Link>

      </div>
    </main>
  );
}

export default OrderSuccess;