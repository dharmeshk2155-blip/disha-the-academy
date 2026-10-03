/* =====================================================
   ONE-TIME SCRIPT: give OLD tests a testCategory
   (previous_year | sectional | full)

   It guesses from the test title / id:
     "previous", "pyp", "pyq", "year", "paper"  -> previous_year
     "sectional", "section"                     -> sectional
     anything else                              -> full

   SAFE BY DEFAULT: without --apply it only PRINTS what it
   would do. Tests that already have a category are never touched.

   Run from the backend folder:
     node migrateTestCategory.js            (preview only)
     node migrateTestCategory.js --apply    (save to database)
===================================================== */

require("dotenv").config();

const mongoose = require("mongoose");
const { connectMongoDB } = require("./mongoDb");
const Test = require("./models/Test");

function guess(test) {
  const text = `${test.title || ""} ${test.testId || ""}`.toLowerCase();

  if (/(previous|\bpyp\b|\bpyq\b|\byear\b|\bpaper\b|-pyp-|-pyq-)/.test(text)) {
    return "previous_year";
  }

  if (/(sectional|section)/.test(text)) {
    return "sectional";
  }

  return "full";
}

async function run() {
  const apply = process.argv.includes("--apply");

  try {
    await connectMongoDB();

    const tests = await Test.find({
      $or: [
        { testCategory: { $exists: false } },
        { testCategory: null },
        { testCategory: "" },
      ],
    })
      .select("testId title isFree")
      .lean();

    if (!tests.length) {
      console.log("All tests already have a category. Nothing to do.");
      return;
    }

    console.log(
      apply
        ? `Updating ${tests.length} test(s)...`
        : `PREVIEW ONLY (add --apply to save). ${tests.length} test(s) without category:`
    );
    console.log("");

    for (const test of tests) {
      const category = guess(test);

      console.log(
        `${category.padEnd(14)} ${test.isFree ? "[free] " : "       "}${test.testId}  -  ${test.title}`
      );

      if (apply) {
        await Test.updateOne(
          { _id: test._id },
          { $set: { testCategory: category } }
        );
      }
    }

    console.log("");
    console.log(
      apply
        ? "Done. You can change any test later from the admin panel."
        : "Nothing was saved. If the guesses look right, run again with --apply."
    );
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

run();