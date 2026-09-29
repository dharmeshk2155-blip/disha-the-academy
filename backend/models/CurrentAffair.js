const mongoose = require("mongoose");

const currentAffairSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      summary: {
        type: String,
        required: true,
        trim: true,
      },

      publishedDate: {
        type: Date,
        required: true,
        index: true,
      },

      category: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true,
      },

      imageUrl: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },

      content: {
        type: String,
        required: true,
        trim: true,
      },

      keyPoints: {
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
  mongoose.models.CurrentAffair ||
  mongoose.model(
    "CurrentAffair",
    currentAffairSchema
  );