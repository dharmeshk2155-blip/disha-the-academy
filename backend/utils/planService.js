/* =====================================================
   PLAN SERVICE  (plans now live in the database)

   The first time plans are needed and the collection is empty, the plans
   from utils/plans.js are copied in once. After that the admin panel
   (Admin > Subscriptions) is the only place that changes them.
===================================================== */

const SubscriptionPlan = require("../models/SubscriptionPlan");
const { PLANS } = require("./plans");
const { isOfferActive, offerDiscountFor, toInt } = require("./pricing");

const DEFAULT_FEATURES = (days) => [
  "Access to all mock tests",
  "Instant results and review",
  `Valid for ${days} days`,
];

let seeding = null;

async function ensureSeeded() {
  if (seeding) return seeding;

  seeding = (async () => {
    try {
      if ((await SubscriptionPlan.estimatedDocumentCount()) > 0) return;

      await SubscriptionPlan.insertMany(
        PLANS.map((plan, index) => ({
          planId: plan.id,
          name: plan.name,
          description: "",
          price: plan.price,
          days: plan.days,
          badge: plan.badge || "",
          features: DEFAULT_FEATURES(plan.days),
          sortOrder: index + 1,
          isActive: true,
        })),
        { ordered: false }
      );
    } catch (error) {
      // two requests seeding at once: the second one hits the unique index
      if (error?.code !== 11000 && !error?.writeErrors) throw error;
    } finally {
      seeding = null;
    }
  })();

  return seeding;
}

// one plan the way the website needs it
function toPublic(plan, now = new Date()) {
  const base = toInt(plan.price);
  const offerOn = isOfferActive(plan.offer, now);
  const offerDiscount = offerDiscountFor(base, plan.offer, now);
  const finalPrice = base - offerDiscount;
  const months = Math.max(1, Math.round(plan.days / 30));

  return {
    id: plan.planId,
    name: plan.name,
    description: plan.description || "",
    price: base, // normal price (MRP)
    finalPrice, // after the automatic offer
    offerDiscount,
    offer: offerOn
      ? {
          label: plan.offer.label || "",
          type: plan.offer.type,
          value: plan.offer.value,
          endsAt: plan.offer.endsAt || null,
        }
      : null,
    days: plan.days,
    months,
    badge: plan.badge || "",
    features:
      Array.isArray(plan.features) && plan.features.length
        ? plan.features
        : DEFAULT_FEATURES(plan.days),
    perMonth: Math.round(finalPrice / Math.max(plan.days / 30, 1)),
  };
}

async function listPublicPlans() {
  await ensureSeeded();

  const plans = await SubscriptionPlan.find({ isActive: true })
    .sort({ sortOrder: 1, price: 1 })
    .lean();

  const now = new Date();

  return plans.map((plan) => toPublic(plan, now));
}

// planId -> plan document (null when missing). activeOnly hides switched-off plans
async function findPlan(planId, { activeOnly = true } = {}) {
  await ensureSeeded();

  const query = { planId: String(planId || "").trim().toLowerCase() };

  if (activeOnly) query.isActive = true;

  return SubscriptionPlan.findOne(query).lean();
}

module.exports = { DEFAULT_FEATURES, ensureSeeded, findPlan, listPublicPlans, toPublic };