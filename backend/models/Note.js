const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    categorySlug: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    categoryTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    subcategorySlug: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    subcategoryTitle: {
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

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    pdf: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    content: {
      type: String,
      default: "",
    },

    // language of the note text
    language: {
      type: String,
      enum: ["en", "hi", "bilingual"],
      default: "en",
    },

    // ordered content blocks made from a Word file (heading, paragraph,
    // image, list, table). "content" above is the same text as HTML, so the
    // Read Note page works for both manual and Word notes.
    blocks: {
      type: Array,
      default: [],
    },

    source: {
      type: String,
      enum: ["manual", "docx"],
      default: "manual",
    },

    sourceFileName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 255,
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
  mongoose.models.Note ||
  mongoose.model("Note", noteSchema);