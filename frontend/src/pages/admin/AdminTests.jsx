import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
} from "lucide-react";

import "./AdminTests.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

function AdminTests() {
  const { adminKey } = useOutletContext();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  const handleAddTest = () => {
    alert("Add Test form next step mein connect karenge.");
  };

  const handleManageQuestions = (test) => {
    alert(
      `Manage Questions: ${test.title}\n\nNext step mein Question Manager banayenge.`
    );
  };

  const handleEdit = (test) => {
    alert(
      `Edit Test: ${test.title}\n\nEdit API next step mein connect karenge.`
    );
  };

  const handleDelete = (test) => {
    alert(
      `Delete Test: ${test.title}\n\nDelete API banne ke baad ye button activate hoga.`
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
            onClick={handleAddTest}
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

            <button
              type="button"
              onClick={fetchTests}
            >
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
              Showing{" "}
              <strong>{filteredTests.length}</strong> of{" "}
              <strong>{tests.length}</strong> tests
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
                          title="Manage questions"
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

                      <td>
                        +{test.marksPerCorrect}
                      </td>

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
                            title="Manage Questions"
                          >
                            <FileQuestion size={16} />
                            Questions
                          </button>

                          <button
                            type="button"
                            className="admin-test-icon-btn"
                            onClick={() =>
                              handleEdit(test)
                            }
                            title="Edit Test"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="admin-test-icon-btn admin-test-delete-btn"
                            onClick={() =>
                              handleDelete(test)
                            }
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
    </div>
  );
}

export default AdminTests;