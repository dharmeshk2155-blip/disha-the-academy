require("dotenv").config();

const mongoose = require("mongoose");
const { connectMongoDB } = require("./mongoDb");
const Test = require("./models/Test");

async function setFreeTest() {
  try {
    // MongoDB connect
    await connectMongoDB();

    console.log("MongoDB connected");

   const testId =
  "engtest-1";
  
    // Pehle test check karo
    const existingTest =
      await Test.findOne({
        testId,
      }).lean();

    if (!existingTest) {
      console.log("");
      console.log(
        `Test not found: ${testId}`
      );

      console.log("");
      console.log(
        "Available tests:"
      );

      const tests =
        await Test.find({})
          .select(
            "testId title isFree"
          )
          .limit(50)
          .lean();

      tests.forEach(
        (test) => {
          console.log({
            testId:
              test.testId,
            title:
              test.title,
            isFree:
              test.isFree,
          });
        }
      );

      return;
    }

    console.log("");
    console.log(
      "Test found:"
    );

    console.log({
      testId:
        existingTest.testId,

      title:
        existingTest.title,

      oldIsFree:
        existingTest.isFree,
    });

    // Test ko FREE karo
    const result =
      await Test.updateOne(
        {
          testId,
        },
        {
          $set: {
            isFree: true,
          },
        }
      );

    console.log("");
    console.log(
      "Update result:"
    );

    console.log(result);

    // Verify
    const updatedTest =
      await Test.findOne({
        testId,
      })
        .select(
          "testId title isFree isActive"
        )
        .lean();

    console.log("");
    console.log(
      "Updated test:"
    );

    console.log(
      updatedTest
    );

    console.log("");

    if (
      updatedTest?.isFree ===
      true
    ) {
      console.log(
        "SUCCESS: Test is now FREE."
      );
    } else {
      console.log(
        "ERROR: isFree was not updated."
      );
    }
  } catch (error) {
    console.error(
      "Error:",
      error
    );
  } finally {
    await mongoose.disconnect();

    console.log(
      "MongoDB disconnected"
    );
  }
}

setFreeTest();