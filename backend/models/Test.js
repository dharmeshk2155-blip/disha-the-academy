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

module.exports =
  mongoose.models.Test ||
  mongoose.model("Test", testSchema);