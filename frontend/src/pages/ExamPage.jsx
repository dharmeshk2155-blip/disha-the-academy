import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  FileText,
  Target,
} from "lucide-react";

import { getExamGroup, getSubExam } from "../data/examTaxonomy";
import {
  OTHER_TYPE,
  TEST_TYPES,
  countByType,
  languageLabel,
} from "../data/testTypes";
import useTests from "../hooks/useTests";

import "./ExamPage.css";

// icon for each type card
const TYPE_ICON = {
  previous_year: FileText,
  sectional: Target,
  full: ClipboardCheck,
};

/*
  EXAM PAGE   (/take-mock-test/:topSlug/:subSlug)
    - exam overview
    - syllabus preview
    - number of available tests
    - choose a test type -> Test list
*/
export default function ExamPage() {
  const { topSlug, subSlug } = useParams();
  const navigate = useNavigate();

  const group = getExamGroup(topSlug);
  const exam = getSubExam(topSlug, subSlug);

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

  const stats = useMemo(() => {
    const languages = new Set();
    const subjects = new Map();
    let questions = 0;
    let free = 0;

    tests.forEach((t) => {
      questions += Number(t.totalQuestions) || 0;
      if (t.isFree === true) free += 1;

      (t.languages || []).forEach((l) => languages.add(l));

      const subject = String(t.subject || "").trim();
      if (subject) subjects.set(subject, (subjects.get(subject) || 0) + 1);
    });

    return {
      questions,
      free,
      languages: [...languages],
      subjects: [...subjects.entries()].sort((a, b) => b[1] - a[1]),
      byType: countByType(tests),
    };
  }, [tests]);

  const back = (
    <button
      type="button"
      className="ep-back"
      onClick={() => navigate(group ? `/take-mock-test/${topSlug}` : "/take-mock-test")}
    >
      <ArrowLeft size={18} />
      {group ? `Back to ${group.title}` : "Back to exams"}
    </button>
  );

  if (!group || !exam) {
    return (
      <div className="ep-page">
        {back}
        <div className="ep-status ep-error">Exam not found.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ep-page">
        {back}
        <div className="ep-status">Loading exam…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ep-page">
        {back}
        <div className="ep-status ep-error">Error: {error}</div>
      </div>
    );
  }

  // type cards: 3 types, plus "Other" only when older untyped tests exist
  const typeCards = [
    ...TEST_TYPES,
    ...(stats.byType.other > 0 ? [OTHER_TYPE] : []),
  ];

  // optional fields in examTaxonomy.js:  overview: "...", syllabus: ["...", "..."]
  const overview =
    exam.overview ||
    `Practice ${exam.name} with previous year tests, sectional tests and full-length mock tests.`;

  const syllabus =
    Array.isArray(exam.syllabus) && exam.syllabus.length > 0
      ? exam.syllabus.map((name) => [name, 0])
      : stats.subjects;

  return (
    <div className="ep-page">
      {back}

      {/* ---------- overview ---------- */}
      <section className="ep-hero">
        <div className="ep-logo" aria-hidden="true">
          {exam.iconUrl ? (
            <img
              src={exam.iconUrl}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span>📄</span>
          )}
        </div>

        <div className="ep-hero-text">
          <span className="ep-eyebrow">{group.title}</span>
          <h1>{exam.name}</h1>
          <p>{overview}</p>
        </div>
      </section>

      <section className="ep-stats" aria-label="Available tests">
        <div className="ep-stat ep-stat-main">
          <strong>{tests.length}</strong>
          <span>{tests.length === 1 ? "Test available" : "Tests available"}</span>
        </div>

        <div className="ep-stat">
          <strong>{stats.free}</strong>
          <span>Free</span>
        </div>

        <div className="ep-stat">
          <strong>{stats.questions}</strong>
          <span>Questions</span>
        </div>

        <div className="ep-stat">
          <strong className="ep-stat-text">
            {languageLabel(stats.languages) || "—"}
          </strong>
          <span>Language</span>
        </div>
      </section>

      {/* ---------- syllabus preview ---------- */}
      <section className="ep-section">
        <h2>Syllabus preview</h2>

        {syllabus.length === 0 ? (
          <p className="ep-muted">
            Syllabus details will appear here once tests are added.
          </p>
        ) : (
          <>
            <ul className="ep-chips">
              {syllabus.map(([name, count]) => (
                <li key={name}>
                  {name}
                  {count > 0 && (
                    <em>
                      {count} {count === 1 ? "test" : "tests"}
                    </em>
                  )}
                </li>
              ))}
            </ul>

            {!(Array.isArray(exam.syllabus) && exam.syllabus.length > 0) && (
              <p className="ep-muted ep-small">
                Subjects covered by the available tests.
              </p>
            )}
          </>
        )}
      </section>

      {/* ---------- test type ---------- */}
      <section className="ep-section">
        <h2>Choose test type</h2>

        <div className="ep-types">
          {typeCards.map((type) => {
            const Icon = TYPE_ICON[type.value] || FileText;
            const count = stats.byType[type.value] || 0;

            const inner = (
              <>
                <span className="ep-type-icon">
                  <Icon size={22} />
                </span>

                <span className="ep-type-body">
                  <strong>{type.label}</strong>
                  <small>{type.desc}</small>
                </span>

                <span className="ep-type-side">
                  <b>{count}</b>
                  {count > 0 ? <ArrowRight size={18} /> : <i>Soon</i>}
                </span>
              </>
            );

            return count > 0 ? (
              <Link
                key={type.value}
                className="ep-type"
                to={`/take-mock-test/${topSlug}/${subSlug}/${type.slug}`}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={type.value}
                className="ep-type ep-type-off"
                aria-disabled="true"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}