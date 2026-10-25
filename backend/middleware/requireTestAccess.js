const Test = require("../models/Test");

const requireSubscription =
  require("./requireSubscription");

const {
  runningLiveFor,
  upcomingLiveFor,
  formatIST,
} = require("../utils/live");

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
    // LIVE TEST
    // free for every logged-in student while the live window is open,
    // and closed for everybody until it starts
    // ================================

    const liveNow = await runningLiveFor(test.testId);

    if (liveNow) {
      req.liveTest = liveNow;
      return next();
    }

    const liveSoon = await upcomingLiveFor(test.testId);

    if (liveSoon) {
      return res.status(403).json({
        error: `This is a live test. It starts on ${formatIST(liveSoon.startsAt)}.`,
        code: "LIVE_NOT_STARTED",
        startsAt: liveSoon.startsAt,
      });
    }

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