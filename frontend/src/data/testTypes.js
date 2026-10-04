// The 3 kinds of test (Test.testCategory in the database).
// slug  = used in the page address  (/take-mock-test/ssc/cgl/sectional)
// value = what is saved on the test (previous_year | sectional | full)

export const TEST_TYPES = [
  {
    slug: "previous-year",
    value: "previous_year",
    label: "Previous Year Tests",
    singular: "Previous Year Test",
    desc: "Solve papers from earlier years in real exam conditions.",
  },
  {
    slug: "sectional",
    value: "sectional",
    label: "Sectional Tests",
    singular: "Sectional Test",
    desc: "Practice one subject or section at a time.",
  },
  {
    slug: "full",
    value: "full",
    label: "Full Tests",
    singular: "Full Test",
    desc: "Complete exam-pattern mock tests.",
  },
];

// older tests that have no type yet are kept visible here
export const OTHER_TYPE = {
  slug: "other",
  value: "other",
  label: "Other Tests",
  singular: "Other Test",
  desc: "Tests that are not sorted into a type yet.",
};

export function typeBySlug(slug) {
  return [...TEST_TYPES, OTHER_TYPE].find((t) => t.slug === slug);
}

export function typeByValue(value) {
  return [...TEST_TYPES, OTHER_TYPE].find((t) => t.value === value);
}

// "previous_year" | "sectional" | "full" | "other"
export function typeKeyOf(test) {
  return TEST_TYPES.some((t) => t.value === test?.testCategory)
    ? test.testCategory
    : "other";
}

// { previous_year: 3, sectional: 5, full: 2, other: 0 }
export function countByType(tests) {
  const counts = { previous_year: 0, sectional: 0, full: 0, other: 0 };

  tests.forEach((t) => {
    counts[typeKeyOf(t)] += 1;
  });

  return counts;
}

// ["en","hi"] -> "English + हिन्दी"
export function languageLabel(languages) {
  const en = languages?.includes("en");
  const hi = languages?.includes("hi");

  if (en && hi) return "English + हिन्दी";
  if (hi) return "हिन्दी";
  if (en) return "English";

  return "";
}