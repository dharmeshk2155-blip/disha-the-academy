import { useNavigate, useParams } from "react-router-dom";
import { getExamGroup } from "../data/examTaxonomy";
import "./ExamCategories.css";

export default function SubExams() {
  const { topSlug } = useParams();
  const navigate = useNavigate();
  const group = getExamGroup(topSlug);

  if (!group) {
    return (
      <div className="ec-page">
        <button className="ec-back-btn" onClick={() => navigate("/take-mock-test")}>
          ← Back to Exams
        </button>
        <div className="ec-status">Exam category not found.</div>
      </div>
    );
  }

  return (
    <div className="ec-page">
      <button className="ec-back-btn" onClick={() => navigate("/take-mock-test")}>
        ← Back to Exams
      </button>

      <div className="ec-header">
        <h1>{group.icon} {group.title}</h1>
        <p>Choose a specific exam to see its mock tests.</p>
      </div>

      <div className="ec-grid">
        {group.subExams.map((sub) => (
          <div
            key={sub.slug}
            className="ec-card"
            onClick={() => navigate(`/take-mock-test/${group.slug}/${sub.slug}`)}
          >
            <div className="ec-card-icon">📄</div>
            <div className="ec-card-info">
              <div className="ec-card-title">{sub.name}</div>
              <div className="ec-card-subtitle">{group.title}</div>
            </div>
            <button className="ec-card-btn">View Tests</button>
          </div>
        ))}
      </div>
    </div>
  );
}