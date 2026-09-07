import { useNavigate } from "react-router-dom";
import { EXAM_TAXONOMY } from "../data/examTaxonomy";
import "./ExamCategories.css";

export default function ExamGroups() {
  const navigate = useNavigate();

  return (
    <div className="ec-page">
      <button className="ec-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="ec-header">
        <h1>Take a Mock Test</h1>
        <p>Choose an exam category to see available exams.</p>
      </div>

      <div className="ec-grid">
        {EXAM_TAXONOMY.map((group) => (
          <div
            key={group.slug}
            className="ec-card"
            onClick={() => navigate(`/take-mock-test/${group.slug}`)}
          >
            <div className="ec-card-icon">{group.icon}</div>
            <div className="ec-card-info">
              <div className="ec-card-title">{group.title}</div>
              <div className="ec-card-subtitle">
                {group.subExams.map((s) => s.name).join(", ")}
              </div>
            </div>
            <button className="ec-card-btn">Explore Tests</button>
          </div>
        ))}
      </div>
    </div>
  );
}