import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import {
  Search,
  Plus,
  FileQuestion,
  Clock3,
  Trophy,
  Pencil,
  Trash2,
  RefreshCw,
  BookOpenCheck,
  Filter,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { EXAM_TAXONOMY } from "../../data/examTaxonomy";
import "./AdminTests.css";
const navigate = useNavigate();

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const INITIAL_FORM = {
  testId: "",
  topCategory: "",
  subExam: "",
  category: "",
  title: "",
  subject: "",
  durationMinutes: "",
  marksPerCorrect: "1",
  negativeMarking: "0.25",
};

function AdminTests() {
  const { adminKey } = useOutletContext();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/admin/tests`, {
        method: "GET",
        headers: {
          "x-admin-key": adminKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load tests");
      }

      setTests(Array.isArray(data.tests) ? data.tests : []);
    } catch (err) {
      console.error("Admin tests fetch error:", err);
      setError(err.message || "Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [adminKey]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        tests
          .map((test) => test.topCategory)
          .filter(Boolean)
      ),
    ];
  }, [tests]);

  const filteredTests = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return tests.filter((test) => {
      const matchesCategory =
        categoryFilter === "all" ||
        test.topCategory === categoryFilter;

      const matchesSearch =
        !searchValue ||
        test.title?.toLowerCase().includes(searchValue) ||
        test.testId?.toLowerCase().includes(searchValue) ||
        test.category?.toLowerCase().includes(searchValue) ||
        test.subject?.toLowerCase().includes(searchValue) ||
        test.topCategory?.toLowerCase().includes(searchValue) ||
        test.subExam?.toLowerCase().includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }, [tests, search, categoryFilter]);

  const totalQuestions = useMemo(() => {
    return tests.reduce(
      (total, test) => total + Number(test.totalQuestions || 0),
      0
    );
  }, [tests]);

  const averageDuration = useMemo(() => {
    if (!tests.length) return 0;

    const totalSeconds = tests.reduce(
      (total, test) => total + Number(test.duration || 0),
      0
    );

    return Math.round(totalSeconds / tests.length / 60);
  }, [tests]);

  const selectedExamGroup = useMemo(() => {
    return EXAM_TAXONOMY.find(
      (group) => group.slug === form.topCategory
    );
  }, [form.topCategory]);

  const formatDuration = (seconds) => {
    const value = Number(seconds) || 0;

    if (value < 60) {
      return `${value} sec`;
    }

    const minutes = Math.round(value / 60);

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  const formatSlug = (value) => {
    if (!value) return "—";

    return value
      .split("-")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  const openAddModal = () => {
  setEditingTestId(null);
  setForm(INITIAL_FORM);
  setFormError("");
  setSuccessMessage("");
  setShowAddModal(true);
};

  const closeAddModal = () => {
  if (saving) return;

  setShowAddModal(false);
  setEditingTestId(null);
  setForm(INITIAL_FORM);
  setFormError("");
  setSuccessMessage("");
};

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "topCategory") {
      const group = EXAM_TAXONOMY.find(
        (item) => item.slug === value
      );

      setForm((current) => ({
        ...current,
        topCategory: value,
        subExam: "",
        category: group?.title || "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

 const handleCreateTest = async (event) => {
  event.preventDefault();

  setFormError("");
  setSuccessMessage("");

  const testId = form.testId.trim().toLowerCase();
  const category = form.category.trim();
  const title = form.title.trim();
  const subject = form.subject.trim();

  const durationMinutes = Number(form.durationMinutes);
  const marksPerCorrect = Number(form.marksPerCorrect);
  const negativeMarking = Number(form.negativeMarking);

  // Required fields validation
  if (
    !testId ||
    !form.topCategory ||
    !form.subExam ||
    !category ||
    !title ||
    !subject ||
    !form.durationMinutes ||
    form.marksPerCorrect === "" ||
    form.negativeMarking === ""
  ) {
    setFormError("Please fill all required fields.");
    return;
  }

  // Test ID validation
  if (!/^[a-z0-9-]+$/.test(testId)) {
    setFormError(
      "Test ID can contain only lowercase letters, numbers and hyphens."
    );
    return;
  }

  // Duration validation
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  ) {
    setFormError("Duration must be greater than 0 minutes.");
    return;
  }

  // Marks validation
  if (
    !Number.isFinite(marksPerCorrect) ||
    marksPerCorrect <= 0
  ) {
    setFormError(
      "Marks per correct answer must be greater than 0."
    );
    return;
  }

  // Negative marking validation
  if (
    !Number.isFinite(negativeMarking) ||
    negativeMarking < 0
  ) {
    setFormError(
      "Negative marking cannot be less than 0."
    );
    return;
  }

  try {
    setSaving(true);

    // Check whether we are creating or editing
    const isEditing = Boolean(editingTestId);

    // EDIT = PUT
    // ADD = POST
    const url = isEditing
      ? `${API_BASE}/api/admin/tests/${encodeURIComponent(
          editingTestId
        )}`
      : `${API_BASE}/api/admin/tests`;

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",

      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },

      body: JSON.stringify({
        testId,
        category,
        title,
        subject,

        // Frontend minutes -> Backend seconds
        duration: Math.round(durationMinutes * 60),

        marksPerCorrect,
        negativeMarking,
        topCategory: form.topCategory,
        subExam: form.subExam,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          (isEditing
            ? "Failed to update test."
            : "Failed to create test.")
      );
    }

    // Success message
    setSuccessMessage(
      isEditing
        ? "Test updated successfully."
        : "Test created successfully."
    );

    // Refresh test table
    await fetchTests();

    // Close modal after success
    setTimeout(() => {
      setShowAddModal(false);
      setEditingTestId(null);
      setForm(INITIAL_FORM);
      setSuccessMessage("");
    }, 900);
  } catch (err) {
    console.error("Save test error:", err);

    setFormError(
      err.message || "Failed to save test."
    );
  } finally {
    setSaving(false);
  }
};

  const handleManageQuestions = (test) => {
  navigate(
    `/admin/tests/${encodeURIComponent(test.testId)}/questions`
  );
};

 const handleEdit = (test) => {
  setEditingTestId(test.testId);

  setForm({
    testId: test.testId || "",
    topCategory: test.topCategory || "",
    subExam: test.subExam || "",
    category: test.category || "",
    title: test.title || "",
    subject: test.subject || "",
    durationMinutes: test.duration
      ? String(Math.round(Number(test.duration) / 60))
      : "",
    marksPerCorrect: String(test.marksPerCorrect ?? 1),
    negativeMarking: String(test.negativeMarking ?? 0),
  });

  setFormError("");
  setSuccessMessage("");
  setShowAddModal(true);
};

  const handleDelete = (test) => {
    alert(
      `Delete Test: ${test.title}\n\nDelete functionality next step mein connect karenge.`
    );
  };

  return (
    <div className="admin-tests-page">
      <div className="admin-tests-heading">
        <div>
          <div className="admin-tests-eyebrow">
            TEST MANAGEMENT
          </div>

          <h1>Tests / Mock Tests</h1>

          <p>
            Manage mock tests, exam categories and test
            questions from one place.
          </p>
        </div>

        <div className="admin-tests-heading-actions">
          <button
            type="button"
            className="admin-tests-refresh-btn"
            onClick={fetchTests}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "admin-tests-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="admin-tests-add-btn"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Test
          </button>
        </div>
      </div>

      <div className="admin-tests-stats">
        <div className="admin-test-stat-card">
          <div className="admin-test-stat-icon">
            <BookOpenCheck size={22} />
          </div>

          <div>
            <span>Total Tests</span>
            <strong>{tests.length}</strong>
          </div>
        </div>

        <div className="admin-test-stat-card">
          <div className="admin-test-stat-icon">
            <FileQuestion size={22} />
          </div>

          <div>
            <span>Total Questions</span>
            <strong>{totalQuestions}</strong>
          </div>
        </div>

        <div className="admin-test-stat-card">
          <div className="admin-test-stat-icon">
            <Trophy size={22} />
          </div>

          <div>
            <span>Exam Groups</span>
            <strong>{categories.length}</strong>
          </div>
        </div>

        <div className="admin-test-stat-card">
          <div className="admin-test-stat-icon">
            <Clock3 size={22} />
          </div>

          <div>
            <span>Avg. Duration</span>
            <strong>{averageDuration} min</strong>
          </div>
        </div>
      </div>

      <div className="admin-tests-panel">
        <div className="admin-tests-toolbar">
          <div className="admin-tests-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by test name, ID, exam or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="admin-tests-filter">
            <Filter size={17} />

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
            >
              <option value="all">
                All Exam Groups
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {formatSlug(category)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-tests-state">
            <RefreshCw
              size={30}
              className="admin-tests-spin"
            />
            <h3>Loading mock tests...</h3>
            <p>Please wait while tests are being loaded.</p>
          </div>
        ) : error ? (
          <div className="admin-tests-state admin-tests-error">
            <FileQuestion size={34} />

            <h3>Tests could not be loaded</h3>
            <p>{error}</p>

            <button type="button" onClick={fetchTests}>
              Try Again
            </button>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="admin-tests-state">
            <Search size={34} />
            <h3>No tests found</h3>
            <p>
              Try changing your search or exam filter.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-tests-table-info">
              Showing <strong>{filteredTests.length}</strong>{" "}
              of <strong>{tests.length}</strong> tests
            </div>

            <div className="admin-tests-table-wrapper">
              <table className="admin-tests-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Questions</th>
                    <th>Duration</th>
                    <th>Marks</th>
                    <th>Negative</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTests.map((test) => (
                    <tr key={test.testId}>
                      <td>
                        <div className="admin-test-name">
                          <strong>{test.title}</strong>
                          <span>{test.testId}</span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-test-exam">
                          <strong>
                            {formatSlug(test.topCategory)}
                          </strong>
                          <span>
                            {formatSlug(test.subExam)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-test-subject">
                          {test.subject || "—"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-question-count"
                          onClick={() =>
                            handleManageQuestions(test)
                          }
                        >
                          <FileQuestion size={15} />
                          {test.totalQuestions}
                        </button>
                      </td>

                      <td>
                        <div className="admin-test-duration">
                          <Clock3 size={15} />
                          {formatDuration(test.duration)}
                        </div>
                      </td>

                      <td>+{test.marksPerCorrect}</td>

                      <td>
                        {Number(test.negativeMarking) > 0
                          ? `-${test.negativeMarking}`
                          : "0"}
                      </td>

                      <td>
                        <div className="admin-test-actions">
                          <button
                            type="button"
                            className="admin-manage-question-btn"
                            onClick={() =>
                              handleManageQuestions(test)
                            }
                          >
                            <FileQuestion size={16} />
                            Questions
                          </button>

                          <button
                            type="button"
                            className="admin-test-icon-btn"
                            onClick={() => handleEdit(test)}
                            title="Edit Test"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="admin-test-icon-btn admin-test-delete-btn"
                            onClick={() => handleDelete(test)}
                            title="Delete Test"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <div
          className="admin-test-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div className="admin-test-modal">
            <div className="admin-test-modal-header">
              <div>
                <span>
  {editingTestId ? "EDIT MOCK TEST" : "NEW MOCK TEST"}
</span>

<h2>
  {editingTestId ? "Edit Test" : "Add Test"}
</h2>

<p>
  {editingTestId
    ? "Update the selected mock test details."
    : "Create a new test for the Take a Mock Test section."}
</p>
              </div>

              <button
                type="button"
                className="admin-test-modal-close"
                onClick={closeAddModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="admin-test-form"
              onSubmit={handleCreateTest}
            >
              {formError && (
                <div className="admin-test-form-message error">
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="admin-test-form-message success">
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="admin-test-form-grid">
                <div className="admin-test-form-field">
                  <label htmlFor="topCategory">
                    Exam Group *
                  </label>

                  <select
                    id="topCategory"
                    name="topCategory"
                    value={form.topCategory}
                    onChange={handleFormChange}
                    disabled={saving}
                  >
                    <option value="">
                      Select exam group
                    </option>

                    {EXAM_TAXONOMY.map((group) => (
                      <option
                        key={group.slug}
                        value={group.slug}
                      >
                        {group.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-test-form-field">
                  <label htmlFor="subExam">
                    Sub Exam *
                  </label>

                  <select
                    id="subExam"
                    name="subExam"
                    value={form.subExam}
                    onChange={handleFormChange}
                    disabled={
                      saving || !selectedExamGroup
                    }
                  >
                    <option value="">
                      {selectedExamGroup
                        ? "Select sub exam"
                        : "Select exam group first"}
                    </option>

                    {selectedExamGroup?.subExams.map(
                      (subExam) => (
                        <option
                          key={subExam.slug}
                          value={subExam.slug}
                        >
                          {subExam.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="admin-test-form-field">
                  <label htmlFor="testId">
                    Test ID *
                  </label>

                  <input
                    id="testId"
                    name="testId"
                    type="text"
                    value={form.testId}
                    onChange={handleFormChange}
                    placeholder="e.g. ssc-cgl-math-02"
                    disabled={saving || Boolean(editingTestId)}
                    autoComplete="off"
                  />

                  <small>
  {editingTestId
    ? "Test ID cannot be changed because questions are linked to this ID."
    : "Lowercase letters, numbers and hyphens only."}
</small>
                </div>

                <div className="admin-test-form-field">
                  <label htmlFor="category">
                    Category *
                  </label>

                  <input
                    id="category"
                    name="category"
                    type="text"
                    value={form.category}
                    onChange={handleFormChange}
                    placeholder="e.g. SSC CGL"
                    disabled={saving}
                  />
                </div>

                <div className="admin-test-form-field admin-test-form-full">
                  <label htmlFor="title">
                    Test Title *
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Mathematics Sectional Test - 02"
                    disabled={saving}
                  />
                </div>

                <div className="admin-test-form-field">
                  <label htmlFor="subject">
                    Subject *
                  </label>

                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={form.subject}
                    onChange={handleFormChange}
                    placeholder="e.g. Mathematics"
                    disabled={saving}
                  />
                </div>

                <div className="admin-test-form-field">
                  <label htmlFor="durationMinutes">
                    Duration (minutes) *
                  </label>

                  <input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    min="1"
                    step="1"
                    value={form.durationMinutes}
                    onChange={handleFormChange}
                    placeholder="60"
                    disabled={saving}
                  />
                </div>

                <div className="admin-test-form-field">
                  <label htmlFor="marksPerCorrect">
                    Marks per Correct *
                  </label>

                  <input
                    id="marksPerCorrect"
                    name="marksPerCorrect"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.marksPerCorrect}
                    onChange={handleFormChange}
                    disabled={saving}
                  />
                </div>

                <div className="admin-test-form-field">
                  <label htmlFor="negativeMarking">
                    Negative Marking *
                  </label>

                  <input
                    id="negativeMarking"
                    name="negativeMarking"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.negativeMarking}
                    onChange={handleFormChange}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="admin-test-form-footer">
                <button
                  type="button"
                  className="admin-test-cancel-btn"
                  onClick={closeAddModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-test-save-btn"
                  disabled={saving}
                >
                 {saving ? (
  <>
    <RefreshCw
      size={17}
      className="admin-tests-spin"
    />
    {editingTestId ? "Saving..." : "Creating..."}
  </>
) : (
  <>
    <Save size={17} />
    {editingTestId ? "Save Changes" : "Create Test"}
  </>
)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTests;