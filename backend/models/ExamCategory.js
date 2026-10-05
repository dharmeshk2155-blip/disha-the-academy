const mongoose = require("mongoose");

/*
  Exams that the admin adds from the admin panel (Exams & Categories).

  The built-in exams (SSC, Banking, HPPSC ...) live in the frontend file
  data/examTaxonomy.js. This collection only holds ADDITIONS:

   - a brand new category / body  (isBuiltIn: false)
   - extra exams added to a built-in category such as SSC (isBuiltIn: true,
     the document then only carries the new subExams)

  The website merges both lists, so a new exam shows up everywhere
  (home, exam lists, test forms, filters) without changing code.
*/

const subExamSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    iconUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const examCategorySchema = new mongoose.Schema(
  {
    // short address name, e.g. "hppsc"  ->  /take-mock-test/hppsc
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    // e.g. "Himachal Pradesh Public Service Commission"
    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    icon: {
      type: String,
      default: "📄",
      trim: true,
    },

    // "himachal-pradesh" = also listed on the Himachal Pradesh page
    region: {
      type: String,
      enum: ["", "himachal-pradesh"],
      default: "",
    },

    // true = this document only adds exams to a built-in category
    isBuiltIn: {
      type: Boolean,
      default: false,
    },

    subExams: {
      type: [subExamSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ExamCategory ||
  mongoose.model("ExamCategory", examCategorySchema);