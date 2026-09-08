import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero";
import { EXAM_TAXONOMY } from "../data/examTaxonomy";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <Hero />

      {/* Popular Exams Section */}
      <section className="exams-section">

        <div className="section-heading">
          <h2>Popular Exams</h2>

          <p>
            Select your exam and start your preparation today.
          </p>
        </div>

        <div className="exams-container">

          {EXAM_TAXONOMY.map((group) => (
            <div key={group.slug} className="exam-card">
              <div className="exam-icon">{group.icon}</div>
              <div className="exam-info">
                <h3>{group.title}</h3>
                <p>{group.subExams.map((s) => s.name).join(", ")}</p>
              </div>
              <button
                className="exam-btn"
                onClick={() => navigate(`/take-mock-test/${group.slug}`)}
              >
                Explore Exam
              </button>
            </div>
          ))}

        </div>

      </section>
    </>
  );
}

export default Home;