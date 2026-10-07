import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Pricing.css";

import { API_BASE } from "../config/api";

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

  // coupon: what the student typed, and the result for every plan
  const [couponInput, setCouponInput] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });
  const [coupon, setCoupon] = useState(null); // { code, label, quotes: { planId: quote } }

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
  // COUPON
  // The server checks the code for every plan and returns the new price.
  // ---------------------------------------------------
  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();

    setCouponMessage({ type: "", text: "" });

    if (!code) {
      setCouponMessage({ type: "error", text: "Enter a coupon code." });
      return;
    }

    const token = localStorage.getItem("dishaToken");

    if (!token) {
      setCouponMessage({
        type: "error",
        text: "Please log in to use a coupon code.",
      });
      return;
    }

    setCouponApplying(true);

    try {
      const results = await Promise.all(
        plans.map(async (plan) => {
          const response = await fetch(
            `${API_BASE}/api/subscription/coupon/validate`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ planId: plan.id, code }),
            }
          );

          const data = await response.json().catch(() => ({}));

          if (response.status === 401) return { plan, unauthorized: true };
          if (response.status === 429) return { plan, error: data.error };

          return response.ok && data.success
            ? { plan, quote: data.quote, label: data.coupon?.label }
            : { plan, error: data.error || "This coupon code is not valid." };
        })
      );

      if (results.some((r) => r.unauthorized)) {
        localStorage.removeItem("dishaToken");
        navigate("/login");
        return;
      }

      const quotes = {};
      let label = "";

      results.forEach((r) => {
        if (r.quote) {
          quotes[r.plan.id] = r.quote;
          label = label || r.label || "";
        }
      });

      if (Object.keys(quotes).length === 0) {
        // nothing works: show the reason from the server
        setCoupon(null);
        setCouponMessage({
          type: "error",
          text: results[0]?.error || "This coupon code is not valid.",
        });
        return;
      }

      const skipped = results.filter((r) => !r.quote).length;

      setCoupon({ code, label, quotes });
      setCouponInput(code);
      setCouponMessage({
        type: "ok",
        text:
          `Coupon ${code} applied${label ? ` (${label})` : ""}.` +
          (skipped > 0 ? " It does not work on every plan." : ""),
      });
    } catch (err) {
      console.error("Coupon error:", err);
      setCouponMessage({
        type: "error",
        text: "Unable to check the coupon. Please try again.",
      });
    } finally {
      setCouponApplying(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMessage({ type: "", text: "" });
  }

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
      const orderResponse = await fetch(
        `${API_BASE}/api/subscription/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planId: plan.id,
            // only when the coupon works on this plan
            couponCode: coupon?.quotes[plan.id] ? coupon.code : undefined,
          }),
        }
      );

      const order = await orderResponse.json().catch(() => ({}));

      if (orderResponse.status === 401) {
        localStorage.removeItem("dishaToken");
        navigate("/login");
        return;
      }

      if (!orderResponse.ok || !order.success) {
        if (order.couponError) removeCoupon();

        throw new Error(order.error || "Unable to start payment.");
      }

      // price came to Rs 0 (free plan or 100% coupon): already activated
      if (order.free) {
        setSubscription(order.subscription || null);
        removeCoupon();
        setMessage(
          `🎉 ${plan.name} subscription activated. Enjoy unlimited mock tests!`
        );
        setBuyingPlanId("");
        return;
      }

      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error(
          "Razorpay failed to load. Please check your internet connection."
        );
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
            removeCoupon();
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

      {!plansLoading && !plansError && plans.length > 0 && (
        <div className="pricing-coupon">
          {coupon ? (
            <div className="pricing-coupon-on">
              <span>
                <strong>{coupon.code}</strong> applied
                {coupon.label ? ` · ${coupon.label}` : ""}
              </span>

              <button type="button" onClick={removeCoupon}>
                Remove
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCoupon();
              }}
            >
              <input
                value={couponInput}
                onChange={(e) =>
                  setCouponInput(e.target.value.toUpperCase().replace(/\s/g, ""))
                }
                placeholder="Have a coupon code?"
                maxLength={20}
                aria-label="Coupon code"
                autoCapitalize="characters"
              />

              <button type="submit" disabled={couponApplying}>
                {couponApplying ? "Checking..." : "Apply"}
              </button>
            </form>
          )}

          {couponMessage.text && (
            <p className={`pricing-coupon-msg ${couponMessage.type}`}>
              {couponMessage.text}
            </p>
          )}
        </div>
      )}

      {!plansLoading && !plansError && (
        <div className="pricing-grid">
          {plans.map((plan) => {
            const quote = coupon?.quotes[plan.id];

            // price the student will pay, and the price to cross out
            const shown = quote ? quote.finalPrice : plan.finalPrice;
            const crossed = shown < plan.price ? plan.price : null;
            const perMonth = Math.round(
              shown / Math.max(plan.days / 30, 1)
            );

            const offerText = plan.offer
              ? plan.offer.label || "Special offer"
              : "";

            return (
              <div
                key={plan.id}
                className={`pricing-card ${plan.badge ? "featured" : ""}`}
              >
                {plan.badge && (
                  <span className="pricing-badge">{plan.badge}</span>
                )}

                <h2>{plan.name}</h2>

                {offerText && (
                  <span className="pricing-offer">{offerText}</span>
                )}

                {crossed !== null && (
                  <div className="pricing-was">₹{crossed}</div>
                )}

                <div className="pricing-price">
                  {shown === 0 ? (
                    "Free"
                  ) : (
                    <>
                      <span className="pricing-rupee">₹</span>
                      {shown}
                    </>
                  )}
                </div>

                <div className="pricing-permonth">
                  {shown === 0 ? "No payment needed" : `₹${perMonth} / month`}
                </div>

                {quote && quote.couponDiscount > 0 && (
                  <div className="pricing-coupon-line">
                    Coupon: −₹{quote.couponDiscount}
                  </div>
                )}

                {coupon && !quote && (
                  <div className="pricing-coupon-na">
                    Coupon not valid here
                  </div>
                )}

                <ul className="pricing-features">
                  {(plan.features && plan.features.length
                    ? plan.features
                    : [
                        "Access to all mock tests",
                        "Instant results and review",
                        `Valid for ${plan.days} days`,
                      ]
                  ).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="pricing-buy"
                  disabled={Boolean(buyingPlanId)}
                  onClick={() => handleBuy(plan)}
                >
                  {buyingPlanId === plan.id
                    ? shown === 0
                      ? "Activating..."
                      : "Opening payment..."
                    : shown === 0
                    ? "Activate Free"
                    : subscription
                    ? "Extend Plan"
                    : "Subscribe Now"}
                </button>
              </div>
            );
          })}
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