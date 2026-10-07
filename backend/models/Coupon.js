const mongoose = require("mongoose");

/*
  Coupon codes that students type on the Pricing page.
  Created and edited in Admin > Subscriptions > Coupons.
  How many times a coupon was used is counted from paid subscriptions,
  so the number can never drift.
*/
const couponSchema = new mongoose.Schema(
  {
    // always stored in capital letters, e.g. "WELCOME20"
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    description: { type: String, default: "", trim: true, maxlength: 120 },

    discountType: {
      type: String,
      enum: ["percent", "flat"],
      required: true,
    },

    // percent: 1-100,  flat: rupees
    discountValue: { type: Number, required: true, min: 1 },

    // percent coupons only: the most a single order can get off (0 = no cap)
    maxDiscount: { type: Number, default: 0, min: 0 },

    // order amount (after the plan offer) must be at least this much
    minAmount: { type: Number, default: 0, min: 0 },

    // plan ids this coupon works on (empty = every plan)
    planIds: { type: [String], default: [] },

    // false = cannot be used on a plan that already has an offer running
    allowWithOffer: { type: Boolean, default: true },

    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },

    // total uses allowed (0 = unlimited)
    usageLimit: { type: Number, default: 0, min: 0 },

    // uses allowed per student
    perUserLimit: { type: Number, default: 1, min: 1 },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);