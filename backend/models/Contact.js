const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

module.exports =
  mongoose.models.Contact ||
  mongoose.model(
    "Contact",
    contactSchema
  );