const express = require("express");

const Coupon = require("../models/Coupon");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const requireAdmin = require("../middleware/requireAdmin");
const { ensureSeeded, toPublic } = require("../utils/planService");
const { validateCoupon, validatePlan } = require("../utils/billingValidation");

/* =====================================================
   ADMIN > SUBSCRIPTIONS   (mounted at /api/admin/billing)

   Plans    GET/POST /plans      PUT/DELETE /plans/:planId
   Coupons  GET/POST /coupons    PUT/DELETE /coupons/:code
===================================================== */

const router = express.Router();

router.use(requireAdmin);

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function clean(value) {
  return String(value ?? "").trim();
}

/* ---------------------------------------------------
   PLANS
--------------------------------------------------- */
async function planWithStats(plan, stats, now) {
  const s = stats.get(plan.planId) || { sold: 0, revenue: 0, active: 0 };

  return {
    planId: plan.planId,
    name: plan.name,
    description: plan.description || "",
    price: plan.price,
    days: plan.days,
    badge: plan.badge || "",
    features: plan.features || [],
    sortOrder: plan.sortOrder || 0,
    isActive: plan.isActive,
    offer: plan.offer || { enabled: false },
    // what a student sees right now (after the offer)
    current: toPublic(plan, now),
    stats: { sold: s.sold, revenue: s.revenue, active: s.active },
  };
}

router.get("/plans", async (req, res) => {
  try {
    await ensureSeeded();

    const now = new Date();

    const [plans, rows] = await Promise.all([
      SubscriptionPlan.find().sort({ sortOrder: 1, price: 1 }).lean(),
      Subscription.aggregate([
        { $match: { paid: true } },
        {
          $group: {
            _id: "$planId",
            sold: { $sum: 1 },
            revenue: { $sum: "$price" },
            active: {
              $sum: { $cond: [{ $gt: ["$expiresAt", now] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = new Map(rows.map((r) => [r._id, r]));

    return res.json({
      success: true,
      plans: await Promise.all(plans.map((p) => planWithStats(p, stats, now))),
    });
  } catch (error) {
    console.error("Admin plans load error:", error);
    return fail(res, 500, "Failed to load plans.");
  }
});

router.post("/plans", async (req, res) => {
  try {
    const checked = validatePlan(req.body, { isCreate: true });

    if (checked.error) return fail(res, 400, checked.error);

    const data = checked.value;

    if (await SubscriptionPlan.exists({ planId: data.planId })) {
      return fail(res, 409, "A plan with this ID already exists.");
    }

    // sortOrder 0 = put the new plan last
    if (!data.sortOrder) {
      const last = await SubscriptionPlan.findOne()
        .sort({ sortOrder: -1 })
        .select({ sortOrder: 1 })
        .lean();

      data.sortOrder = (last?.sortOrder || 0) + 1;
    }

    const plan = await SubscriptionPlan.create(data);

    return res.status(201).json({
      success: true,
      message: "Plan created.",
      plan: await planWithStats(plan.toObject(), new Map(), new Date()),
    });
  } catch (error) {
    console.error("Admin plan create error:", error);
    return fail(res, 500, "Failed to create the plan.");
  }
});

router.put("/plans/:planId", async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findOne({
      planId: clean(req.params.planId).toLowerCase(),
    });

    if (!plan) return fail(res, 404, "Plan not found.");

    const checked = validatePlan(req.body, { isCreate: false });

    if (checked.error) return fail(res, 400, checked.error);

    Object.assign(plan, checked.value);
    await plan.save();

    return res.json({
      success: true,
      message: "Plan updated.",
      plan: await planWithStats(plan.toObject(), new Map(), new Date()),
    });
  } catch (error) {
    console.error("Admin plan update error:", error);
    return fail(res, 500, "Failed to update the plan.");
  }
});

router.delete("/plans/:planId", async (req, res) => {
  try {
    const planId = clean(req.params.planId).toLowerCase();

    const plan = await SubscriptionPlan.findOne({ planId }).lean();

    if (!plan) return fail(res, 404, "Plan not found.");

    const sold = await Subscription.countDocuments({ planId });

    if (sold > 0) {
      return fail(
        res,
        409,
        `${sold} purchase(s) used this plan. Switch it off instead of deleting it, so the history stays correct.`
      );
    }

    await SubscriptionPlan.deleteOne({ planId });

    return res.json({ success: true, message: "Plan deleted." });
  } catch (error) {
    console.error("Admin plan delete error:", error);
    return fail(res, 500, "Failed to delete the plan.");
  }
});

/* ---------------------------------------------------
   COUPONS
--------------------------------------------------- */
function couponStatus(coupon, used, now) {
  if (!coupon.isActive) return "off";
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return "scheduled";
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return "expired";
  if (coupon.usageLimit > 0 && used >= coupon.usageLimit) return "used-up";
  return "active";
}

function formatCoupon(coupon, stat, now) {
  const used = stat?.used || 0;

  return {
    code: coupon.code,
    description: coupon.description || "",
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount || 0,
    minAmount: coupon.minAmount || 0,
    planIds: coupon.planIds || [],
    allowWithOffer: coupon.allowWithOffer !== false,
    startsAt: coupon.startsAt || null,
    expiresAt: coupon.expiresAt || null,
    usageLimit: coupon.usageLimit || 0,
    perUserLimit: coupon.perUserLimit || 1,
    isActive: coupon.isActive,
    status: couponStatus(coupon, used, now),
    stats: {
      used,
      discountGiven: stat?.discount || 0,
      revenue: stat?.revenue || 0,
    },
  };
}

async function unknownPlanIds(planIds) {
  if (!planIds.length) return [];

  const known = await SubscriptionPlan.find({ planId: { $in: planIds } })
    .select({ planId: 1 })
    .lean();

  const set = new Set(known.map((p) => p.planId));

  return planIds.filter((id) => !set.has(id));
}

router.get("/coupons", async (req, res) => {
  try {
    const now = new Date();

    const [coupons, rows] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).lean(),
      Subscription.aggregate([
        { $match: { paid: true, couponCode: { $ne: "" } } },
        {
          $group: {
            _id: "$couponCode",
            used: { $sum: 1 },
            discount: { $sum: "$couponDiscount" },
            revenue: { $sum: "$price" },
          },
        },
      ]),
    ]);

    const stats = new Map(rows.map((r) => [r._id, r]));

    return res.json({
      success: true,
      coupons: coupons.map((c) => formatCoupon(c, stats.get(c.code), now)),
    });
  } catch (error) {
    console.error("Admin coupons load error:", error);
    return fail(res, 500, "Failed to load coupons.");
  }
});

router.post("/coupons", async (req, res) => {
  try {
    const checked = validateCoupon(req.body, { isCreate: true });

    if (checked.error) return fail(res, 400, checked.error);

    const data = checked.value;

    if (await Coupon.exists({ code: data.code })) {
      return fail(res, 409, "A coupon with this code already exists.");
    }

    const unknown = await unknownPlanIds(data.planIds);

    if (unknown.length) {
      return fail(res, 400, `Unknown plan: ${unknown.join(", ")}.`);
    }

    const coupon = await Coupon.create(data);

    return res.status(201).json({
      success: true,
      message: "Coupon created.",
      coupon: formatCoupon(coupon.toObject(), null, new Date()),
    });
  } catch (error) {
    console.error("Admin coupon create error:", error);
    return fail(res, 500, "Failed to create the coupon.");
  }
});

router.put("/coupons/:code", async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      code: clean(req.params.code).toUpperCase(),
    });

    if (!coupon) return fail(res, 404, "Coupon not found.");

    const checked = validateCoupon(req.body, { isCreate: false });

    if (checked.error) return fail(res, 400, checked.error);

    const unknown = await unknownPlanIds(checked.value.planIds);

    if (unknown.length) {
      return fail(res, 400, `Unknown plan: ${unknown.join(", ")}.`);
    }

    Object.assign(coupon, checked.value);
    await coupon.save();

    const used = await Subscription.countDocuments({
      couponCode: coupon.code,
      paid: true,
    });

    return res.json({
      success: true,
      message: "Coupon updated.",
      coupon: formatCoupon(coupon.toObject(), { used }, new Date()),
    });
  } catch (error) {
    console.error("Admin coupon update error:", error);
    return fail(res, 500, "Failed to update the coupon.");
  }
});

router.delete("/coupons/:code", async (req, res) => {
  try {
    const code = clean(req.params.code).toUpperCase();

    const result = await Coupon.deleteOne({ code });

    if (!result.deletedCount) return fail(res, 404, "Coupon not found.");

    // past purchases keep their coupon code and discount for the records
    return res.json({ success: true, message: "Coupon deleted." });
  } catch (error) {
    console.error("Admin coupon delete error:", error);
    return fail(res, 500, "Failed to delete the coupon.");
  }
});

module.exports = router;