const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    resultId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      min: 1,
    },

    testId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    testTitle: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },

    wrongCount: {
      type: Number,
      required: true,
      min: 0,
    },

    unansweredCount: {
      type: Number,
      required: true,
      min: 0,
    },

    score: {
      type: Number,
      required: true,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    review: {
      type: Array,
      default: [],
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.Result ||
  mongoose.model(
    "Result",
    resultSchema
  );