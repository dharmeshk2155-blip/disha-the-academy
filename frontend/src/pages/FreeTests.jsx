import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MapPinned,
  Landmark,
  Building2,
  TrainFront,
  GraduationCap,
} from "lucide-react";

import "./FreeTests.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

function normalize(value = "") {
  return String(value)
    .trim()
    .toLowerCase();
}

function getCategoryIcon(
  categoryName
) {
  const value =
    normalize(categoryName);

  if (
    value.includes("hp") ||
    value.includes("himachal") ||
    value.includes("state")
  ) {
    return MapPinned;
  }

  if (
    value.includes("upsc")
  ) {
    return Landmark;
  }

  if (
    value.includes("railway") ||
    value.includes("rrb")
  ) {
    return TrainFront;
  }

  if (
    value.includes("teaching") ||
    value.includes("teacher") ||
    value.includes("tet")
  ) {
    return GraduationCap;
  }

  return Building2;
}

export default function FreeTests() {
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
    openCategory,
    setOpenCategory,
  ] = useState("");

  /* ==============================
     LOAD FREE TESTS
  ============================== */

  useEffect(() => {
    let ignore = false;

    async function loadFreeTests() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/api/tests?free=true`
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load free tests."
          );
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.tests
              )
            ? data.tests
            : Array.isArray(
                data?.data
              )
            ? data.data
            : [];

        if (!ignore) {
          setTests(list);
        }
      } catch (err) {
        console.error(
          "Free tests loading error:",
          err
        );

        if (!ignore) {
          setError(
            err.message ||
              "Unable to load free tests."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadFreeTests();

    return () => {
      ignore = true;
    };
  }, []);

  /* ==============================
     GROUP CATEGORY → EXAMS
  ============================== */

  const categories =
    useMemo(() => {
      const map =
        new Map();

      tests.forEach((test) => {
        const categoryName =
          String(
            test.topCategory ||
              test.category ||
              "Other Exams"
          ).trim();

        const examName =
          String(
            test.subExam ||
              test.subject ||
              test.category ||
              "General"
          ).trim();

        if (
          !map.has(categoryName)
        ) {
          map.set(
            categoryName,
            new Map()
          );
        }

        const examMap =
          map.get(
            categoryName
          );

        if (
          !examMap.has(examName)
        ) {
          examMap.set(
            examName,
            []
          );
        }

        examMap
          .get(examName)
          .push(test);
      });

      return Array.from(
        map.entries()
      ).map(
        ([
          categoryName,
          examMap,
        ]) => ({
          title:
            categoryName,

          exams:
            Array.from(
              examMap.entries()
            ).map(
              ([
                examName,
                examTests,
              ]) => ({
                name:
                  examName,

                tests:
                  examTests,

                totalTests:
                  examTests.length,
              })
            ),
        })
      );
    }, [tests]);

  /*
    First category automatically open
  */

  useEffect(() => {
    if (
      !openCategory &&
      categories.length
    ) {
      setOpenCategory(
        categories[0].title
      );
    }
  }, [
    categories,
    openCategory,
  ]);

  function toggleCategory(
    category
  ) {
    setOpenCategory(
      (current) =>
        current === category
          ? ""
          : category
    );
  }

  /* ==============================
     LOADING
  ============================== */

  if (loading) {
    return (
      <main className="ft-page">
        <div className="ft-empty-page">
          <h2>
            Loading Free Tests...
          </h2>
        </div>
      </main>
    );
  }

  /* ==============================
     ERROR
  ============================== */

  if (error) {
    return (
      <main className="ft-page">
        <div className="ft-empty-page">
          <h2>
            Unable to load tests
          </h2>

          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="ft-page">

      {/* HERO */}

      <section className="ft-hero">

        <div className="ft-hero-content">

          <span className="ft-free-label">
            <CheckCircle2
              size={17}
            />

            100% Free
          </span>

          <h1>
            Free Mock Tests
          </h1>

          <p>
            Practice exam-specific
            mock tests completely free.
            Choose your exam category
            and start preparing.
          </p>

        </div>

      </section>

      {/* CONTENT */}

      <section className="ft-content">

        <div className="ft-heading">

          <div>
            <h2>
              Available Free Tests
            </h2>

            <p>
              Select an exam category
              to see all available
              exams and free mock tests.
            </p>
          </div>

        </div>

        {categories.length ===
        0 ? (

          <div className="ft-no-tests">

            <h3>
              No free tests available
            </h3>

            <p>
              Free tests will appear
              here when they are added.
            </p>

          </div>

        ) : (

          <div className="ft-categories">

            {categories.map(
              (category) => {

                const Icon =
                  getCategoryIcon(
                    category.title
                  );

                const isOpen =
                  openCategory ===
                  category.title;

                return (
                  <section
                    key={
                      category.title
                    }
                    className={`ft-category ${
                      isOpen
                        ? "open"
                        : ""
                    }`}
                  >

                    <button
                      type="button"
                      className="ft-category-header"
                      onClick={() =>
                        toggleCategory(
                          category.title
                        )
                      }
                    >

                      <div className="ft-category-left">

                        <div className="ft-category-icon">
                          <Icon
                            size={24}
                            strokeWidth={
                              1.8
                            }
                          />
                        </div>

                        <div>

                          <h3>
                            {
                              category.title
                            }
                          </h3>

                          <p>
                            Explore all{" "}
                            {
                              category.title
                            }{" "}
                            free mock tests
                          </p>

                        </div>

                      </div>

                      <div className="ft-category-right">

                        <span>
                          {
                            category
                              .exams
                              .length
                          }{" "}
                          Exams
                        </span>

                        {isOpen ? (
                          <ChevronDown
                            size={22}
                          />
                        ) : (
                          <ChevronRight
                            size={22}
                          />
                        )}

                      </div>

                    </button>

                    {isOpen && (

                      <div className="ft-exams-grid">

                        {category.exams.map(
                          (exam) => (

                            <Link
                              key={
                                exam.name
                              }
                              to={`/free-tests/${encodeURIComponent(
                                category.title
                              )}/${encodeURIComponent(
                                exam.name
                              )}`}
                              className="ft-exam-card"
                            >

                              <div>

                                <h4>
                                  {
                                    exam.name
                                  }
                                </h4>

                                <span>
                                  {
                                    exam.totalTests
                                  }{" "}
                                  Free{" "}
                                  {exam.totalTests ===
                                  1
                                    ? "Test"
                                    : "Tests"}
                                </span>

                              </div>

                              <ChevronRight
                                size={20}
                              />

                            </Link>

                          )
                        )}

                      </div>

                    )}

                  </section>
                );
              }
            )}

          </div>
        )}

      </section>

    </main>
  );
}