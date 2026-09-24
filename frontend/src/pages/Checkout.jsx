import { useNavigate, useParams, Link } from "react-router-dom";
import { getTopicById } from "../data/notesContent";

function Checkout() {
  const navigate = useNavigate();
  const { id } = useParams();

  const found = getTopicById(id);

  if (!found) {
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

  const { topic, subcategory, category } = found;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <Link to={`/note/${id}`} className="back-link">
          ← Back to Note
        </Link>

        <h1>Checkout</h1>
        <p className="checkout-subtitle">Complete your details to continue</p>

        <div className="checkout-grid">
          <div className="checkout-form">
            <h2>Your Details</h2>

            <label>Full Name</label>
            <input type="text" placeholder="Enter your full name" />

            <label>Email Address</label>
            <input type="email" placeholder="Enter your email" />

            <label>Mobile Number</label>
            <input type="tel" placeholder="Enter your mobile number" />

            <button
              className="continue-button"
              type="button"
              onClick={() => navigate(`/payment/${id}`)}
            >
              Continue to Payment
            </button>
          </div>

          <div className="order-summary">
            <h2>Order Summary</h2>

            <div className="order-icon">📚</div>

            <h3>{topic.title}</h3>
            <p>{category.title} · {subcategory.title}</p>

            <div className="summary-line">
              <span>Price</span>
              <strong>₹{topic.price}</strong>
            </div>

            <div className="summary-line total-line">
              <span>Total</span>
              <strong>₹{topic.price}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;