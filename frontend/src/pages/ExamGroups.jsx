import { useNavigate } from "react-router-dom";
import { EXAM_TAXONOMY } from "../data/examTaxonomy";
import "./ExamCategories.css";

// Flatten all sub-exams from every category into one list,
// keeping a reference to the parent group (for icon/title/back-link).
const ALL_EXAMS = EXAM_TAXONOMY.flatMap((group) =>
  group.subExams.map((sub) => ({
    ...sub,
    groupSlug: group.slug,
    groupTitle: group.title,
    groupIcon: group.icon,
  }))
);

export default function ExamGroups() {
  const navigate = useNavigate();

  return (
    <div className="ec-page">
      <button className="ec-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="ec-header">
        <h1>Take a Mock Test</h1>
        <p>Choose an exam to see available mock tests.</p>
      </div>

      <div className="ec-grid">
        {ALL_EXAMS.map((exam) => (
          <div
            key={`${exam.groupSlug}-${exam.slug}`}
            className="ec-card"
            onClick={() =>
              navigate(`/take-mock-test/${exam.groupSlug}/${exam.slug}`)
            }
          >
            <div className="ec-card-icon">{exam.groupIcon}</div>
            <div className="ec-card-info">
              <div className="ec-card-title">{exam.name}</div>
              <div className="ec-card-subtitle">{exam.groupTitle}</div>
            </div>
            <button className="ec-card-btn">Go To Test Series</button>
          </div>
        ))}
      </div>
    </div>
  );
}