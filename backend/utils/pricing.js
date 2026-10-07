/* =====================================================
   PRICE CALCULATION  (pure functions, no database)

   Order of discounts:
     1. plan price (MRP)
     2. minus the plan's automatic OFFER (if it is running now)
     3. minus the COUPON (worked out on the price after the offer)

   Everything is in whole rupees. A price is either 0 or at least
   Rs 1 (Razorpay cannot charge less than Rs 1).
===================================================== */

const toInt = (n) => Math.max(0, Math.round(Number(n) || 0));

function isOfferActive(offer, now = new Date()) {
  if (!offer || !offer.enabled) return false;
  if (!(Number(offer.value) > 0)) return false;
  if (offer.startsAt && new Date(offer.startsAt) > now) return false;
  if (offer.endsAt && new Date(offer.endsAt) < now) return false;
  return true;
}

function offerDiscountFor(basePrice, offer, now = new Date()) {
  if (!isOfferActive(offer, now)) return 0;

  const raw =
    offer.type === "flat"
      ? Number(offer.value)
      : (basePrice * Number(offer.value)) / 100;

  return Math.min(toInt(raw), basePrice);
}

function couponDiscountFor(amount, coupon) {
  if (!coupon) return 0;

  let raw =
    coupon.discountType === "flat"
      ? Number(coupon.discountValue)
      : (amount * Number(coupon.discountValue)) / 100;

  raw = toInt(raw);

  if (coupon.discountType === "percent" && Number(coupon.maxDiscount) > 0) {
    raw = Math.min(raw, toInt(coupon.maxDiscount));
  }

  return Math.min(raw, amount);
}

/*
  quotePrice(plan, coupon?, now?)
  -> { basePrice, offerDiscount, priceAfterOffer,
       couponCode, couponDiscount, finalPrice }
*/
function quotePrice(plan, coupon = null, now = new Date()) {
  const basePrice = toInt(plan.price);
  const offerDiscount = offerDiscountFor(basePrice, plan.offer, now);
  const priceAfterOffer = basePrice - offerDiscount;
  const couponDiscount = couponDiscountFor(priceAfterOffer, coupon);

  return {
    basePrice,
    offerDiscount,
    priceAfterOffer,
    couponCode: coupon ? coupon.code : "",
    couponDiscount,
    finalPrice: priceAfterOffer - couponDiscount,
  };
}

/*
  checkCoupon(coupon, context) -> "" when the coupon can be used,
  otherwise a short message for the student.

  context = {
    planId, amountAfterOffer, hasOffer, now,
    totalUsed   - paid purchases that used this coupon
    userUsed    - paid purchases by THIS student that used it
  }
*/
function checkCoupon(coupon, context) {
  const now = context.now || new Date();

  if (!coupon || coupon.isActive === false) {
    return "This coupon code is not valid.";
  }

  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return "This coupon is not active yet.";
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return "This coupon has expired.";
  }

  if (
    Array.isArray(coupon.planIds) &&
    coupon.planIds.length > 0 &&
    !coupon.planIds.includes(context.planId)
  ) {
    return "This coupon is not valid for the selected plan.";
  }

  if (coupon.allowWithOffer === false && context.hasOffer) {
    return "This coupon cannot be combined with the current offer on this plan.";
  }

  if (
    Number(coupon.minAmount) > 0 &&
    context.amountAfterOffer < Number(coupon.minAmount)
  ) {
    return `This coupon needs a minimum order of ₹${toInt(coupon.minAmount)}.`;
  }

  if (
    Number(coupon.usageLimit) > 0 &&
    (context.totalUsed || 0) >= Number(coupon.usageLimit)
  ) {
    return "This coupon has reached its usage limit.";
  }

  if ((context.userUsed || 0) >= Math.max(Number(coupon.perUserLimit) || 1, 1)) {
    return "You have already used this coupon.";
  }

  return "";
}

// "20% off up to ₹100"  /  "₹50 off"
function describeDiscount(item) {
  if (item.type === "flat" || item.discountType === "flat") {
    return `₹${toInt(item.value ?? item.discountValue)} off`;
  }

  const percent = Number(item.value ?? item.discountValue);
  const cap = Number(item.maxDiscount) > 0 ? ` up to ₹${toInt(item.maxDiscount)}` : "";

  return `${percent}% off${cap}`;
}

module.exports = {
  checkCoupon,
  couponDiscountFor,
  describeDiscount,
  isOfferActive,
  offerDiscountFor,
  quotePrice,
  toInt,
};