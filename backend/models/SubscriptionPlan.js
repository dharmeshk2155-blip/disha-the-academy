const mongoose = require("mongoose");

/*
  Subscription plans that the admin manages from the admin panel
  (Admin > Subscriptions > Plans).

  price      = normal price (MRP)
  offer      = optional automatic discount on this plan (e.g. a festival sale)
  The price a student pays is worked out on the server (utils/pricing.js).
*/
const offerSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },

    // "percent" -> value is 1-100, "flat" -> value is rupees off
    type: {
      type: String,
      enum: ["percent", "flat"],
      default: "percent",
    },

    value: { type: Number, default: 0, min: 0 },

    // shown on the plan card, e.g. "Diwali Sale"
    label: { type: String, default: "", trim: true, maxlength: 40 },

    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { _id: false }
);

const subscriptionPlanSchema = new mongoose.Schema(
  {
    // short, permanent id such as "1-month" (saved on every purchase)
    planId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 40 },

    description: { type: String, default: "", trim: true, maxlength: 150 },

    price: { type: Number, required: true, min: 0 },

    days: { type: Number, required: true, min: 1 },

    badge: { type: String, default: "", trim: true, maxlength: 20 },

    // bullet points on the plan card
    features: { type: [String], default: [] },

    sortOrder: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true, index: true },

    offer: { type: offerSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", subscriptionPlanSchema);