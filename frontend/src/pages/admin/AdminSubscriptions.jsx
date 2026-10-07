import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Copy, Pencil, Plus, Trash2, X } from "lucide-react";

import { API_BASE } from "../../config/api";

import "./AdminSubscriptions.css";

const TABS = [
  ["plans", "Plans"],
  ["coupons", "Coupons"],
  ["subscribers", "Subscribers"],
];

const EMPTY_PLAN = {
  planId: "",
  name: "",
  price: "",
  days: "",
  badge: "",
  description: "",
  features: "",
  sortOrder: "0",
  isActive: true,
  offerEnabled: false,
  offerType: "percent",
  offerValue: "",
  offerLabel: "",
  offerStart: "",
  offerEnd: "",
};

const EMPTY_COUPON = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  maxDiscount: "",
  minAmount: "",
  planIds: [],
  startsAt: "",
  expiresAt: "",
  usageLimit: "0",
  perUserLimit: "1",
  allowWithOffer: true,
  isActive: true,
};

const STATUS_LABEL = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  off: "Switched off",
  "used-up": "Used up",
};

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ISO date -> value for <input type="datetime-local">
function toLocalInput(value) {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fromLocalInput = (value) =>
  value ? new Date(value).toISOString() : null;

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// the price after an offer (same rule as the server)
function priceAfterOffer(price, type, value) {
  const base = Math.max(0, Math.round(Number(price) || 0));
  const v = Number(value) || 0;

  if (v <= 0) return base;

  const off = type === "flat" ? v : Math.round((base * v) / 100);

  return base - Math.min(Math.round(off), base);
}

function offerState(offer) {
  if (!offer || !offer.enabled) return "";

  const now = Date.now();

  if (offer.startsAt && new Date(offer.startsAt).getTime() > now) {
    return "scheduled";
  }

  if (offer.endsAt && new Date(offer.endsAt).getTime() < now) return "ended";

  return "running";
}

function randomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";

  for (let i = 0; i < 8; i += 1) {
    out += letters[Math.floor(Math.random() * letters.length)];
  }

  return out;
}

/*
  ADMIN > SUBSCRIPTIONS
    Plans        create, edit, switch on/off, delete, run an offer
    Coupons      codes that take money off at checkout
    Subscribers  who bought what, and with which coupon
*/
export default function AdminSubscriptions() {
  const { adminToken } = useOutletContext();

  const [tab, setTab] = useState("plans");

  const [plans, setPlans] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [subs, setSubs] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [planForm, setPlanForm] = useState(null); // null = closed
  const [planEditing, setPlanEditing] = useState("");

  const [couponForm, setCouponForm] = useState(null);
  const [couponEditing, setCouponEditing] = useState("");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }),
    [adminToken]
  );

  async function api(path, method = "GET", body) {
    const response = await fetch(`${API_BASE}/api/admin/billing${path}`, {
      method,
      headers: authHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.message || data.error || "Something went wrong.");
    }

    return data;
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      };

      const [p, c] = await Promise.all([
        fetch(`${API_BASE}/api/admin/billing/plans`, { headers }),
        fetch(`${API_BASE}/api/admin/billing/coupons`, { headers }),
      ]);

      const pd = await p.json().catch(() => ({}));
      const cd = await c.json().catch(() => ({}));

      if (!p.ok || !pd.success) {
        throw new Error(pd.message || pd.error || "Failed to load plans.");
      }

      if (!c.ok || !cd.success) {
        throw new Error(cd.message || cd.error || "Failed to load coupons.");
      }

      setPlans(pd.plans);
      setCoupons(cd.coupons);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // subscribers are loaded only when that tab is opened
  useEffect(() => {
    if (tab !== "subscribers" || subs) return;

    fetch(`${API_BASE}/api/subscription/admin/list`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok || !d.success) throw new Error(d.error || "Failed to load.");
        setSubs(d);
      })
      .catch((error) => setSubs({ error: error.message }));
  }, [tab, subs, adminToken]);

  async function run(action, okText) {
    setBusy(true);
    setMessage({ type: "", text: "" });

    try {
      await action();
      setMessage({ type: "ok", text: okText });
      await loadAll();
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  /* =====================================================
     PLANS
  ===================================================== */
  function openPlan(plan) {
    if (!plan) {
      setPlanEditing("");
      setPlanForm({ ...EMPTY_PLAN });
    } else {
      const offer = plan.offer || {};

      setPlanEditing(plan.planId);
      setPlanForm({
        planId: plan.planId,
        name: plan.name,
        price: String(plan.price),
        days: String(plan.days),
        badge: plan.badge || "",
        description: plan.description || "",
        features: (plan.features || []).join("\n"),
        sortOrder: String(plan.sortOrder || 0),
        isActive: plan.isActive,
        offerEnabled: offer.enabled === true,
        offerType: offer.type || "percent",
        offerValue: offer.value ? String(offer.value) : "",
        offerLabel: offer.label || "",
        offerStart: toLocalInput(offer.startsAt),
        offerEnd: toLocalInput(offer.endsAt),
      });
    }

    setTimeout(
      () =>
        document
          .getElementById("as-plan-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50
    );
  }

  function planBody(f) {
    return {
      planId: f.planId.trim(),
      name: f.name,
      price: f.price === "" ? "" : Number(f.price),
      days: f.days === "" ? "" : Number(f.days),
      badge: f.badge,
      description: f.description,
      features: f.features,
      sortOrder: Number(f.sortOrder) || 0,
      isActive: f.isActive,
      offer: {
        enabled: f.offerEnabled,
        type: f.offerType,
        value: f.offerValue === "" ? "" : Number(f.offerValue),
        label: f.offerLabel,
        startsAt: fromLocalInput(f.offerStart),
        endsAt: fromLocalInput(f.offerEnd),
      },
    };
  }

  async function savePlan(event) {
    event.preventDefault();

    const body = planBody(planForm);

    const ok = await run(
      () =>
        planEditing
          ? api(`/plans/${encodeURIComponent(planEditing)}`, "PUT", body)
          : api("/plans", "POST", body),
      planEditing ? "Plan updated." : "Plan created."
    );

    if (ok) {
      setPlanForm(null);
      setPlanEditing("");
    }
  }

  function togglePlan(plan) {
    run(
      () =>
        api(`/plans/${encodeURIComponent(plan.planId)}`, "PUT", {
          ...planBody({
            ...EMPTY_PLAN,
            name: plan.name,
            price: String(plan.price),
            days: String(plan.days),
            badge: plan.badge || "",
            description: plan.description || "",
            features: (plan.features || []).join("\n"),
            sortOrder: String(plan.sortOrder || 0),
            isActive: !plan.isActive,
            offerEnabled: plan.offer?.enabled === true,
            offerType: plan.offer?.type || "percent",
            offerValue: plan.offer?.value ? String(plan.offer.value) : "",
            offerLabel: plan.offer?.label || "",
            offerStart: toLocalInput(plan.offer?.startsAt),
            offerEnd: toLocalInput(plan.offer?.endsAt),
          }),
        }),
      plan.isActive ? "Plan hidden from students." : "Plan is visible again."
    );
  }

  function deletePlan(plan) {
    if (
      !window.confirm(
        `Delete the plan "${plan.name}"?\n\nThis only works if nobody has bought it.`
      )
    ) {
      return;
    }

    run(
      () => api(`/plans/${encodeURIComponent(plan.planId)}`, "DELETE"),
      "Plan deleted."
    );
  }

  const planPreview =
    planForm && planForm.offerEnabled
      ? priceAfterOffer(planForm.price, planForm.offerType, planForm.offerValue)
      : null;

  /* =====================================================
     COUPONS
  ===================================================== */
  function openCoupon(coupon) {
    if (!coupon) {
      setCouponEditing("");
      setCouponForm({ ...EMPTY_COUPON });
    } else {
      setCouponEditing(coupon.code);
      setCouponForm({
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: String(coupon.discountValue),
        maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
        minAmount: coupon.minAmount ? String(coupon.minAmount) : "",
        planIds: coupon.planIds || [],
        startsAt: toLocalInput(coupon.startsAt),
        expiresAt: toLocalInput(coupon.expiresAt),
        usageLimit: String(coupon.usageLimit || 0),
        perUserLimit: String(coupon.perUserLimit || 1),
        allowWithOffer: coupon.allowWithOffer !== false,
        isActive: coupon.isActive,
      });
    }

    setTimeout(
      () =>
        document
          .getElementById("as-coupon-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50
    );
  }

  function couponBody(f) {
    return {
      code: f.code.trim().toUpperCase(),
      description: f.description,
      discountType: f.discountType,
      discountValue: f.discountValue === "" ? "" : Number(f.discountValue),
      maxDiscount: f.maxDiscount === "" ? 0 : Number(f.maxDiscount),
      minAmount: f.minAmount === "" ? 0 : Number(f.minAmount),
      planIds: f.planIds,
      startsAt: fromLocalInput(f.startsAt),
      expiresAt: fromLocalInput(f.expiresAt),
      usageLimit: f.usageLimit === "" ? 0 : Number(f.usageLimit),
      perUserLimit: f.perUserLimit === "" ? 1 : Number(f.perUserLimit),
      allowWithOffer: f.allowWithOffer,
      isActive: f.isActive,
    };
  }

  async function saveCoupon(event) {
    event.preventDefault();

    const body = couponBody(couponForm);

    const ok = await run(
      () =>
        couponEditing
          ? api(`/coupons/${encodeURIComponent(couponEditing)}`, "PUT", body)
          : api("/coupons", "POST", body),
      couponEditing ? "Coupon updated." : "Coupon created."
    );

    if (ok) {
      setCouponForm(null);
      setCouponEditing("");
    }
  }

  function toggleCoupon(coupon) {
    run(
      () =>
        api(`/coupons/${encodeURIComponent(coupon.code)}`, "PUT", {
          ...couponBody({
            ...EMPTY_COUPON,
            code: coupon.code,
            description: coupon.description || "",
            discountType: coupon.discountType,
            discountValue: String(coupon.discountValue),
            maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
            minAmount: coupon.minAmount ? String(coupon.minAmount) : "",
            planIds: coupon.planIds || [],
            startsAt: toLocalInput(coupon.startsAt),
            expiresAt: toLocalInput(coupon.expiresAt),
            usageLimit: String(coupon.usageLimit || 0),
            perUserLimit: String(coupon.perUserLimit || 1),
            allowWithOffer: coupon.allowWithOffer !== false,
          }),
          isActive: !coupon.isActive,
        }),
      coupon.isActive ? "Coupon switched off." : "Coupon switched on."
    );
  }

  function deleteCoupon(coupon) {
    if (
      !window.confirm(
        `Delete the coupon ${coupon.code}?\n\nPast purchases keep their record.`
      )
    ) {
      return;
    }

    run(
      () => api(`/coupons/${encodeURIComponent(coupon.code)}`, "DELETE"),
      "Coupon deleted."
    );
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setMessage({ type: "ok", text: `Copied ${code}.` });
    } catch {
      setMessage({ type: "error", text: "Could not copy. Select the code and copy it." });
    }
  }

  function togglePlanInCoupon(planId) {
    setCouponForm((form) => ({
      ...form,
      planIds: form.planIds.includes(planId)
        ? form.planIds.filter((id) => id !== planId)
        : [...form.planIds, planId],
    }));
  }

  /* ---------------------- render ---------------------- */
  const setP = (name, value) => setPlanForm((f) => ({ ...f, [name]: value }));
  const setC = (name, value) => setCouponForm((f) => ({ ...f, [name]: value }));

  return (
    <div className="as-page">
      <header className="as-head">
        <h2>Subscriptions</h2>
        <p>
          Create plans, run offers and make coupon codes. Prices are always
          worked out on the server, so students cannot change them.
        </p>
      </header>

      <div className="as-tabs" role="tablist" aria-label="Subscription sections">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "on" : ""}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {message.text && (
        <div className={`as-msg as-msg-${message.type}`} role="status">
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage({ type: "", text: "" })}
            aria-label="Close message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading && <p className="as-status">Loading…</p>}
      {loadError && <p className="as-status as-error">{loadError}</p>}

      {/* =========================== PLANS =========================== */}
      {!loading && !loadError && tab === "plans" && (
        <>
          {planForm ? (
            <form id="as-plan-form" className="as-card" onSubmit={savePlan}>
              <h3>{planEditing ? `Edit plan: ${planEditing}` : "New plan"}</h3>

              <div className="as-grid">
                <label className="as-field">
                  <span>Plan name *</span>
                  <input
                    value={planForm.name}
                    onChange={(e) => setP("name", e.target.value)}
                    placeholder="e.g. 6 Months"
                    maxLength={40}
                  />
                </label>

                <label className="as-field">
                  <span>Plan ID {planEditing ? "(cannot change)" : "(optional)"}</span>
                  <input
                    value={planForm.planId}
                    onChange={(e) =>
                      setP("planId", e.target.value.toLowerCase())
                    }
                    placeholder="auto, e.g. 6-months"
                    disabled={!!planEditing}
                    maxLength={30}
                  />
                </label>

                <label className="as-field">
                  <span>Price (₹) *</span>
                  <input
                    type="number"
                    min="0"
                    value={planForm.price}
                    onChange={(e) => setP("price", e.target.value)}
                  />
                </label>

                <label className="as-field">
                  <span>Duration (days) *</span>
                  <input
                    type="number"
                    min="1"
                    value={planForm.days}
                    onChange={(e) => setP("days", e.target.value)}
                  />
                  <div className="as-presets">
                    {[30, 90, 180, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setP("days", String(d))}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="as-field">
                  <span>Badge (optional)</span>
                  <input
                    value={planForm.badge}
                    onChange={(e) => setP("badge", e.target.value)}
                    placeholder="e.g. Popular"
                    maxLength={20}
                  />
                </label>

                <label className="as-field">
                  <span>Display order</span>
                  <input
                    type="number"
                    min="0"
                    value={planForm.sortOrder}
                    onChange={(e) => setP("sortOrder", e.target.value)}
                  />
                </label>
              </div>

              <label className="as-field">
                <span>Short description (optional)</span>
                <input
                  value={planForm.description}
                  onChange={(e) => setP("description", e.target.value)}
                  maxLength={150}
                />
              </label>

              <label className="as-field">
                <span>Features, one per line (leave empty for the default 3)</span>
                <textarea
                  rows={4}
                  value={planForm.features}
                  onChange={(e) => setP("features", e.target.value)}
                  placeholder={"Access to all mock tests\nInstant results and review"}
                />
              </label>

              <label className="as-check">
                <input
                  type="checkbox"
                  checked={planForm.isActive}
                  onChange={(e) => setP("isActive", e.target.checked)}
                />
                <span>Visible to students</span>
              </label>

              {/* ------------ offer ------------ */}
              <fieldset className="as-offer">
                <legend>Discount offer on this plan</legend>

                <label className="as-check">
                  <input
                    type="checkbox"
                    checked={planForm.offerEnabled}
                    onChange={(e) => setP("offerEnabled", e.target.checked)}
                  />
                  <span>Run an offer (price is cut automatically)</span>
                </label>

                {planForm.offerEnabled && (
                  <>
                    <div className="as-grid">
                      <label className="as-field">
                        <span>Discount type</span>
                        <select
                          value={planForm.offerType}
                          onChange={(e) => setP("offerType", e.target.value)}
                        >
                          <option value="percent">Percentage (%)</option>
                          <option value="flat">Fixed amount (₹)</option>
                        </select>
                      </label>

                      <label className="as-field">
                        <span>
                          {planForm.offerType === "percent"
                            ? "Percent off"
                            : "Rupees off"}
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={planForm.offerValue}
                          onChange={(e) => setP("offerValue", e.target.value)}
                        />
                      </label>

                      <label className="as-field">
                        <span>Label on the card</span>
                        <input
                          value={planForm.offerLabel}
                          onChange={(e) => setP("offerLabel", e.target.value)}
                          placeholder="e.g. Diwali Sale"
                          maxLength={40}
                        />
                      </label>

                      <span />

                      <label className="as-field">
                        <span>Starts (optional)</span>
                        <input
                          type="datetime-local"
                          value={planForm.offerStart}
                          onChange={(e) => setP("offerStart", e.target.value)}
                        />
                      </label>

                      <label className="as-field">
                        <span>Ends (optional)</span>
                        <input
                          type="datetime-local"
                          value={planForm.offerEnd}
                          onChange={(e) => setP("offerEnd", e.target.value)}
                        />
                      </label>
                    </div>

                    <p className="as-preview">
                      Students will pay{" "}
                      <b>{money(planPreview)}</b>
                      {Number(planForm.price) > 0 && (
                        <>
                          {" "}
                          instead of <s>{money(planForm.price)}</s>
                        </>
                      )}
                      . Leave the dates empty to run the offer until you switch
                      it off.
                    </p>
                  </>
                )}
              </fieldset>

              <div className="as-actions">
                <button
                  type="button"
                  className="as-btn"
                  onClick={() => {
                    setPlanForm(null);
                    setPlanEditing("");
                  }}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button className="as-btn as-btn-primary" disabled={busy}>
                  {busy ? "Saving…" : planEditing ? "Save changes" : "Create plan"}
                </button>
              </div>
            </form>
          ) : (
            <div className="as-bar">
              <h3>
                All plans <span>{plans.length}</span>
              </h3>

              <button
                type="button"
                className="as-btn as-btn-primary"
                onClick={() => openPlan(null)}
              >
                <Plus size={16} /> New plan
              </button>
            </div>
          )}

          <div className="as-list">
            {plans.map((plan) => {
              const state = offerState(plan.offer);
              const now = plan.current;

              return (
                <article
                  key={plan.planId}
                  className={`as-item ${plan.isActive ? "" : "as-item-off"}`}
                >
                  <div className="as-item-top">
                    <div className="as-item-title">
                      <strong>{plan.name}</strong>

                      <div className="as-chips">
                        <span
                          className={`as-chip ${plan.isActive ? "as-chip-ok" : "as-chip-grey"}`}
                        >
                          {plan.isActive ? "Visible" : "Hidden"}
                        </span>

                        {plan.badge && (
                          <span className="as-chip as-chip-blue">{plan.badge}</span>
                        )}

                        {state === "running" && (
                          <span className="as-chip as-chip-red">
                            Offer running
                          </span>
                        )}

                        {state === "scheduled" && (
                          <span className="as-chip as-chip-amber">
                            Offer scheduled
                          </span>
                        )}

                        {state === "ended" && (
                          <span className="as-chip as-chip-grey">Offer ended</span>
                        )}
                      </div>
                    </div>

                    <div className="as-price">
                      {now.offerDiscount > 0 ? (
                        <>
                          <b>{money(now.finalPrice)}</b>
                          <s>{money(plan.price)}</s>
                        </>
                      ) : (
                        <b>{money(plan.price)}</b>
                      )}

                      <small>{plan.days} days</small>
                    </div>
                  </div>

                  {state && plan.offer?.label && (
                    <p className="as-line">
                      Offer “{plan.offer.label}”:{" "}
                      {plan.offer.type === "percent"
                        ? `${plan.offer.value}% off`
                        : `₹${plan.offer.value} off`}
                      {plan.offer.endsAt &&
                        ` · ends ${formatDateTime(plan.offer.endsAt)}`}
                    </p>
                  )}

                  <div className="as-stats">
                    <span>
                      <b>{plan.stats.sold}</b> sold
                    </span>
                    <span>
                      <b>{plan.stats.active}</b> active now
                    </span>
                    <span>
                      <b>{money(plan.stats.revenue)}</b> revenue
                    </span>
                    <span className="as-id">ID: {plan.planId}</span>
                  </div>

                  <div className="as-row-actions">
                    <button
                      type="button"
                      className="as-btn as-btn-sm"
                      onClick={() => openPlan(plan)}
                      disabled={busy}
                    >
                      <Pencil size={14} /> Edit
                    </button>

                    <button
                      type="button"
                      className="as-btn as-btn-sm"
                      onClick={() => togglePlan(plan)}
                      disabled={busy}
                    >
                      {plan.isActive ? "Hide" : "Show"}
                    </button>

                    <button
                      type="button"
                      className="as-btn as-btn-sm as-btn-danger"
                      onClick={() => deletePlan(plan)}
                      disabled={busy}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              );
            })}

            {plans.length === 0 && (
              <p className="as-status">No plans yet. Create your first plan.</p>
            )}
          </div>
        </>
      )}

      {/* ========================== COUPONS ========================== */}
      {!loading && !loadError && tab === "coupons" && (
        <>
          {couponForm ? (
            <form id="as-coupon-form" className="as-card" onSubmit={saveCoupon}>
              <h3>{couponEditing ? `Edit coupon: ${couponEditing}` : "New coupon"}</h3>

              <div className="as-grid">
                <label className="as-field">
                  <span>Coupon code *</span>
                  <div className="as-inline">
                    <input
                      value={couponForm.code}
                      onChange={(e) =>
                        setC(
                          "code",
                          e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
                        )
                      }
                      placeholder="e.g. WELCOME20"
                      disabled={!!couponEditing}
                      maxLength={20}
                    />

                    {!couponEditing && (
                      <button
                        type="button"
                        className="as-btn"
                        onClick={() => setC("code", randomCode())}
                      >
                        Generate
                      </button>
                    )}
                  </div>
                </label>

                <label className="as-field">
                  <span>Note for yourself (optional)</span>
                  <input
                    value={couponForm.description}
                    onChange={(e) => setC("description", e.target.value)}
                    placeholder="e.g. Instagram giveaway"
                    maxLength={120}
                  />
                </label>

                <label className="as-field">
                  <span>Discount type</span>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setC("discountType", e.target.value)}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Fixed amount (₹)</option>
                  </select>
                </label>

                <label className="as-field">
                  <span>
                    {couponForm.discountType === "percent"
                      ? "Percent off *"
                      : "Rupees off *"}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.discountValue}
                    onChange={(e) => setC("discountValue", e.target.value)}
                  />
                </label>

                {couponForm.discountType === "percent" && (
                  <label className="as-field">
                    <span>Maximum discount ₹ (0 = no limit)</span>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.maxDiscount}
                      onChange={(e) => setC("maxDiscount", e.target.value)}
                      placeholder="0"
                    />
                  </label>
                )}

                <label className="as-field">
                  <span>Minimum order ₹ (0 = none)</span>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.minAmount}
                    onChange={(e) => setC("minAmount", e.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="as-field">
                  <span>Valid from (optional)</span>
                  <input
                    type="datetime-local"
                    value={couponForm.startsAt}
                    onChange={(e) => setC("startsAt", e.target.value)}
                  />
                </label>

                <label className="as-field">
                  <span>Valid until (optional)</span>
                  <input
                    type="datetime-local"
                    value={couponForm.expiresAt}
                    onChange={(e) => setC("expiresAt", e.target.value)}
                  />
                </label>

                <label className="as-field">
                  <span>Total uses allowed (0 = unlimited)</span>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.usageLimit}
                    onChange={(e) => setC("usageLimit", e.target.value)}
                  />
                </label>

                <label className="as-field">
                  <span>Uses per student</span>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.perUserLimit}
                    onChange={(e) => setC("perUserLimit", e.target.value)}
                  />
                </label>
              </div>

              <div className="as-field">
                <span>Works on (none selected = every plan)</span>

                <div className="as-plan-pick">
                  {plans.map((plan) => (
                    <label
                      key={plan.planId}
                      className={couponForm.planIds.includes(plan.planId) ? "on" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={couponForm.planIds.includes(plan.planId)}
                        onChange={() => togglePlanInCoupon(plan.planId)}
                      />
                      {plan.name}
                    </label>
                  ))}
                </div>
              </div>

              <label className="as-check">
                <input
                  type="checkbox"
                  checked={couponForm.allowWithOffer}
                  onChange={(e) => setC("allowWithOffer", e.target.checked)}
                />
                <span>Can be used on plans that already have an offer</span>
              </label>

              <label className="as-check">
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={(e) => setC("isActive", e.target.checked)}
                />
                <span>Coupon is switched on</span>
              </label>

              <div className="as-actions">
                <button
                  type="button"
                  className="as-btn"
                  onClick={() => {
                    setCouponForm(null);
                    setCouponEditing("");
                  }}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button className="as-btn as-btn-primary" disabled={busy}>
                  {busy ? "Saving…" : couponEditing ? "Save changes" : "Create coupon"}
                </button>
              </div>
            </form>
          ) : (
            <div className="as-bar">
              <h3>
                All coupons <span>{coupons.length}</span>
              </h3>

              <button
                type="button"
                className="as-btn as-btn-primary"
                onClick={() => openCoupon(null)}
              >
                <Plus size={16} /> New coupon
              </button>
            </div>
          )}

          <div className="as-list">
            {coupons.map((coupon) => (
              <article
                key={coupon.code}
                className={`as-item ${coupon.status === "active" ? "" : "as-item-off"}`}
              >
                <div className="as-item-top">
                  <div className="as-item-title">
                    <div className="as-code">
                      <strong>{coupon.code}</strong>

                      <button
                        type="button"
                        onClick={() => copyCode(coupon.code)}
                        aria-label={`Copy ${coupon.code}`}
                        title="Copy code"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    <div className="as-chips">
                      <span className={`as-chip as-status-${coupon.status}`}>
                        {STATUS_LABEL[coupon.status]}
                      </span>
                    </div>
                  </div>

                  <div className="as-price">
                    <b>
                      {coupon.discountType === "percent"
                        ? `${coupon.discountValue}% off`
                        : `₹${coupon.discountValue} off`}
                    </b>

                    {coupon.discountType === "percent" && coupon.maxDiscount > 0 && (
                      <small>up to ₹{coupon.maxDiscount}</small>
                    )}
                  </div>
                </div>

                {coupon.description && (
                  <p className="as-line">{coupon.description}</p>
                )}

                <ul className="as-rules">
                  <li>
                    {coupon.planIds.length === 0
                      ? "All plans"
                      : `Plans: ${coupon.planIds
                          .map(
                            (id) => plans.find((p) => p.planId === id)?.name || id
                          )
                          .join(", ")}`}
                  </li>

                  {coupon.minAmount > 0 && <li>Minimum order ₹{coupon.minAmount}</li>}

                  <li>
                    {coupon.perUserLimit} use{coupon.perUserLimit === 1 ? "" : "s"} per
                    student
                  </li>

                  {!coupon.allowWithOffer && <li>Not with plan offers</li>}

                  {(coupon.startsAt || coupon.expiresAt) && (
                    <li>
                      {coupon.startsAt && `From ${formatDate(coupon.startsAt)}`}
                      {coupon.startsAt && coupon.expiresAt && " · "}
                      {coupon.expiresAt && `Until ${formatDate(coupon.expiresAt)}`}
                    </li>
                  )}
                </ul>

                <div className="as-stats">
                  <span>
                    <b>
                      {coupon.stats.used}
                      {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ""}
                    </b>{" "}
                    used
                  </span>
                  <span>
                    <b>{money(coupon.stats.discountGiven)}</b> discount given
                  </span>
                  <span>
                    <b>{money(coupon.stats.revenue)}</b> revenue
                  </span>
                </div>

                <div className="as-row-actions">
                  <button
                    type="button"
                    className="as-btn as-btn-sm"
                    onClick={() => openCoupon(coupon)}
                    disabled={busy}
                  >
                    <Pencil size={14} /> Edit
                  </button>

                  <button
                    type="button"
                    className="as-btn as-btn-sm"
                    onClick={() => toggleCoupon(coupon)}
                    disabled={busy}
                  >
                    {coupon.isActive ? "Switch off" : "Switch on"}
                  </button>

                  <button
                    type="button"
                    className="as-btn as-btn-sm as-btn-danger"
                    onClick={() => deleteCoupon(coupon)}
                    disabled={busy}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}

            {coupons.length === 0 && (
              <p className="as-status">No coupons yet. Create your first coupon.</p>
            )}
          </div>
        </>
      )}

      {/* ======================== SUBSCRIBERS ======================== */}
      {tab === "subscribers" && (
        <>
          {!subs && <p className="as-status">Loading…</p>}
          {subs?.error && <p className="as-status as-error">{subs.error}</p>}

          {subs && !subs.error && (
            <>
              <div className="as-summary">
                <div>
                  <strong>{money(subs.totalRevenue)}</strong>
                  <span>Total revenue</span>
                </div>
                <div>
                  <strong>{subs.activeCount}</strong>
                  <span>Active now</span>
                </div>
                <div>
                  <strong>{subs.subscriptions.length}</strong>
                  <span>Paid purchases</span>
                </div>
              </div>

              <div className="as-scroll">
                <table className="as-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Plan</th>
                      <th>Paid</th>
                      <th>Coupon</th>
                      <th>Starts</th>
                      <th>Ends</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {subs.subscriptions.map((row) => (
                      <tr key={row.orderId}>
                        <td>
                          <b>{row.user?.fullName || "—"}</b>
                          <small>{row.user?.email}</small>
                        </td>
                        <td>{row.planName}</td>
                        <td>
                          {money(row.price)}
                          {row.basePrice > row.price && <small>MRP {money(row.basePrice)}</small>}
                        </td>
                        <td>
                          {row.couponCode ? (
                            <>
                              <b>{row.couponCode}</b>
                              <small>−{money(row.couponDiscount)}</small>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{formatDate(row.startsAt)}</td>
                        <td>{formatDate(row.expiresAt)}</td>
                        <td>
                          <span
                            className={`as-chip ${row.isActive ? "as-chip-ok" : "as-chip-grey"}`}
                          >
                            {row.isActive ? "Active" : "Expired"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {subs.subscriptions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="as-empty-cell">
                          No paid subscriptions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}