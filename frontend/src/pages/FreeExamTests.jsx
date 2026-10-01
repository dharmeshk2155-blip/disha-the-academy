import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileQuestion,
  Trophy,
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

export default function FreeExamTests() {
  const {
    categoryId,
    examId,
  } = useParams();

  const categoryName =
    decodeURIComponent(
      categoryId || ""
    );

  const examName =
    decodeURIComponent(
      examId || ""
    );

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

  /* ==============================
     LOAD FREE TESTS
  ============================== */

  useEffect(() => {
    let ignore = false;

    async function loadTests() {
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
            : [];

        if (!ignore) {
          setTests(list);
        }
      } catch (err) {
        console.error(
          "Free exam tests error:",
          err
        );

        if (!ignore) {
          setError(
            err.message ||
              "Unable to load tests."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTests();

    return () => {
      ignore = true;
    };
  }, []);

  /* ==============================
     FILTER SELECTED EXAM
  ============================== */

  const examTests =
    useMemo(() => {
      return tests.filter(
        (test) => {

          const testCategory =
            test.topCategory ||
            test.category ||
            "";

          const testExam =
            test.subExam ||
            test.subject ||
            test.category ||
            "";

          return (
            normalize(
              testCategory
            ) ===
              normalize(
                categoryName
              ) &&
            normalize(
              testExam
            ) ===
              normalize(
                examName
              )
          );
        }
      );
    }, [
      tests,
      categoryName,
      examName,
    ]);

  if (loading) {
    return (
      <main className="ft-page">
        <div className="ft-empty-page">
          <h2>
            Loading Tests...
          </h2>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="ft-page">

        <div className="ft-empty-page">

          <h2>
            Unable to load tests
          </h2>

          <p>
            {error}
          </p>

          <Link to="/free-tests">
            Back to Free Tests
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="ft-page">

      {/* HERO */}

      <section className="ft-exam-hero">

        <Link
          to="/free-tests"
          className="ft-back-link"
        >
          <ArrowLeft
            size={18}
          />

          Free Tests
        </Link>

        <span className="ft-free-label">
          <CheckCircle2
            size={16}
          />

          100% Free
        </span>

        <h1>
          {examName}
        </h1>

        <p>
          Practice free mock tests
          for {examName}.
        </p>

      </section>

      {/* CONTENT */}

      <section className="ft-content">

        <div className="ft-heading">

          <div>

            <span className="ft-small-category">
              {categoryName}
            </span>

            <h2>
              {examName} Free Tests
            </h2>

            <p>
              Choose a test and start
              your practice.
            </p>

          </div>

          <span className="ft-test-count">
            {examTests.length}{" "}
            {examTests.length === 1
              ? "Test"
              : "Tests"}
          </span>

        </div>

        {examTests.length ===
        0 ? (

          <div className="ft-no-tests">

            <h3>
              No free tests available
            </h3>

            <p>
              Free tests for this exam
              will be added soon.
            </p>

            <Link to="/free-tests">
              View Other Exams
            </Link>

          </div>

        ) : (

          <div className="ft-tests-grid">

            {examTests.map(
              (test) => {

                const questions =
                  Number(
                    test.totalQuestions
                  ) || 0;

                const durationMinutes =
                  Math.ceil(
                    Number(
                      test.duration ||
                        0
                    ) / 60
                  );

                const totalMarks =
                  questions *
                  Number(
                    test.marksPerCorrect ||
                      0
                  );

                return (
                  <article
                    key={
                      test.id ||
                      test.testId
                    }
                    className="ft-test-card"
                  >

                    <div className="ft-test-top">

                      <span className="ft-badge">
                        FREE
                      </span>

                      <span>
                        {examName}
                      </span>

                    </div>

                    <h3>
                      {test.title}
                    </h3>

                    <div className="ft-test-details">

                      <div>
                        <FileQuestion
                          size={18}
                        />

                        <span>
                          {questions}{" "}
                          Questions
                        </span>
                      </div>

                      <div>
                        <Clock
                          size={18}
                        />

                        <span>
                          {
                            durationMinutes
                          }{" "}
                          Minutes
                        </span>
                      </div>

                      <div>
                        <Trophy
                          size={18}
                        />

                        <span>
                          {totalMarks}{" "}
                          Marks
                        </span>
                      </div>

                    </div>

                    <Link
                      to={`/free-tests/attempt/${
                        test.id ||
                        test.testId
                      }`}
                      className="ft-start-btn"
                    >
                      Start Free Test

                      <ArrowRight
                        size={19}
                      />
                    </Link>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

    </main>
  );
}