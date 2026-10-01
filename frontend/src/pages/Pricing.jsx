import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Pricing.css";

// Baaki pages jaisa hi (frontend/.env me VITE_API_BASE se badal sakte ho)
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Pricing() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");

  const [subscription, setSubscription] = useState(null);
  const [buyingPlanId, setBuyingPlanId] = useState("");
  const [message, setMessage] = useState("");

  // ---------------------------------------------------
  // LOAD PLANS (price + per month backend se aata hai)
  // ---------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();

    async function loadPlans() {
      try {
        setPlansLoading(true);
        setPlansError("");

        const response = await fetch(`${API_BASE}/api/subscription/plans`, {
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !Array.isArray(data.plans)) {
          throw new Error(
            `Unable to load plans (status ${response.status}). ` +
              `Check that the backend at ${API_BASE} is running and has the /api/subscription route.`
          );
        }

        setPlans(data.plans);
      } catch (err) {
        if (err.name === "AbortError") return;
        setPlansError(
          err.message === "Failed to fetch"
            ? `Unable to reach the backend at ${API_BASE}. Is it running?`
            : err.message || "Unable to load plans."
        );
      } finally {
        setPlansLoading(false);
      }
    }

    loadPlans();

    return () => controller.abort();
  }, []);

  // ---------------------------------------------------
  // LOAD MY SUBSCRIPTION
  // ---------------------------------------------------
  async function loadMySubscription() {
    const token = localStorage.getItem("dishaToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/subscription/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.active) {
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Subscription status error:", err);
    }
  }

  useEffect(() => {
    loadMySubscription();
  }, []);

  // ---------------------------------------------------
  // BUY PLAN
  // ---------------------------------------------------
  async function handleBuy(plan) {
    setMessage("");

    const token = localStorage.getItem("dishaToken");

    if (!token) {
      navigate("/login");
      return;
    }

    setBuyingPlanId(plan.id);

    try {
      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error(
          "Razorpay failed to load. Please check your internet connection."
        );
      }

      const orderResponse = await fetch(
        `${API_BASE}/api/subscription/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planId: plan.id }),
        }
      );

      const order = await orderResponse.json().catch(() => ({}));

      if (orderResponse.status === 401) {
        localStorage.removeItem("dishaToken");
        navigate("/login");
        return;
      }

      if (!orderResponse.ok || !order.success) {
        throw new Error(order.error || "Unable to start payment.");
      }

      let user = null;

      try {
        user = JSON.parse(localStorage.getItem("dishaUser") || "null");
      } catch {
        user = null;
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Disha The Academy",
        description: `Subscription - ${plan.name}`,
        order_id: order.id,

        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
          contact: user?.mobile || "",
        },

        notes: { planId: plan.id },
        theme: { color: "#071a49" },

        handler: async function (paymentResponse) {
          try {
            const verifyResponse = await fetch(
              `${API_BASE}/api/subscription/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                }),
              }
            );

            const result = await verifyResponse.json().catch(() => ({}));

            if (!verifyResponse.ok || !result.success) {
              throw new Error(
                result.error ||
                  "Payment done but verification failed. Please contact support."
              );
            }

            setSubscription(result.subscription || null);
            setMessage(
              `🎉 ${plan.name} subscription activated. Enjoy unlimited mock tests!`
            );
          } catch (err) {
            setMessage(err.message);
          } finally {
            setBuyingPlanId("");
          }
        },

        modal: {
          ondismiss: function () {
            setBuyingPlanId("");
          },
        },
      });

      razorpay.on("payment.failed", function (response) {
        setMessage(
          response?.error?.description ||
            "Payment failed. Please try again."
        );
        setBuyingPlanId("");
      });

      razorpay.open();
    } catch (err) {
      console.error("Subscription payment error:", err);
      setMessage(err.message || "Unable to start payment.");
      setBuyingPlanId("");
    }
  }

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div className="pricing-page">
      <header className="pricing-hero">
        <span className="pricing-eyebrow">SUBSCRIPTION</span>

        <h1>Unlimited Mock Tests, One Simple Price</h1>

        <p>
          Subscribe once and attempt all mock tests as many times as you
          want. Choose a plan that fits your exam preparation.
        </p>
      </header>

      {subscription && (
        <div className="pricing-active">
          ✅ Your <strong>{subscription.planName}</strong> plan is active till{" "}
          <strong>{formatDate(subscription.expiresAt)}</strong> (
          {subscription.daysLeft} day
          {subscription.daysLeft === 1 ? "" : "s"} left). Buying again
          extends your plan.
        </div>
      )}

      {message && <div className="pricing-message">{message}</div>}

      {plansLoading && (
        <p className="pricing-status">Loading plans...</p>
      )}

      {plansError && (
        <p className="pricing-status pricing-error">{plansError}</p>
      )}

      {!plansLoading && !plansError && (
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.badge ? "featured" : ""}`}
            >
              {plan.badge && (
                <span className="pricing-badge">{plan.badge}</span>
              )}

              <h2>{plan.name}</h2>

              <div className="pricing-price">
                <span className="pricing-rupee">₹</span>
                {plan.price}
              </div>

              <div className="pricing-permonth">
                ₹{plan.perMonth} / month
              </div>

              <ul className="pricing-features">
                <li>Access to all mock tests</li>
                <li>Instant results and review</li>
                <li>Valid for {plan.days} days</li>
              </ul>

              <button
                type="button"
                className="pricing-buy"
                disabled={Boolean(buyingPlanId)}
                onClick={() => handleBuy(plan)}
              >
                {buyingPlanId === plan.id
                  ? "Opening payment..."
                  : subscription
                  ? "Extend Plan"
                  : "Subscribe Now"}
              </button>
            </div>
          ))}
        </div>
      )}

      <section className="pricing-note">
        <h3>What is not included?</h3>

        <p>
          <strong>Notes</strong> are not part of the subscription and are
          sold separately. <strong>Current Affairs</strong> and{" "}
          <strong>Blog</strong> are free for everyone.
        </p>

        <p>
          Have questions? See our{" "}
          <Link to="/refund-policy">Refund Policy</Link> or{" "}
          <Link to="/contact">contact us</Link>.
        </p>
      </section>
    </div>
  );
}