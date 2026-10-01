import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import {
  Search,
  Plus,
  FileQuestion,
  Clock3,
  Pencil,
  Trash2,
  RefreshCw,
  BookOpenCheck,
  Filter,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Gift,
} from "lucide-react";

import {
  EXAM_TAXONOMY,
} from "../../data/examTaxonomy";

import "./AdminTests.css";

const API_BASE =
  import.meta.env.DEV
    ? "http://127.0.0.1:5000"
    : import.meta.env
        .VITE_API_BASE ||
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
  isActive: "true",
};

export default function AdminFreeTests() {
  const {
    adminKey,
  } =
    useOutletContext();

  const navigate =
    useNavigate();

  const [
    tests,
    setTests,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingTestId,
    setEditingTestId,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  async function fetchTests() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_BASE}/api/admin/free-tests`,
          {
            headers: {
              "x-admin-key":
                adminKey,
            },
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to load free tests."
        );
      }

      setTests(
        Array.isArray(
          data.tests
        )
          ? data.tests
          : []
      );
    } catch (err) {
      console.error(
        "Load free tests error:",
        err
      );

      setError(
        err.message ||
          "Failed to load free tests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) {
      fetchTests();
    }
  }, [adminKey]);

  const categories =
    useMemo(() => {
      return [
        ...new Set(
          tests
            .map(
              (test) =>
                test.topCategory
            )
            .filter(Boolean)
        ),
      ];
    }, [tests]);

  const filteredTests =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return tests.filter(
        (test) => {
          const matchesCategory =
            categoryFilter ===
              "all" ||
            test.topCategory ===
              categoryFilter;

          const matchesSearch =
            !value ||
            test.title
              ?.toLowerCase()
              .includes(value) ||
            test.testId
              ?.toLowerCase()
              .includes(value) ||
            test.subject
              ?.toLowerCase()
              .includes(value) ||
            test.category
              ?.toLowerCase()
              .includes(value) ||
            test.subExam
              ?.toLowerCase()
              .includes(value);

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      tests,
      search,
      categoryFilter,
    ]);

  const totalQuestions =
    useMemo(
      () =>
        tests.reduce(
          (
            total,
            test
          ) =>
            total +
            Number(
              test.totalQuestions ||
                0
            ),
          0
        ),
      [tests]
    );

  const activeTests =
    useMemo(
      () =>
        tests.filter(
          (test) =>
            test.isActive !==
            false
        ).length,
      [tests]
    );

  const selectedGroup =
    useMemo(
      () =>
        EXAM_TAXONOMY.find(
          (group) =>
            group.slug ===
            form.topCategory
        ),
      [form.topCategory]
    );

  function formatSlug(
    value
  ) {
    if (!value) {
      return "—";
    }

    return String(value)
      .split("-")
      .map(
        (word) =>
          word
            .charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  function formatDuration(
    seconds
  ) {
    const value =
      Number(seconds) || 0;

    if (value < 60) {
      return `${value} sec`;
    }

    return `${Math.round(
      value / 60
    )} min`;
  }

  function openAddModal() {
    setEditingTestId(
      null
    );

    setForm(
      INITIAL_FORM
    );

    setFormError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingTestId(
      null
    );

    setForm(
      INITIAL_FORM
    );

    setFormError("");
    setSuccessMessage("");
  }

  function handleChange(
    event
  ) {
    const {
      name,
      value,
    } =
      event.target;

    if (
      name ===
      "topCategory"
    ) {
      const group =
        EXAM_TAXONOMY.find(
          (item) =>
            item.slug ===
            value
        );

      setForm(
        (current) => ({
          ...current,

          topCategory:
            value,

          subExam: "",

          category:
            group?.title ||
            "",
        })
      );

      return;
    }

    setForm(
      (current) => ({
        ...current,
        [name]:
          value,
      })
    );
  }

  function handleEdit(
    test
  ) {
    setEditingTestId(
      test.testId
    );

    setForm({
      testId:
        test.testId ||
        "",

      topCategory:
        test.topCategory ||
        "",

      subExam:
        test.subExam ||
        "",

      category:
        test.category ||
        "",

      title:
        test.title ||
        "",

      subject:
        test.subject ||
        "",

      durationMinutes:
        test.duration
          ? String(
              Math.round(
                Number(
                  test.duration
                ) / 60
              )
            )
          : "",

      marksPerCorrect:
        String(
          test.marksPerCorrect ??
            1
        ),

      negativeMarking:
        String(
          test.negativeMarking ??
            0
        ),

      isActive:
        test.isActive ===
        false
          ? "false"
          : "true",
    });

    setFormError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const testId =
      form.testId
        .trim()
        .toLowerCase();

    const durationMinutes =
      Number(
        form.durationMinutes
      );

    const marks =
      Number(
        form.marksPerCorrect
      );

    const negative =
      Number(
        form.negativeMarking
      );

    if (
      !testId ||
      !form.topCategory ||
      !form.subExam ||
      !form.category.trim() ||
      !form.title.trim() ||
      !form.subject.trim()
    ) {
      setFormError(
        "Please fill all required fields."
      );

      return;
    }

    if (
      !/^[a-z0-9-]+$/.test(
        testId
      )
    ) {
      setFormError(
        "Test ID can contain only lowercase letters, numbers and hyphens."
      );

      return;
    }

    if (
      !Number.isFinite(
        durationMinutes
      ) ||
      durationMinutes <= 0
    ) {
      setFormError(
        "Duration must be greater than 0 minutes."
      );

      return;
    }

    if (
      !Number.isFinite(
        marks
      ) ||
      marks <= 0
    ) {
      setFormError(
        "Marks must be greater than 0."
      );

      return;
    }

    if (
      !Number.isFinite(
        negative
      ) ||
      negative < 0
    ) {
      setFormError(
        "Negative marking cannot be less than 0."
      );

      return;
    }

    try {
      setSaving(true);

      const editing =
        Boolean(
          editingTestId
        );

      const url =
        editing
          ? `${API_BASE}/api/admin/free-tests/${encodeURIComponent(
              editingTestId
            )}`
          : `${API_BASE}/api/admin/free-tests`;

      const response =
        await fetch(url, {
          method:
            editing
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-admin-key":
              adminKey,
          },

          body:
            JSON.stringify({
              testId,

              topCategory:
                form.topCategory,

              subExam:
                form.subExam,

              category:
                form.category.trim(),

              title:
                form.title.trim(),

              subject:
                form.subject.trim(),

              duration:
                Math.round(
                  durationMinutes *
                    60
                ),

              marksPerCorrect:
                marks,

              negativeMarking:
                negative,

              isActive:
                form.isActive ===
                "true",
            }),
        });

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to save free test."
        );
      }

      setSuccessMessage(
        editing
          ? "Free test updated successfully."
          : "Free test created successfully."
      );

      await fetchTests();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      console.error(
        "Save free test error:",
        err
      );

      setFormError(
        err.message ||
          "Failed to save free test."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    test
  ) {
    const confirmed =
      window.confirm(
        `Delete "${test.title}"?\n\nThis will also delete ${test.totalQuestions || 0} question(s).\n\nThis cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE}/api/admin/free-tests/${encodeURIComponent(
            test.testId
          )}`,
          {
            method:
              "DELETE",

            headers: {
              "x-admin-key":
                adminKey,
            },
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to delete free test."
        );
      }

      await fetchTests();
    } catch (err) {
      setError(
        err.message
      );
    }
  }

  return (
    <div className="admin-tests-page">

      <div className="admin-tests-heading">

        <div>
          <div className="admin-tests-eyebrow">
            FREE TEST MANAGEMENT
          </div>

          <h1>
            Free Tests
          </h1>

          <p>
            Create and manage free
            mock tests and their
            questions.
          </p>
        </div>

        <div className="admin-tests-heading-actions">

          <button
            type="button"
            className="admin-tests-refresh-btn"
            onClick={
              fetchTests
            }
            disabled={
              loading
            }
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-tests-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="admin-tests-add-btn"
            onClick={
              openAddModal
            }
          >
            <Plus
              size={18}
            />

            Add Free Test
          </button>

        </div>

      </div>

      <div className="admin-tests-stats">

        <div className="admin-test-stat-card">
          <div className="admin-test-stat-icon">
            <Gift size={22} />
          </div>

          <div>
            <span>
              Free Tests
            </span>

            <strong>
              {tests.length}
            </strong>
          </div>
        </div>

        <div className="admin-test-stat-card">
          <div className="admin-test-stat-icon">
            <FileQuestion
              size={22}
            />
          </div>

          <div>
            <span>
              Questions
            </span>

            <strong>
              {totalQuestions}
            </strong>
          </div>
        </div>

        <div className="admin-test-stat-card">
          <div className="admin-test-stat-icon">
            <CheckCircle2
              size={22}
            />
          </div>

          <div>
            <span>
              Active
            </span>

            <strong>
              {activeTests}
            </strong>
          </div>
        </div>

        <div className="admin-test-stat-card">
          <div className="admin-test-stat-icon">
            <BookOpenCheck
              size={22}
            />
          </div>

          <div>
            <span>
              Exam Groups
            </span>

            <strong>
              {categories.length}
            </strong>
          </div>
        </div>

      </div>

      <div className="admin-tests-panel">

        <div className="admin-tests-toolbar">

          <div className="admin-tests-search">
            <Search size={18} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target
                    .value
                )
              }
              placeholder="Search free tests..."
            />
          </div>

          <div className="admin-tests-filter">

            <Filter
              size={17}
            />

            <select
              value={
                categoryFilter
              }
              onChange={(e) =>
                setCategoryFilter(
                  e.target
                    .value
                )
              }
            >

              <option value="all">
                All Exam Groups
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {formatSlug(
                      category
                    )}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        {loading ? (

          <div className="admin-tests-state">
            <RefreshCw
              className="admin-tests-spin"
              size={30}
            />

            <h3>
              Loading free tests...
            </h3>
          </div>

        ) : error ? (

          <div className="admin-tests-state admin-tests-error">

            <AlertCircle
              size={34}
            />

            <h3>
              Unable to load free tests
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={
                fetchTests
              }
            >
              Try Again
            </button>

          </div>

        ) : filteredTests.length ===
          0 ? (

          <div className="admin-tests-state">

            <Gift size={36} />

            <h3>
              No free tests found
            </h3>

            <p>
              Add your first free
              test.
            </p>

          </div>

        ) : (

          <div className="admin-tests-table-wrapper">

            <table className="admin-tests-table">

              <thead>
                <tr>
                  <th>
                    Test
                  </th>

                  <th>
                    Exam
                  </th>

                  <th>
                    Questions
                  </th>

                  <th>
                    Duration
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredTests.map(
                  (test) => (

                    <tr
                      key={
                        test.testId
                      }
                    >

                      <td>
                        <div className="admin-test-name">
                          <strong>
                            {test.title}
                          </strong>

                          <span>
                            {test.testId}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-test-exam">
                          <strong>
                            {formatSlug(
                              test.topCategory
                            )}
                          </strong>

                          <span>
                            {formatSlug(
                              test.subExam
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-question-count"
                          onClick={() =>
                            navigate(
                              `/admin/free-tests/${encodeURIComponent(
                                test.testId
                              )}/questions`
                            )
                          }
                        >
                          <FileQuestion
                            size={15}
                          />

                          {
                            test.totalQuestions
                          }
                        </button>
                      </td>

                      <td>
                        <div className="admin-test-duration">
                          <Clock3
                            size={15}
                          />

                          {formatDuration(
                            test.duration
                          )}
                        </div>
                      </td>

                      <td>
                        <strong>
                          {test.isActive
                            ? "Active"
                            : "Inactive"}
                        </strong>
                      </td>

                      <td>
                        <div className="admin-test-actions">

                          <button
                            type="button"
                            className="admin-manage-question-btn"
                            onClick={() =>
                              navigate(
                                `/admin/free-tests/${encodeURIComponent(
                                  test.testId
                                )}/questions`
                              )
                            }
                          >
                            <FileQuestion
                              size={16}
                            />

                            Questions
                          </button>

                          <button
                            type="button"
                            className="admin-test-icon-btn"
                            title="Edit"
                            onClick={() =>
                              handleEdit(
                                test
                              )
                            }
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            className="admin-test-icon-btn admin-test-delete-btn"
                            title="Delete"
                            onClick={() =>
                              handleDelete(
                                test
                              )
                            }
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {showModal && (

        <div className="admin-test-modal-overlay">

          <div className="admin-test-modal">

            <div className="admin-test-modal-header">

              <div>
                <span>
                  FREE TEST
                </span>

                <h2>
                  {editingTestId
                    ? "Edit Free Test"
                    : "Add Free Test"}
                </h2>

                <p>
                  This test will be
                  available without a
                  subscription.
                </p>
              </div>

              <button
                type="button"
                className="admin-test-modal-close"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>

            <form
              className="admin-test-form"
              onSubmit={
                handleSubmit
              }
            >

              {formError && (
                <div className="admin-test-form-message error">
                  <AlertCircle
                    size={18}
                  />
                  {formError}
                </div>
              )}

              {successMessage && (
                <div className="admin-test-form-message success">
                  <CheckCircle2
                    size={18}
                  />
                  {
                    successMessage
                  }
                </div>
              )}

              <div className="admin-test-form-grid">

                <div className="admin-test-form-field">

                  <label>
                    Exam Group *
                  </label>

                  <select
                    name="topCategory"
                    value={
                      form.topCategory
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  >

                    <option value="">
                      Select exam group
                    </option>

                    {EXAM_TAXONOMY.map(
                      (group) => (
                        <option
                          key={
                            group.slug
                          }
                          value={
                            group.slug
                          }
                        >
                          {
                            group.title
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="admin-test-form-field">

                  <label>
                    Sub Exam *
                  </label>

                  <select
                    name="subExam"
                    value={
                      form.subExam
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving ||
                      !selectedGroup
                    }
                  >

                    <option value="">
                      Select sub exam
                    </option>

                    {selectedGroup?.subExams?.map(
                      (exam) => (
                        <option
                          key={
                            exam.slug
                          }
                          value={
                            exam.slug
                          }
                        >
                          {
                            exam.name
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="admin-test-form-field">

                  <label>
                    Test ID *
                  </label>

                  <input
                    name="testId"
                    value={
                      form.testId
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="hp-police-free-1"
                    disabled={
                      saving ||
                      Boolean(
                        editingTestId
                      )
                    }
                  />

                </div>

                <div className="admin-test-form-field">

                  <label>
                    Test Title *
                  </label>

                  <input
                    name="title"
                    value={
                      form.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="HP Police Free Mock Test 01"
                  />

                </div>

                <div className="admin-test-form-field">

                  <label>
                    Subject *
                  </label>

                  <input
                    name="subject"
                    value={
                      form.subject
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="General Knowledge"
                  />

                </div>

                <div className="admin-test-form-field">

                  <label>
                    Duration (Minutes) *
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="durationMinutes"
                    value={
                      form.durationMinutes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="20"
                  />

                </div>

                <div className="admin-test-form-field">

                  <label>
                    Marks / Correct *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="marksPerCorrect"
                    value={
                      form.marksPerCorrect
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="admin-test-form-field">

                  <label>
                    Negative Marking *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="negativeMarking"
                    value={
                      form.negativeMarking
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="admin-test-form-field">

                  <label>
                    Status
                  </label>

                  <select
                    name="isActive"
                    value={
                      form.isActive
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="true">
                      Active
                    </option>

                    <option value="false">
                      Inactive
                    </option>
                  </select>

                </div>

              </div>

              <div className="admin-test-form-footer">

                <button
                  type="button"
                  className="admin-test-cancel-btn"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-test-save-btn"
                  disabled={
                    saving
                  }
                >
                  <Save
                    size={18}
                  />

                  {saving
                    ? "Saving..."
                    : editingTestId
                    ? "Save Changes"
                    : "Create Free Test"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}