const express = require("express");

const ExamCategory = require("../models/ExamCategory");
const Test = require("../models/Test");

/*
  EXAMS & CATEGORIES

  publicRouter  GET /api/exam-taxonomy            (website, no login)
  adminRouter   /api/admin/exam-taxonomy/...      (admin login required,
                                                   mounted in server.js)
*/

const publicRouter = express.Router();
const adminRouter = express.Router();

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function clean(value) {
  return String(value ?? "").trim();
}

function slugify(text) {
  return clean(text)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

function pickRegion(value) {
  return clean(value) === "himachal-pradesh" ? "himachal-pradesh" : "";
}

function isHttpUrl(value) {
  return /^https?:\/\/\S+$/i.test(value);
}

function format(doc) {
  return {
    slug: doc.slug,
    title: doc.title,
    fullName: doc.fullName || "",
    icon: doc.icon || "📄",
    region: doc.region || "",
    isBuiltIn: doc.isBuiltIn === true,
    subExams: (doc.subExams || []).map((s) => ({
      slug: s.slug,
      name: s.name,
      iconUrl: s.iconUrl || "",
    })),
  };
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

/* ---------------------------------------------------
   PUBLIC - everything the website needs to merge
--------------------------------------------------- */
publicRouter.get("/", async (req, res) => {
  try {
    const docs = await ExamCategory.find({ isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    return res.json(docs.map(format));
  } catch (error) {
    console.error("Exam taxonomy load error:", error);
    return fail(res, 500, "Failed to load exams.");
  }
});

/* ---------------------------------------------------
   ADMIN - new category / body
--------------------------------------------------- */
adminRouter.post("/categories", async (req, res) => {
  try {
    const title = clean(req.body.title);

    if (title.length < 2 || title.length > 60) {
      return fail(res, 400, "Name must be 2 to 60 characters.");
    }

    const slug = clean(req.body.slug).toLowerCase() || slugify(title);

    if (!SLUG_PATTERN.test(slug)) {
      return fail(
        res,
        400,
        "Short name can only have small letters, numbers and dashes."
      );
    }

    if (await ExamCategory.exists({ slug })) {
      return fail(res, 409, "A category with this short name already exists.");
    }

    const doc = await ExamCategory.create({
      slug,
      title,
      fullName: clean(req.body.fullName).slice(0, 120),
      icon: clean(req.body.icon).slice(0, 8) || "📄",
      region: pickRegion(req.body.region),
      isBuiltIn: false,
      subExams: [],
    });

    return res.status(201).json({ success: true, category: format(doc) });
  } catch (error) {
    console.error("Create exam category error:", error);
    return fail(res, 500, "Failed to add category.");
  }
});

/* ---------------------------------------------------
   ADMIN - edit a category the admin created
--------------------------------------------------- */
adminRouter.put("/categories/:slug", async (req, res) => {
  try {
    const doc = await ExamCategory.findOne({ slug: clean(req.params.slug) });

    if (!doc) return fail(res, 404, "Category not found.");

    if (doc.isBuiltIn) {
      return fail(res, 400, "Built-in categories cannot be edited.");
    }

    const title = clean(req.body.title);

    if (title.length < 2 || title.length > 60) {
      return fail(res, 400, "Name must be 2 to 60 characters.");
    }

    doc.title = title;
    doc.fullName = clean(req.body.fullName).slice(0, 120);
    doc.icon = clean(req.body.icon).slice(0, 8) || "📄";
    doc.region = pickRegion(req.body.region);

    await doc.save();

    return res.json({ success: true, category: format(doc) });
  } catch (error) {
    console.error("Update exam category error:", error);
    return fail(res, 500, "Failed to update category.");
  }
});

/* ---------------------------------------------------
   ADMIN - delete a category (only when it has no tests)
--------------------------------------------------- */
adminRouter.delete("/categories/:slug", async (req, res) => {
  try {
    const slug = clean(req.params.slug);
    const doc = await ExamCategory.findOne({ slug });

    if (!doc) return fail(res, 404, "Category not found.");

    const used = await Test.countDocuments({ topCategory: slug });

    if (used > 0) {
      return fail(
        res,
        409,
        `${used} test(s) use this category. Move or delete those tests first.`
      );
    }

    await ExamCategory.deleteOne({ _id: doc._id });

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete exam category error:", error);
    return fail(res, 500, "Failed to delete category.");
  }
});

/* ---------------------------------------------------
   ADMIN - add an exam inside a category
   (category may be a built-in one such as SSC: then the
    website sends categoryTitle so a small extension
    document can be created for it)
--------------------------------------------------- */
adminRouter.post("/categories/:slug/exams", async (req, res) => {
  try {
    const slug = clean(req.params.slug);
    const name = clean(req.body.name);

    if (name.length < 2 || name.length > 80) {
      return fail(res, 400, "Exam name must be 2 to 80 characters.");
    }

    const examSlug = clean(req.body.slug).toLowerCase() || slugify(name);

    if (!SLUG_PATTERN.test(examSlug)) {
      return fail(
        res,
        400,
        "Short name can only have small letters, numbers and dashes."
      );
    }

    const iconUrl = clean(req.body.iconUrl);

    if (iconUrl && !isHttpUrl(iconUrl)) {
      return fail(res, 400, "Logo link must start with http:// or https://");
    }

    let doc = await ExamCategory.findOne({ slug });

    if (!doc) {
      const categoryTitle = clean(req.body.categoryTitle);

      if (!categoryTitle) {
        return fail(res, 404, "Category not found.");
      }

      doc = new ExamCategory({
        slug,
        title: categoryTitle,
        icon: clean(req.body.categoryIcon).slice(0, 8) || "📄",
        isBuiltIn: true,
        subExams: [],
      });
    }

    if (doc.subExams.some((s) => s.slug === examSlug)) {
      return fail(res, 409, "An exam with this short name already exists here.");
    }

    doc.subExams.push({ slug: examSlug, name, iconUrl });
    await doc.save();

    return res.status(201).json({ success: true, category: format(doc) });
  } catch (error) {
    console.error("Add exam error:", error);
    return fail(res, 500, "Failed to add exam.");
  }
});

/* ---------------------------------------------------
   ADMIN - rename an exam / change its logo
--------------------------------------------------- */
adminRouter.put("/categories/:slug/exams/:examSlug", async (req, res) => {
  try {
    const doc = await ExamCategory.findOne({ slug: clean(req.params.slug) });

    if (!doc) return fail(res, 404, "Category not found.");

    const exam = doc.subExams.find(
      (s) => s.slug === clean(req.params.examSlug)
    );

    if (!exam) return fail(res, 404, "Exam not found.");

    const name = clean(req.body.name);

    if (name.length < 2 || name.length > 80) {
      return fail(res, 400, "Exam name must be 2 to 80 characters.");
    }

    const iconUrl = clean(req.body.iconUrl ?? exam.iconUrl);

    if (iconUrl && !isHttpUrl(iconUrl)) {
      return fail(res, 400, "Logo link must start with http:// or https://");
    }

    exam.name = name;
    exam.iconUrl = iconUrl;

    await doc.save();

    return res.json({ success: true, category: format(doc) });
  } catch (error) {
    console.error("Update exam error:", error);
    return fail(res, 500, "Failed to update exam.");
  }
});

/* ---------------------------------------------------
   ADMIN - delete an exam (only when it has no tests)
--------------------------------------------------- */
adminRouter.delete("/categories/:slug/exams/:examSlug", async (req, res) => {
  try {
    const slug = clean(req.params.slug);
    const examSlug = clean(req.params.examSlug);

    const doc = await ExamCategory.findOne({ slug });

    if (!doc) return fail(res, 404, "Category not found.");

    if (!doc.subExams.some((s) => s.slug === examSlug)) {
      return fail(res, 404, "Exam not found.");
    }

    const used = await Test.countDocuments({
      topCategory: slug,
      subExam: examSlug,
    });

    if (used > 0) {
      return fail(
        res,
        409,
        `${used} test(s) use this exam. Move or delete those tests first.`
      );
    }

    doc.subExams = doc.subExams.filter((s) => s.slug !== examSlug);

    // an extension document with nothing left in it is no longer needed
    if (doc.isBuiltIn && doc.subExams.length === 0) {
      await ExamCategory.deleteOne({ _id: doc._id });
    } else {
      await doc.save();
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete exam error:", error);
    return fail(res, 500, "Failed to delete exam.");
  }
});

module.exports = { publicRouter, adminRouter };