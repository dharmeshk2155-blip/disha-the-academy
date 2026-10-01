const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Subscription = require("../models/Subscription");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const { getPlan, getPublicPlans } = require("../utils/plans");
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
// ======================================================

router.get("/plans", (req, res) => {
  return res.json({
    success: true,
    plans: getPublicPlans(),
  });
});

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
// Body: { planId }
// Price hamesha server ki plans.js se aata hai.
// ======================================================

router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const plan = getPlan(req.body?.planId);

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: "Please choose a valid plan",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(plan.price * 100),
      currency: "INR",
      receipt: `sub_${Date.now()}`,
    });

    await Subscription.create({
      orderId: razorpayOrder.id,
      userId: req.user.id,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      days: plan.days,
      paid: false,
    });

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: { id: plan.id, name: plan.name, price: plan.price },
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