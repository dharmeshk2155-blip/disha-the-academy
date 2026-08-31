import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";

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

function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);

  const note = notes[id];

  if (!note) {
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

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const response = await fetch(
        "https://disha-the-academy.onrender.com/api/payment/verify",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            razorpay_order_id:
              paymentResponse.razorpay_order_id,

            razorpay_payment_id:
              paymentResponse.razorpay_payment_id,

            razorpay_signature:
              paymentResponse.razorpay_signature,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Payment verification failed"
        );
      }

      return data;
    } catch (error) {
      console.error(
        "Verification error:",
        error
      );

      alert(
        "Payment verification failed. Please contact support."
      );

      setLoading(false);

      return null;
    }
  };

  const handlePayment = async () => {
    if (!method) {
      alert(
        "Please select a payment method"
      );
      return;
    }

    try {
      setLoading(true);

      const razorpayLoaded =
        await loadRazorpay();

      if (!razorpayLoaded) {
        alert(
          "Razorpay failed to load. Please check your internet connection."
        );

        setLoading(false);
        return;
      }

      // Create order
      const response = await fetch(
        "https://disha-the-academy.onrender.com/api/payment/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

       body: JSON.stringify({
  noteId: Number(id),
}),
        }
      );

      const order = await response.json();

      if (!response.ok) {
        throw new Error(
          order.error ||
            "Failed to create order"
        );
      }

      const options = {
        key:
          import.meta.env
            .VITE_RAZORPAY_KEY_ID,

        amount: order.amount,

        currency: order.currency,

        name: "Disha The Academy",

        description: note.title,

        order_id: order.id,

        handler: async function (
          paymentResponse
        ) {
          console.log(
            "Razorpay payment response:",
            paymentResponse
          );

          const result =
            await verifyPayment(
              paymentResponse
            );

          if (
            result &&
            result.success
          ) {
            navigate(
              `/order-success/${id}?orderId=${paymentResponse.razorpay_order_id}`
            );
          }
        },

        prefill: {
          name: "",
          email: "",
          contact: "",
        },

        theme: {
          color: "#2563eb",
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Payment failed:",
            response.error
          );

          alert(
            response.error?.description ||
              "Payment failed. Please try again."
          );

          setLoading(false);
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      alert(
        error.message ||
          "Unable to start payment. Please try again."
      );

      setLoading(false);
    }
  };

  return (
    <main className="payment-page">

      <Link
        to={`/checkout/${id}`}
        className="back-link"
      >
        ← Back to Checkout
      </Link>

      <section className="payment-header">
        <h1>Payment</h1>

        <p>
          Choose your preferred payment method
        </p>
      </section>

      <div className="payment-container">

        <div className="payment-card">

          <h2>Payment Method</h2>

          <button
            type="button"
            className={`payment-option ${
              method === "upi"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setMethod("upi")
            }
          >
            📱 UPI
          </button>

          <button
            type="button"
            className={`payment-option ${
              method === "card"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setMethod("card")
            }
          >
            💳 Debit / Credit Card
          </button>

          <button
            type="button"
            className={`payment-option ${
              method === "netbanking"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setMethod(
                "netbanking"
              )
            }
          >
            🏦 Net Banking
          </button>

        </div>

        <div className="payment-summary">

          <h2>Order Summary</h2>

          <div className="order-icon">
            📚
          </div>

          <h3>{note.title}</h3>

          <p>{note.subject}</p>

          <div className="payment-total">

            <span>
              Total Amount
            </span>

            <strong>
              ₹{note.price}
            </strong>

          </div>

          <button
            className="pay-button"
            type="button"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : `Pay ₹${note.price}`}
          </button>

        </div>

      </div>

    </main>
  );
}

export default Payment;