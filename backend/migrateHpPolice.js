/* =====================================================
   ONE-TIME SCRIPT: move old HP Police tests to the new
   "HP Police" board (Himachal Pradesh page)

   Before:  Police Exams  >  Himachal Pradesh Police   (police / state-police)
   After:   HP Police     >  Police Constable          (hp-police / constable)
                           >  Sub-Inspector            (hp-police / sub-inspector)

   It decides from the test title:
     contains "sub-inspector" / "sub inspector" / "SI"  -> sub-inspector
     contains "constable"                                -> constable
     anything else                                       -> NOT moved (listed)

   SAFE BY DEFAULT: without --apply it only PRINTS what it would do.

   Run from the backend folder:
     node migrateHpPolice.js            (preview only)
     node migrateHpPolice.js --apply    (save to database)
===================================================== */

require("dotenv").config();

const mongoose = require("mongoose");
const { connectMongoDB } = require("./mongoDb");
const Test = require("./models/Test");

function target(test) {
  const text = `${test.title || ""} ${test.testId || ""}`.toLowerCase();

  if (/(sub[\s-]?inspector|\bsi\b)/.test(text)) return "sub-inspector";
  if (/constable/.test(text)) return "constable";

  return "";
}

async function run() {
  const apply = process.argv.includes("--apply");

  try {
    await connectMongoDB();

    const tests = await Test.find({
      topCategory: "police",
      subExam: "state-police",
    })
      .select("testId title")
      .lean();

    if (!tests.length) {
      console.log("No tests found in Police > Himachal Pradesh Police.");
      return;
    }

    console.log(
      apply
        ? `Moving tests...`
        : `PREVIEW ONLY (add --apply to save). ${tests.length} test(s) found:`
    );
    console.log("");

    let moved = 0;
    const left = [];

    for (const test of tests) {
      const subExam = target(test);

      if (!subExam) {
        left.push(test);
        continue;
      }

      console.log(
        `${subExam.padEnd(14)} ${test.testId}  -  ${test.title}`
      );

      if (apply) {
        await Test.updateOne(
          { _id: test._id },
          {
            $set: {
              topCategory: "hp-police",
              category: "HP Police Exams",
              subExam,
            },
          }
        );
      }

      moved += 1;
    }

    console.log("");

    if (left.length) {
      console.log(
        `${left.length} test(s) NOT moved (title has no "constable" / "sub-inspector").`
      );
      console.log(
        "Change these in the admin panel (edit the test, pick HP Police Exams):"
      );

      left.forEach((t) => console.log(`   ${t.testId}  -  ${t.title}`));
      console.log("");
    }

    console.log(
      apply
        ? `Done. ${moved} test(s) moved.`
        : `Nothing was saved. ${moved} test(s) would move. Run again with --apply.`
    );
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

run();