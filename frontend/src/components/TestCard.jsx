import { useNavigate } from "react-router-dom";

import { getSubExam } from "../data/examTaxonomy";
import { languageLabel, typeByValue, typeKeyOf } from "../data/testTypes";

import "./TestCard.css";

function formatDuration(seconds) {
  const mins = Math.floor((Number(seconds) || 0) / 60);
  return `${mins} min`;
}

/*
  One test card:  title • questions • duration • free/paid • Start Test
  showExam = also show "Exam · Test type" (used on the All tests page)
*/
export default function TestCard({ test, showExam = false }) {
  const navigate = useNavigate();

  const testId = test.id || test.testId;
  const isFree = test.isFree === true;

  const examName =
    getSubExam(test.topCategory, test.subExam)?.name ||
    test.subExam ||
    "";

  const typeName = typeByValue(typeKeyOf(test))?.singular || "";
  const language = languageLabel(test.languages);

  return (
    <article className="tc-card">
      <div className="tc-top">
        <span className="tc-subject">{test.subject || "General"}</span>

        <span className={`tc-access ${isFree ? "tc-free" : "tc-paid"}`}>
          {isFree ? "Free" : "Paid"}
        </span>
      </div>

      <h3 className="tc-title">{test.title}</h3>

      {showExam && (examName || typeName) && (
        <p className="tc-exam">
          {[examName, typeName].filter(Boolean).join(" · ")}
        </p>
      )}

      <ul className="tc-meta">
        <li>{Number(test.totalQuestions) || 0} Questions</li>
        <li>{formatDuration(test.duration)}</li>
        <li>
          +{Number(test.marksPerCorrect) || 0} / -
          {Number(test.negativeMarking) || 0}
        </li>
        {language && <li>{language}</li>}
      </ul>

      <button
        type="button"
        className="tc-start"
        onClick={() =>
          navigate(`/mock-test/${encodeURIComponent(testId)}`)
        }
      >
        Start Test
      </button>
    </article>
  );
}