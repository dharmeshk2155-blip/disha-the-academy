const Subscription = require("../models/Subscription");

const DAY_MS = 24 * 60 * 60 * 1000;

// User ka abhi chal raha (paid + not expired) subscription
async function findActiveSubscription(userId) {
  return Subscription.findOne({
    userId,
    paid: true,
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .lean();
}

function formatSubscription(sub) {
  if (!sub) return null;

  const msLeft = new Date(sub.expiresAt).getTime() - Date.now();

  return {
    planId: sub.planId,
    planName: sub.planName,
    price: sub.price,
    startsAt: sub.startsAt,
    expiresAt: sub.expiresAt,
    daysLeft: Math.max(0, Math.ceil(msLeft / DAY_MS)),
  };
}

module.exports = {
  DAY_MS,
  findActiveSubscription,
  formatSubscription,
};