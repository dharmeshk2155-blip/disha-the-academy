const Test = require("../models/Test");

const requireSubscription =
  require("./requireSubscription");

async function requireTestAccess(
  req,
  res,
  next
) {
  try {
    const testId =
      String(
        req.params.id || ""
      )
        .trim()
        .toLowerCase();

    if (!testId) {
      return res
        .status(400)
        .json({
          error:
            "Test ID is required",
        });
    }

    // ================================
    // FIND ACTIVE TEST
    // ================================

    const test =
      await Test.findOne({
        testId,
        isActive: true,
      }).lean();

    if (!test) {
      return res
        .status(404)
        .json({
          error:
            "Test not found",
        });
    }

    /*
      Save test document so
      routes can reuse it.
    */
    req.testDocument = test;

    // ================================
    // FREE TEST
    // ================================

    if (test.isFree === true) {
      console.log(
        "FREE TEST ACCESS:",
        test.testId
      );

      return next();
    }

    // ================================
    // PREMIUM TEST
    // ================================

    console.log(
      "PREMIUM TEST ACCESS CHECK:",
      test.testId
    );

    return requireSubscription(
      req,
      res,
      next
    );
  } catch (error) {
    console.error(
      "Test access middleware error:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          "Unable to check test access",
      });
  }
}

module.exports =
  requireTestAccess;