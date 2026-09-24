import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { getTopicById } from "../data/notesContent";

function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);

  const found = getTopicById(id);

  let user = null;
  try {
    const savedUser = localStorage.getItem("dishaUser");
    if (savedUser) {
      user = JSON.parse(savedUser);
    }
  } catch (error) {
    console.error("User data error:", error);
  }

  if (!found) {
    return (
      <main className="payment-page">
        <div className="payment-card">
          <h1>Note Not Found</h1>
          <Link to="/notes" className="back-link">
            ← Back to Notes
          </Link>
        </div>
      </main>
    );
  }

  const { topic, subcategory, category } = found;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/payment/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed");
      }
      return data;
    } catch (error) {
      console.error("Verification error:", error);
      alert(error.message || "Payment verification failed.");
      setLoading(false);
      return null;
    }
  };

  const handlePayment = async () => {
    if (!method) {
      alert("Please select a payment method");
      return;
    }

    try {
      setLoading(true);

      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        alert("Razorpay failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/payment/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            noteId: Number(id),
            userId: user?.id,
          }),
        }
      );

      const order = await response.json();

      if (!response.ok || !order.success) {
        throw new Error(order.error || "Failed to create payment order");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Disha The Academy",
        description: topic.title,
        order_id: order.id,
        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
          contact: user?.mobile || "",
        },
        theme: { color: "#2563eb" },
        handler: async function (paymentResponse) {
          const result = await verifyPayment(paymentResponse);
          if (result && result.success) {
            navigate(`/order-success/${id}?orderId=${paymentResponse.razorpay_order_id}`);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        console.error("PAYMENT FAILED:", response.error);
        alert(response.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.message || "Unable to start payment.");
      setLoading(false);
    }
  };

  return (
    <main className="payment-page">
      <Link to={`/checkout/${id}`} className="back-link">
        ← Back to Checkout
      </Link>

      <section className="payment-header">
        <h1>Payment</h1>
        <p>Choose your preferred payment method</p>
      </section>

      <div className="payment-container">
        <div className="payment-card">
          <h2>Payment Method</h2>

          <button
            type="button"
            className={`payment-option ${method === "upi" ? "selected" : ""}`}
            onClick={() => setMethod("upi")}
          >
            📱 UPI
          </button>

          <button
            type="button"
            className={`payment-option ${method === "card" ? "selected" : ""}`}
            onClick={() => setMethod("card")}
          >
            💳 Debit / Credit Card
          </button>

          <button
            type="button"
            className={`payment-option ${method === "netbanking" ? "selected" : ""}`}
            onClick={() => setMethod("netbanking")}
          >
            🏦 Net Banking
          </button>
        </div>

        <div className="payment-summary">
          <h2>Order Summary</h2>

          <div className="order-icon">📚</div>

          <h3>{topic.title}</h3>
          <p>{category.title} · {subcategory.title}</p>

          <div className="payment-total">
            <span>Total Amount</span>
            <strong>₹{topic.price}</strong>
          </div>

          <button
            className="pay-button"
            type="button"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Processing..." : `Pay ₹${topic.price}`}
          </button>
        </div>
      </div>
    </main>
  );
}

export default Payment;