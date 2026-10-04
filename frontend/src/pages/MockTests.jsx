import { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { getExamGroup, getSubExam } from "../data/examTaxonomy";
import {
  OTHER_TYPE,
  TEST_TYPES,
  countByType,
  typeBySlug,
  typeKeyOf,
} from "../data/testTypes";
import useTests from "../hooks/useTests";
import TestCard from "../components/TestCard";

import "./MockTests.css";

/*
  TEST LIST   (/take-mock-test/:topSlug/:subSlug/:typeSlug)
  Shows the tests of ONE exam and ONE type
  (previous-year | sectional | full | other).
  Each card: title, questions, duration, free/paid, Start Test.
*/
export default function MockTests() {
  const { topSlug, subSlug, typeSlug } = useParams();
  const navigate = useNavigate();

  const group = getExamGroup(topSlug);
  const exam = getSubExam(topSlug, subSlug);
  const type = typeBySlug(typeSlug);

  const { tests: allTests, loading, error } = useTests();

  const tests = useMemo(
    () =>
      allTests.filter(
        (t) =>
          String(t.topCategory || "").toLowerCase() ===
            String(topSlug || "").toLowerCase() &&
          String(t.subExam || "").toLowerCase() ===
            String(subSlug || "").toLowerCase()
      ),
    [allTests, topSlug, subSlug]
  );

  const counts = useMemo(() => countByType(tests), [tests]);

  const visibleTests = useMemo(
    () =>
      tests
        .filter((t) => type && typeKeyOf(t) === type.value)
        .sort((a, b) =>
          String(a.title || "").localeCompare(
            String(b.title || ""),
            undefined,
            { numeric: true }
          )
        ),
    [tests, type]
  );

  const examPath = `/take-mock-test/${topSlug}/${subSlug}`;

  if (!group || !exam) {
    return (
      <div className="mt-page">
        <button
          className="mt-back-btn"
          onClick={() => navigate("/take-mock-test")}
        >
          ← Back to Test Series
        </button>

        <div className="mt-status mt-error">Exam not found.</div>
      </div>
    );
  }

  // unknown type in the address -> go back to the Exam page
  if (!type) {
    return <Navigate to={examPath} replace />;
  }

  if (loading) {
    return (
      <div className="mt-page">
        <div className="mt-status">Loading tests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-page">
        <button
          className="mt-back-btn"
          onClick={() => navigate(examPath)}
        >
          ← Back
        </button>

        <div className="mt-status mt-error">Error: {error}</div>
      </div>
    );
  }

  // tabs: the 3 types, plus "Other" only if older untyped tests exist
  const tabs = [
    ...TEST_TYPES,
    ...(counts.other > 0 || type.value === "other" ? [OTHER_TYPE] : []),
  ];

  return (
    <div className="mt-page">
      <button
        className="mt-back-btn"
        onClick={() => navigate(examPath)}
      >
        ← Back to {exam.name}
      </button>

      <div className="mt-header">
        <h1>
          {exam.name} · {type.label}
        </h1>

        <p>
          {visibleTests.length}{" "}
          {visibleTests.length === 1 ? "test" : "tests"} available.
          Choose one to start.
        </p>
      </div>

      <div className="mt-tabs" role="tablist" aria-label="Test type">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={type.value === tab.value}
            className={`mt-tab ${type.value === tab.value ? "active" : ""}`}
            onClick={() =>
              navigate(`${examPath}/${tab.slug}`, { replace: true })
            }
          >
            {tab.label}
            <span className="mt-tab-count">{counts[tab.value] || 0}</span>
          </button>
        ))}
      </div>

      {visibleTests.length === 0 ? (
        <div className="mt-status">
          No {type.label.toLowerCase()} for {exam.name} yet.
        </div>
      ) : (
        <div className="tc-grid">
          {visibleTests.map((test) => (
            <TestCard key={test.id || test.testId} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}