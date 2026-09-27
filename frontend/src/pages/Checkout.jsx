import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getTopicById } from "../data/notesContent";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

function Checkout() {
  const navigate = useNavigate();
  const { id } = useParams();

  const found = getTopicById(id);

  let loggedInUser = null;

  try {
    const savedUser = localStorage.getItem("dishaUser");

    if (savedUser) {
      loggedInUser = JSON.parse(savedUser);
    }
  } catch (error) {
    console.error("User data error:", error);
  }

  const [fullName, setFullName] = useState(
    loggedInUser?.fullName || ""
  );
  const [email, setEmail] = useState(
    loggedInUser?.email || ""
  );
  const [mobile, setMobile] = useState(
    loggedInUser?.mobile || ""
  );

  const [loading, setLoading] = useState(false);

  const [settingsLoading, setSettingsLoading] =
    useState(true);

  const [notesSalesEnabled, setNotesSalesEnabled] =
    useState(true);

  // =====================================================
  // LOAD WEBSITE SETTINGS
  // =====================================================

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/settings`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load website settings"
          );
        }

        const data = await response.json();

        if (data.success && data.settings) {
          setNotesSalesEnabled(
            Boolean(
              data.settings.notesSalesEnabled
            )
          );
        }
      } catch (error) {
        console.error(
          "Checkout settings error:",
          error
        );

        // Backend still performs the final security check.
        // We keep checkout available if settings API
        // temporarily fails.
        setNotesSalesEnabled(true);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // =====================================================
  // NOTE NOT FOUND
  // =====================================================

  if (!found) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">
          <h1>Note Not Found</h1>

          <Link
            to="/notes"
            className="back-link"
          >
            ← Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  const {
    topic,
    subcategory,
    category,
  } = found;

  // =====================================================
  // LOAD RAZORPAY
  // =====================================================

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () =>
        resolve(true);

      script.onerror = () =>
        resolve(false);

      document.body.appendChild(script);
    });
  };

  // =====================================================
  // VERIFY PAYMENT
  // =====================================================

  const verifyPayment = async (
    paymentResponse
  ) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/payment/verify`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
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

      if (
        !response.ok ||
        !data.success
      ) {
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
        error.message ||
          "Payment verification failed."
      );

      setLoading(false);

      return null;
    }
  };

  // =====================================================
  // PROCEED TO PAYMENT
  // =====================================================

  const handleProceedToPay = async () => {
    if (!notesSalesEnabled) {
      alert(
        "Notes purchasing is temporarily unavailable. Please try again later."
      );
      return;
    }

    if (
      !fullName.trim() ||
      !email.trim() ||
      !mobile.trim()
    ) {
      alert(
        "Please fill in your name, email and mobile number"
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

      const response = await fetch(
        `${API_BASE}/api/payment/create-order`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            noteId: Number(id),
            userId: loggedInUser?.id,
          }),
        }
      );

      const order =
        await response.json();

      if (
        !response.ok ||
        !order.success
      ) {
        if (
          order.code ===
          "NOTES_SALES_DISABLED"
        ) {
          setNotesSalesEnabled(false);
        }

        throw new Error(
          order.error ||
            "Failed to create payment order"
        );
      }

      const options = {
        key:
          import.meta.env
            .VITE_RAZORPAY_KEY_ID,

        amount: order.amount,

        currency: order.currency,

        name: "Disha The Academy",

        description: topic.title,

        order_id: order.id,

        prefill: {
          name: fullName,
          email: email,
          contact: mobile,
        },

        theme: {
          color: "#2563eb",
        },

        handler: async function (
          paymentResponse
        ) {
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

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "PAYMENT FAILED:",
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
          "Unable to start payment."
      );

      setLoading(false);
    }
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <Link
          to={`/note/${id}`}
          className="back-link"
        >
          ← Back to Note
        </Link>

        <h1>Checkout</h1>

        <p className="checkout-subtitle">
          Complete your details to continue
        </p>

        {/* SALES DISABLED MESSAGE */}

        {!settingsLoading &&
          !notesSalesEnabled && (
            <div
              style={{
                marginBottom: "22px",
                padding: "18px 20px",
                border:
                  "1px solid #f0d58a",
                borderRadius: "12px",
                background: "#fff8e5",
                color: "#7c5b08",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "16px",
                }}
              >
                Purchasing Temporarily
                Unavailable
              </strong>

              <span
                style={{
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Notes purchasing is
                currently paused. Please
                check back later.
              </span>
            </div>
          )}

        <div className="checkout-grid">
          <div className="checkout-form">
            <h2>Your Details</h2>

            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) =>
                setFullName(
                  e.target.value
                )
              }
            />

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />

            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={mobile}
              onChange={(e) =>
                setMobile(
                  e.target.value
                )
              }
            />

            <button
              className="continue-button"
              type="button"
              onClick={
                handleProceedToPay
              }
              disabled={
                loading ||
                settingsLoading ||
                !notesSalesEnabled
              }
            >
              {settingsLoading
                ? "Checking availability..."
                : !notesSalesEnabled
                ? "Purchasing Unavailable"
                : loading
                ? "Processing..."
                : `Proceed to Pay ₹${topic.price}`}
            </button>
          </div>

          <div className="order-summary">
            <h2>Order Summary</h2>

            <div className="order-icon">
              📚
            </div>

            <h3>{topic.title}</h3>

            <p>
              {category.title} ·{" "}
              {subcategory.title}
            </p>

            <div className="summary-line">
              <span>Price</span>

              <strong>
                ₹{topic.price}
              </strong>
            </div>

            <div className="summary-line total-line">
              <span>Total</span>

              <strong>
                ₹{topic.price}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;