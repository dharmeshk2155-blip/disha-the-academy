const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const Razorpay = require("razorpay");

const Subscription = require("../models/Subscription");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const Coupon = require("../models/Coupon");
const { findPlan, listPublicPlans } = require("../utils/planService");
const {
  checkCoupon,
  describeDiscount,
  offerDiscountFor,
  quotePrice,
  toInt,
} = require("../utils/pricing");
const {
  DAY_MS,
  findActiveSubscription,
  formatSubscription,
} = require("../utils/subscriptionAccess");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ======================================================
// GET /api/subscription/plans   (public)
// Plans come from the database (Admin > Subscriptions).
// price = normal price, finalPrice = after the plan's own offer.
// ======================================================

router.get("/plans", async (req, res) => {
  try {
    return res.json({
      success: true,
      plans: await listPublicPlans(),
    });
  } catch (error) {
    console.error("Plans load error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to load plans",
    });
  }
});

// ------------------------------------------------------
// shared helpers
// ------------------------------------------------------

// Checks a coupon code for one plan and one student.
// -> { code, coupon, error }   (coupon is null when it cannot be used)
async function resolveCoupon({ rawCode, plan, userId, now }) {
  const code = String(rawCode || "").trim().toUpperCase();

  if (!code) return { code: "", coupon: null, error: "" };

  const coupon = await Coupon.findOne({ code }).lean();

  const base = toInt(plan.price);
  const offerDiscount = offerDiscountFor(base, plan.offer, now);

  let totalUsed = 0;
  let userUsed = 0;

  if (coupon) {
    [totalUsed, userUsed] = await Promise.all([
      Subscription.countDocuments({ couponCode: code, paid: true }),
      Subscription.countDocuments({
        couponCode: code,
        paid: true,
        userId: String(userId),
      }),
    ]);
  }

  const error = checkCoupon(coupon, {
    planId: plan.planId,
    amountAfterOffer: base - offerDiscount,
    hasOffer: offerDiscount > 0,
    now,
    totalUsed,
    userUsed,
  });

  return { code, coupon: error ? null : coupon, error };
}

// A new plan starts after the one that is running now
async function subscriptionWindow(userId, days, now) {
  const active = await findActiveSubscription(userId);

  const startsAt =
    active && new Date(active.expiresAt) > now
      ? new Date(active.expiresAt)
      : now;

  return {
    startsAt,
    expiresAt: new Date(startsAt.getTime() + days * DAY_MS),
  };
}

// ======================================================
// POST /api/subscription/coupon/validate   (login required)
// Body: { planId, code }
// Shows the student what the price will be with this coupon.
// ======================================================

const couponLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many coupon attempts. Please try again in a few minutes.",
  },
});

router.post(
  "/coupon/validate",
  requireAuth,
  couponLimiter,
  async (req, res) => {
    try {
      const plan = await findPlan(req.body?.planId);

      if (!plan) {
        return res.status(400).json({
          success: false,
          error: "Please choose a valid plan",
        });
      }

      if (!String(req.body?.code || "").trim()) {
        return res.status(400).json({
          success: false,
          error: "Enter a coupon code.",
        });
      }

      const now = new Date();

      const { coupon, error } = await resolveCoupon({
        rawCode: req.body.code,
        plan,
        userId: req.user.id,
        now,
      });

      if (error) {
        return res.status(400).json({ success: false, error });
      }

      return res.json({
        success: true,
        coupon: {
          code: coupon.code,
          description: coupon.description || "",
          label: describeDiscount(coupon),
        },
        quote: quotePrice(plan, coupon, now),
      });
    } catch (error) {
      console.error("Coupon validate error:", error);

      return res.status(500).json({
        success: false,
        error: "Unable to check the coupon",
      });
    }
  }
);

// ======================================================
// GET /api/subscription/me   (login required)
// ======================================================

router.get("/me", requireAuth, async (req, res) => {
  try {
    const subscription = await findActiveSubscription(req.user.id);

    return res.json({
      success: true,
      active: Boolean(subscription),
      subscription: formatSubscription(subscription),
    });
  } catch (error) {
    console.error("Subscription status error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to load subscription status",
    });
  }
});

// ======================================================
// POST /api/subscription/create-order   (login required)
// Body: { planId, couponCode? }
// The price is ALWAYS worked out here on the server:
//   plan price - plan offer - coupon
// If it comes to Rs 0 the plan is activated at once (no payment).
// ======================================================

router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const plan = await findPlan(req.body?.planId);

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: "Please choose a valid plan",
      });
    }

    const now = new Date();

    const { code, coupon, error: couponError } = await resolveCoupon({
      rawCode: req.body?.couponCode,
      plan,
      userId: req.user.id,
      now,
    });

    if (code && couponError) {
      return res.status(400).json({
        success: false,
        couponError: true,
        error: couponError,
      });
    }

    const quote = quotePrice(plan, coupon, now);

    const purchase = {
      userId: req.user.id,
      planId: plan.planId,
      planName: plan.name,
      price: quote.finalPrice,
      days: plan.days,
      basePrice: quote.basePrice,
      offerDiscount: quote.offerDiscount,
      couponCode: quote.couponCode,
      couponDiscount: quote.couponDiscount,
    };

    // ---------- nothing to pay: activate right away ----------
    if (quote.finalPrice === 0) {
      if (!coupon) {
        const earlier = await Subscription.countDocuments({
          userId: req.user.id,
          planId: plan.planId,
          paid: true,
        });

        if (earlier > 0) {
          return res.status(400).json({
            success: false,
            error: "You have already used this free plan.",
          });
        }
      }

      const { startsAt, expiresAt } = await subscriptionWindow(
        req.user.id,
        plan.days,
        now
      );

      const created = await Subscription.create({
        ...purchase,
        orderId: `free_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        paid: true,
        paymentId: "FREE",
        verifiedAt: now,
        startsAt,
        expiresAt,
      });

      return res.json({
        success: true,
        free: true,
        message: "Subscription activated successfully",
        quote,
        subscription: formatSubscription(created.toObject()),
      });
    }

    // ---------- normal paid order ----------
    const razorpayOrder = await razorpay.orders.create({
      amount: quote.finalPrice * 100,
      currency: "INR",
      receipt: `sub_${Date.now()}`,
    });

    await Subscription.create({
      ...purchase,
      orderId: razorpayOrder.id,
      paid: false,
    });

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: { id: plan.planId, name: plan.name, price: quote.finalPrice },
      quote,
      ...razorpayOrder,
    });
  } catch (error) {
    console.error("Subscription create-order error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create payment order",
    });
  }
});

// ======================================================
// POST /api/subscription/verify   (login required)
// ======================================================

router.post("/verify", requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Payment details are missing",
      });
    }

    const order = await Subscription.findOne({
      orderId: String(razorpay_order_id),
    }).lean();

    if (!order || String(order.userId) !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Signature check
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    let isValid = false;

    try {
      const expected = Buffer.from(expectedSignature, "hex");
      const received = Buffer.from(String(razorpay_signature), "hex");

      isValid =
        expected.length === received.length &&
        crypto.timingSafeEqual(expected, received);
    } catch (error) {
      isValid = false;
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    // Pehle se paid hai (double verify) -> wahi result do
    if (order.paid) {
      const current = await findActiveSubscription(req.user.id);

      return res.json({
        success: true,
        message: "Subscription already activated",
        subscription: formatSubscription(current),
      });
    }

    // Agar abhi koi plan chal raha hai to naya plan uske baad se shuru hoga
    const active = await findActiveSubscription(req.user.id);
    const now = new Date();

    const startsAt =
      active && new Date(active.expiresAt) > now
        ? new Date(active.expiresAt)
        : now;

    const expiresAt = new Date(startsAt.getTime() + order.days * DAY_MS);

    const updated = await Subscription.findOneAndUpdate(
      { orderId: order.orderId, userId: req.user.id, paid: false },
      {
        $set: {
          paid: true,
          paymentId: String(razorpay_payment_id),
          verifiedAt: now,
          startsAt,
          expiresAt,
        },
      },
      { new: true }
    ).lean();

    // Kisi aur request ne abhi activate kar diya
    if (!updated) {
      const current = await findActiveSubscription(req.user.id);

      return res.json({
        success: true,
        message: "Subscription already activated",
        subscription: formatSubscription(current),
      });
    }

    return res.json({
      success: true,
      message: "Subscription activated successfully",
      subscription: formatSubscription(updated),
    });
  } catch (error) {
    console.error("Subscription verify error:", error);

    return res.status(500).json({
      success: false,
      error: "Payment verification failed",
    });
  }
});

// ======================================================
// GET /api/subscription/admin/list   (admin only)
// Sabhi paid subscriptions + total revenue
// ======================================================

router.get("/admin/list", requireAdmin, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ paid: true })
      .sort({ verifiedAt: -1 })
      .limit(500)
      .lean();

    const userIds = [
      ...new Set(subscriptions.map((sub) => String(sub.userId))),
    ];

    const users = await User.find({ _id: { $in: userIds } })
      .select("_id fullName email")
      .lean();

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const now = Date.now();

    const rows = subscriptions.map((sub) => {
      const user = userMap.get(String(sub.userId));

      return {
        orderId: sub.orderId,
        paymentId: sub.paymentId,
        planName: sub.planName,
        price: sub.price,
        basePrice: sub.basePrice || sub.price,
        offerDiscount: sub.offerDiscount || 0,
        couponCode: sub.couponCode || "",
        couponDiscount: sub.couponDiscount || 0,
        startsAt: sub.startsAt,
        expiresAt: sub.expiresAt,
        verifiedAt: sub.verifiedAt,
        isActive: new Date(sub.expiresAt).getTime() > now,
        user: user
          ? { id: String(user._id), fullName: user.fullName, email: user.email }
          : null,
      };
    });

    return res.json({
      success: true,
      totalRevenue: rows.reduce((sum, row) => sum + row.price, 0),
      activeCount: rows.filter((row) => row.isActive).length,
      subscriptions: rows,
    });
  } catch (error) {
    console.error("Admin subscriptions error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to load subscriptions",
    });
  }
});

module.exports = router;