import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { EXAM_TAXONOMY } from "../data/examTaxonomy";
import useTaxonomy from "../data/useTaxonomy";
import useGoBack from "../hooks/useGoBack";
import useTests from "../hooks/useTests";

import "./HimachalExams.css";

const REGION = "himachal-pradesh";
const CHIPS_SHOWN = 5;

/*
  HIMACHAL PRADESH EXAMS  (/himachal-pradesh)
  One card per recruiting body (HPPSC, HPRCA, HPBOSE, High Court, HP Police).
  Each card lists the exams inside it and opens the normal flow:
    body -> exam -> exam page -> test type -> test list
  Bodies the admin adds with "Show on Himachal Pradesh page" appear here too.
*/
export default function HimachalExams() {
  useTaxonomy();

  const goBack = useGoBack("/");
  const { tests } = useTests();

  const bodies = EXAM_TAXONOMY.filter((g) => g.region === REGION);

  // tests per body (counts stay hidden until the tests have loaded)
  const testCount = useMemo(() => {
    const counts = {};

    tests.forEach((t) => {
      const key = String(t.topCategory || "").toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  }, [tests]);

  const examTotal = bodies.reduce((sum, b) => sum + b.subExams.length, 0);

  return (
    <div className="hpx-page">
      <button type="button" className="hpx-back" onClick={goBack}>
        <ArrowLeft size={18} />
        Back
      </button>

      <section className="hpx-hero">
        <span className="hpx-eyebrow">Himachal Pradesh</span>
        <h1>Himachal Pradesh Exams</h1>
        <p>
          Mock tests for every Himachal Pradesh recruitment. Pick the
          commission or board, then the exam you are preparing for.
        </p>

        <ul className="hpx-hero-stats">
          <li>
            <strong>{bodies.length}</strong>
            <span>Boards &amp; commissions</span>
          </li>
          <li>
            <strong>{examTotal}</strong>
            <span>Exams</span>
          </li>
        </ul>
      </section>

      {bodies.length === 0 ? (
        <div className="hpx-empty">No Himachal Pradesh exams yet.</div>
      ) : (
        <div className="hpx-grid">
          {bodies.map((body) => {
            const shown = body.subExams.slice(0, CHIPS_SHOWN);
            const more = body.subExams.length - shown.length;
            const count = testCount[body.slug];

            return (
              <article key={body.slug} className="hpx-card">
                <Link
                  to={`/take-mock-test/${body.slug}`}
                  className="hpx-card-head"
                >
                  <span className="hpx-icon" aria-hidden="true">
                    {body.icon}
                  </span>

                  <span className="hpx-head-text">
                    <strong>{body.shortName || body.title}</strong>
                    {body.fullName && <small>{body.fullName}</small>}
                  </span>
                </Link>

                <ul className="hpx-chips">
                  {shown.map((exam) => (
                    <li key={exam.slug}>
                      <Link
                        to={`/take-mock-test/${body.slug}/${exam.slug}`}
                      >
                        {exam.name}
                      </Link>
                    </li>
                  ))}

                  {more > 0 && (
                    <li className="hpx-more">
                      <Link to={`/take-mock-test/${body.slug}`}>
                        +{more} more
                      </Link>
                    </li>
                  )}
                </ul>

                <div className="hpx-card-foot">
                  <span className="hpx-count">
                    {body.subExams.length}{" "}
                    {body.subExams.length === 1 ? "exam" : "exams"}
                    {count > 0 &&
                      ` · ${count} ${count === 1 ? "test" : "tests"}`}
                  </span>

                  <Link
                    to={`/take-mock-test/${body.slug}`}
                    className="hpx-open"
                  >
                    View exams
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}