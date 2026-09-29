const mongoose = require("mongoose");

const aboutPageSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
      },

      introduction: {
        type: String,
        default: "",
        trim: true,
      },

      content: {
        type: String,
        default: "",
        trim: true,
      },

      mission: {
        type: String,
        default: "",
        trim: true,
      },

      vision: {
        type: String,
        default: "",
        trim: true,
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
  mongoose.models.AboutPage ||
  mongoose.model(
    "AboutPage",
    aboutPageSchema
  );