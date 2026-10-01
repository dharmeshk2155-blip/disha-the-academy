// ======================================================
// SUBSCRIPTION PLANS  (single source of truth)
//
// Price sirf yahin se aata hai. Frontend Pricing page
// /api/subscription/plans se ye list leta hai, isliye
// price badalna ho to sirf is file me badlo.
//
// Order badhta hua: 1 Month -> 3 Months -> 1 Year
//
// SUBSCRIPTION SE KYA MILTA HAI?
//   - Mock Tests (test dena + result)
//
// SUBSCRIPTION ME KYA NAHI AATA?
//   - Notes          -> alag price par bikte hain (per note)
//   - Current Affairs -> sabke liye free
//   - Blog            -> sabke liye free
// ======================================================

const PLANS = [
  {
    id: "1-month",
    name: "1 Month",
    price: 69,
    months: 1,
    days: 30,
    badge: "",
  },
  {
    id: "3-months",
    name: "3 Months",
    price: 199,
    months: 3,
    days: 90,
    badge: "Popular",
  },
  {
    id: "1-year",
    name: "1 Year",
    price: 399,
    months: 12,
    days: 365,
    badge: "Best Value",
  },
];

// Ye test ids subscription ke bina bhi free khulenge
// (testId Admin > Tests me jo hai wahi likhna, lowercase).
// Example: ["ssc-cgl-demo-1"]
const FREE_TEST_IDS = [];

function perMonth(plan) {
  return Math.round(plan.price / plan.months);
}

function getPlan(planId) {
  return (
    PLANS.find((plan) => plan.id === String(planId || "").trim()) || null
  );
}

function getPublicPlans() {
  return PLANS.map((plan) => ({
    ...plan,
    perMonth: perMonth(plan),
  }));
}

function isTestFree(testId) {
  return FREE_TEST_IDS.includes(String(testId || "").trim().toLowerCase());
}

module.exports = {
  PLANS,
  FREE_TEST_IDS,
  perMonth,
  getPlan,
  getPublicPlans,
  isTestFree,
};