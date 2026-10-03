/* =====================================================
   Test category = what KIND of test it is
   (previous_year | sectional | full)
   Used by both admin test pages (Tests and Free Tests).
===================================================== */

export const TEST_CATEGORY_OPTIONS = [
  { value: "previous_year", label: "Previous Year Test" },
  { value: "sectional", label: "Sectional Test" },
  { value: "full", label: "Full Test" },
];

export function testCategoryLabel(value) {
  return (
    TEST_CATEGORY_OPTIONS.find((o) => o.value === value)?.label || ""
  );
}

// small pill shown under the test title in the admin list
export function TestCategoryBadge({ value }) {
  const label = testCategoryLabel(value);

  return (
    <span
      style={{
        display: "inline-block",
        marginTop: 4,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 999,
        color: label ? "#1d4f91" : "#9a6400",
        background: label ? "#e3efff" : "#fff3d6",
      }}
    >
      {label || "Category not set"}
    </span>
  );
}

// form field: <select name="testCategory">
// onChange must accept a normal change event (same as the other fields)
export function TestCategorySelect({ value, onChange, disabled }) {
  return (
    <div className="admin-test-form-field">
      <label htmlFor="testCategory">Test Category *</label>

      <select
        id="testCategory"
        name="testCategory"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">Select test category</option>

        {TEST_CATEGORY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}