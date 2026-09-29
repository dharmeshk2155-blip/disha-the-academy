const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      index: true,
    },

    testId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
      maxlength: 150,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    optionA: {
      type: String,
      required: true,
      trim: true,
    },

    optionB: {
      type: String,
      required: true,
      trim: true,
    },

    optionC: {
      type: String,
      required: true,
      trim: true,
    },

    optionD: {
      type: String,
      required: true,
      trim: true,
    },

    correctAnswer: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },

    questionTextHi: {
      type: String,
      default: "",
      trim: true,
    },

    optionAHi: {
      type: String,
      default: "",
      trim: true,
    },

    optionBHi: {
      type: String,
      default: "",
      trim: true,
    },

    optionCHi: {
      type: String,
      default: "",
      trim: true,
    },

    optionDHi: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.Question ||
  mongoose.model(
    "Question",
    questionSchema
  );