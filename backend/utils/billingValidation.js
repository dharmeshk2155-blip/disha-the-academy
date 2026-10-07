/* =====================================================
   Checks for what the admin types in Admin > Subscriptions
   (plans, offers and coupons). Pure functions, no database.
   Each returns { error: "message" } or { value: {...clean data} }.
===================================================== */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE = /^[A-Z0-9][A-Z0-9_-]{2,19}$/;

const clean = (v) => String(v ?? "").trim();

function wholeNumber(value, { min, max, label }) {
  const n = Number(value);

  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    return { error: `${label} must be a whole number from ${min} to ${max}.` };
  }

  return { value: n };
}

function dateOrNull(value, label) {
  if (value === null || value === undefined || value === "") {
    return { value: null };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { error: `${label} is not a valid date.` };
  }

  return { value: date };
}

function slugify(text) {
  return clean(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
}

/* ---------------- offer on a plan ---------------- */
function validateOffer(input, price) {
  if (!input || input.enabled !== true) {
    return {
      value: {
        enabled: false,
        type: "percent",
        value: 0,
        label: "",
        startsAt: null,
        endsAt: null,
      },
    };
  }

  const type = input.type === "flat" ? "flat" : "percent";

  const amount = wholeNumber(input.value, {
    min: 1,
    max: type === "percent" ? 100 : 1000000,
    label: type === "percent" ? "Offer percentage" : "Offer amount",
  });

  if (amount.error) return amount;

  if (type === "flat" && amount.value > price) {
    return { error: "The offer amount cannot be more than the plan price." };
  }

  const startsAt = dateOrNull(input.startsAt, "Offer start date");
  if (startsAt.error) return startsAt;

  const endsAt = dateOrNull(input.endsAt, "Offer end date");
  if (endsAt.error) return endsAt;

  if (startsAt.value && endsAt.value && endsAt.value <= startsAt.value) {
    return { error: "The offer must end after it starts." };
  }

  const label = clean(input.label);

  if (label.length > 40) {
    return { error: "The offer label can be at most 40 characters." };
  }

  return {
    value: {
      enabled: true,
      type,
      value: amount.value,
      label,
      startsAt: startsAt.value,
      endsAt: endsAt.value,
    },
  };
}

/* ---------------- plan ---------------- */
function validatePlan(body, { isCreate }) {
  const name = clean(body?.name);

  if (name.length < 2 || name.length > 40) {
    return { error: "Plan name must be 2 to 40 characters." };
  }

  const out = { name };

  if (isCreate) {
    const planId = clean(body?.planId).toLowerCase() || slugify(name);

    if (!SLUG.test(planId) || planId.length > 30) {
      return {
        error:
          "Plan ID can only have small letters, numbers and dashes (max 30).",
      };
    }

    out.planId = planId;
  }

  const price = wholeNumber(body?.price, {
    min: 0,
    max: 100000,
    label: "Price",
  });

  if (price.error) return price;
  out.price = price.value;

  const days = wholeNumber(body?.days, {
    min: 1,
    max: 3650,
    label: "Duration (days)",
  });

  if (days.error) return days;
  out.days = days.value;

  out.badge = clean(body?.badge);

  if (out.badge.length > 20) {
    return { error: "The badge can be at most 20 characters." };
  }

  out.description = clean(body?.description);

  if (out.description.length > 150) {
    return { error: "The description can be at most 150 characters." };
  }

  const rawFeatures = Array.isArray(body?.features)
    ? body.features
    : String(body?.features ?? "").split("\n");

  out.features = rawFeatures.map(clean).filter(Boolean);

  if (out.features.length > 10) {
    return { error: "A plan can have at most 10 feature lines." };
  }

  if (out.features.some((f) => f.length > 120)) {
    return { error: "Each feature line can be at most 120 characters." };
  }

  const order = wholeNumber(body?.sortOrder ?? 0, {
    min: 0,
    max: 1000,
    label: "Display order",
  });

  if (order.error) return order;
  out.sortOrder = order.value;

  out.isActive = body?.isActive !== false;

  const offer = validateOffer(body?.offer, out.price);

  if (offer.error) return offer;
  out.offer = offer.value;

  return { value: out };
}

/* ---------------- coupon ---------------- */
function validateCoupon(body, { isCreate }) {
  const out = {};

  if (isCreate) {
    const code = clean(body?.code).toUpperCase();

    if (!CODE.test(code)) {
      return {
        error:
          "Coupon code must be 3 to 20 characters: capital letters, numbers, dash or underscore.",
      };
    }

    out.code = code;
  }

  out.description = clean(body?.description);

  if (out.description.length > 120) {
    return { error: "The description can be at most 120 characters." };
  }

  out.discountType = body?.discountType === "flat" ? "flat" : "percent";

  const value = wholeNumber(body?.discountValue, {
    min: 1,
    max: out.discountType === "percent" ? 100 : 100000,
    label: out.discountType === "percent" ? "Discount percentage" : "Discount amount",
  });

  if (value.error) return value;
  out.discountValue = value.value;

  const cap = wholeNumber(body?.maxDiscount ?? 0, {
    min: 0,
    max: 100000,
    label: "Maximum discount",
  });

  if (cap.error) return cap;
  out.maxDiscount = out.discountType === "percent" ? cap.value : 0;

  const min = wholeNumber(body?.minAmount ?? 0, {
    min: 0,
    max: 100000,
    label: "Minimum order amount",
  });

  if (min.error) return min;
  out.minAmount = min.value;

  const total = wholeNumber(body?.usageLimit ?? 0, {
    min: 0,
    max: 1000000,
    label: "Total usage limit",
  });

  if (total.error) return total;
  out.usageLimit = total.value;

  const perUser = wholeNumber(body?.perUserLimit ?? 1, {
    min: 1,
    max: 1000,
    label: "Uses per student",
  });

  if (perUser.error) return perUser;
  out.perUserLimit = perUser.value;

  out.planIds = [
    ...new Set(
      (Array.isArray(body?.planIds) ? body.planIds : [])
        .map((id) => clean(id).toLowerCase())
        .filter(Boolean)
    ),
  ];

  out.allowWithOffer = body?.allowWithOffer !== false;
  out.isActive = body?.isActive !== false;

  const startsAt = dateOrNull(body?.startsAt, "Start date");
  if (startsAt.error) return startsAt;

  const expiresAt = dateOrNull(body?.expiresAt, "Expiry date");
  if (expiresAt.error) return expiresAt;

  if (startsAt.value && expiresAt.value && expiresAt.value <= startsAt.value) {
    return { error: "The coupon must expire after it starts." };
  }

  out.startsAt = startsAt.value;
  out.expiresAt = expiresAt.value;

  return { value: out };
}

module.exports = { slugify, validateCoupon, validateOffer, validatePlan };