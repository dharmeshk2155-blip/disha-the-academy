const { findActiveSubscription } = require("../utils/subscriptionAccess");
const { isTestFree } = require("../utils/plans");

// ======================================================
// REQUIRE ACTIVE SUBSCRIPTION  (Mock Tests ke liye)
//
// requireAuth ke BAAD lagana (req.user.id chahiye).
// Route me :id test id hai. FREE_TEST_IDS wale tests
// (utils/plans.js) bina subscription ke khul jate hain.
//
// Usage: router.get("/:id", requireAuth, requireSubscription, handler)
// ======================================================

async function requireSubscription(req, res, next) {
  try {
    if (isTestFree(req.params.id)) {
      return next();
    }

    const subscription = await findActiveSubscription(req.user.id);

    if (!subscription) {
      return res.status(403).json({
        success: false,
        code: "NO_ACTIVE_SUBSCRIPTION",
        error: "Please subscribe to attempt mock tests.",
        message: "Please subscribe to attempt mock tests.",
      });
    }

    req.subscription = subscription;
    return next();
  } catch (error) {
    console.error("requireSubscription error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to check your subscription. Please try again.",
    });
  }
}

module.exports = requireSubscription;