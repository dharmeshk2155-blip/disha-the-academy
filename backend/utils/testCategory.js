/* =====================================================
   TEST CATEGORY  (what KIND of test it is)

     previous_year  ->  Previous Year Test
     sectional      ->  Sectional Test
     full           ->  Full Test

   Not the same as Test.category (that is the exam group
   such as "HP Police") and not Free/Premium (isFree).
===================================================== */

const TEST_CATEGORIES = ["previous_year", "sectional", "full"];

const TEST_CATEGORY_LABELS = {
  previous_year: "Previous Year Test",
  sectional: "Sectional Test",
  full: "Full Test",
};

const ALIASES = {
  previous_year: "previous_year",
  previousyear: "previous_year",
  previous_year_test: "previous_year",
  pyp: "previous_year",
  pyt: "previous_year",

  sectional: "sectional",
  sectional_test: "sectional",
  section: "sectional",

  full: "full",
  full_test: "full",
  full_mock: "full",
};

// returns "previous_year" | "sectional" | "full" | "" (invalid / empty)
function normalizeTestCategory(value) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return ALIASES[key] || "";
}

module.exports = {
  TEST_CATEGORIES,
  TEST_CATEGORY_LABELS,
  normalizeTestCategory,
};