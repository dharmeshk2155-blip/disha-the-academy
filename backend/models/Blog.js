const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    category: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
      index: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
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

    author: {
      type: String,
      default: "Disha The Academy",
      trim: true,
      maxlength: 150,
    },

    publishedDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Published",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.Blog ||
  mongoose.model("Blog", blogSchema);