import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero";

const EXAM_CATEGORIES = [
  { icon: "📝", title: "SSC Exams", subtitle: "CGL, CHSL, GD, MTS, CPO" },
  { icon: "🏦", title: "Banking Exams", subtitle: "IBPS PO/Clerk, SBI PO/Clerk, RBI" },
  { icon: "🚆", title: "Railway Exams", subtitle: "RRB NTPC, Group D, ALP, Technician" },
  { icon: "🎓", title: "Teaching Exams", subtitle: "CTET, TET, UGC NET" },
  { icon: "🏛️", title: "Civil Services", subtitle: "UPSC, State PSC" },
  { icon: "🪖", title: "Defence Exams", subtitle: "NDA, CDS, AFCAT, Agniveer" },
  { icon: "👮", title: "Police Exams", subtitle: "State Police, SSC GD, SI" },
  { icon: "⚙️", title: "Engineering Exams", subtitle: "JEE, GATE, JE/AE Recruitment" },
];

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
            Practice mock tests for India's most in-demand
            competitive exams.
          </p>
        </div>

        <div className="exams-container">

          {EXAM_CATEGORIES.map((exam) => (
            <div key={exam.title} className="exam-card">
              <div className="exam-icon">{exam.icon}</div>
              <h3>{exam.title}</h3>
              <p>{exam.subtitle}</p>
              <button
                className="exam-btn"
                onClick={() => navigate("/take-mock-test")}
              >
                Explore Tests
              </button>
            </div>
          ))}

        </div>

      </section>
    </>
  );
}

export default Home;