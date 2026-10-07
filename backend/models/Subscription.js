const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: String,
      required: true,
      trim: true,
    },

    planName: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    days: {
      type: Number,
      required: true,
      min: 1,
    },

    // price = what the student actually paid.
    // The numbers below show how that price was reached.
    basePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // automatic plan offer taken off basePrice
    offerDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // coupon used on this purchase ("" = none)
    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paid: {
      type: Boolean,
      default: false,
      index: true,
    },

    paymentId: {
      type: String,
      default: "",
      trim: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // Payment verify hone par set hota hai
    startsAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);