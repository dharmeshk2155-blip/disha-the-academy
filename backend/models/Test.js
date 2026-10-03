const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    testId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Duration in seconds
    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    marksPerCorrect: {
      type: Number,
      required: true,
      min: 0,
    },

    negativeMarking: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /*
      Kind of test: previous_year | sectional | full
      (no default on purpose - older tests get it from the
      migration script, new tests must choose one)
    */
    testCategory: {
      type: String,
      enum: ["previous_year", "sectional", "full"],
      index: true,
    },

    topCategory: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    subExam: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    /*
      IMPORTANT

      true  = Free Test
      false = Premium/Normal Test
    */
    isFree: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

testSchema.index({
  isActive: 1,
  isFree: 1,
});

module.exports =
  mongoose.models.Test ||
  mongoose.model(
    "Test",
    testSchema
  );