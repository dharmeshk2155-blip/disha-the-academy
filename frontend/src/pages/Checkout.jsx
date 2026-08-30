import { useNavigate, useParams, Link } from "react-router-dom";

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

function Checkout() {
  const navigate = useNavigate();
  const { id } = useParams();

  const note = notes[id];

  if (!note) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">
          <h1>Note Not Found</h1>

          <Link to="/notes" className="back-link">
            ← Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      <div className="checkout-container">

        {/* Back to Note */}
        <Link to={`/note/${id}`} className="back-link">
          ← Back to Note
        </Link>

        <h1>Checkout</h1>

        <p className="checkout-subtitle">
          Complete your details to continue
        </p>

        <div className="checkout-grid">

          {/* Customer Details */}
          <div className="checkout-form">

            <h2>Your Details</h2>

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
            />

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
            />

            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              placeholder="Enter your mobile number"
            />

            <button
              className="continue-button"
              type="button"
              onClick={() => navigate(`/payment/${id}`)}
            >
              Continue to Payment
            </button>

          </div>

          {/* Order Summary */}
          <div className="order-summary">

            <h2>Order Summary</h2>

            <div className="order-icon">
              📚
            </div>

            <h3>{note.title}</h3>

            <p>{note.subject}</p>

            <div className="summary-line">
              <span>Price</span>
              <strong>₹{note.price}</strong>
            </div>

            <div className="summary-line total-line">
              <span>Total</span>
              <strong>₹{note.price}</strong>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Checkout;