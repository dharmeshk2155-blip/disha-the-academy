import { useParams, Link } from "react-router-dom";

// ======================================================
// LIVE BACKEND
// ======================================================

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

// ======================================================
// NOTES
// ======================================================

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

// ======================================================
// ORDER SUCCESS
// ======================================================

function OrderSuccess() {
  const { id } = useParams();

  const note = notes[id];

  // ====================================================
  // GET RAZORPAY ORDER ID FROM URL
  // ====================================================

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");

  // ====================================================
  // CREATE DOWNLOAD URL
  // ====================================================

  const downloadUrl = orderId
    ? `${API_BASE}/api/pdf/download/${encodeURIComponent(orderId)}`
    : null;

  // ====================================================
  // NOTE NOT FOUND
  // ====================================================

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

  // ====================================================
  // SUCCESS PAGE
  // ====================================================

  return (
    <main className="success-page">
      <div className="success-card">

        {/* SUCCESS ICON */}

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

        {/* DOWNLOAD BUTTON */}

        {downloadUrl ? (
          <a
            href={downloadUrl}
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

        {/* CONTINUE SHOPPING */}

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