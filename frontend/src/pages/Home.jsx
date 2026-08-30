import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import NoteCard from "../components/NoteCard";

function Home() {
 
  return (
    <>
      <Navbar />

      <Hero />

      {/* Popular Notes Section */}
      <section className="notes-section">

        <div className="section-heading">
          <h2>Popular Study Notes</h2>

          <p>
            Quality notes designed to help you prepare better
            and achieve your goals.
          </p>
        </div>

        <div className="notes-container">

          <NoteCard
            title="HP General Knowledge"
            subject="Himachal Pradesh GK"
            price="49"
          />

          <NoteCard
            title="Mathematics Notes"
            subject="Quantitative Aptitude"
            price="49"
          />

          <NoteCard
            title="Reasoning Notes"
            subject="Verbal & Non-Verbal Reasoning"
            price="49"
          />

          <NoteCard
            title="General Science"
            subject="Physics, Chemistry & Biology"
            price="59"
          />

          <NoteCard
            title="English Notes"
            subject="Grammar & Vocabulary"
            price="49"
          />

          <NoteCard
            title="HP Police Constable"
            subject="Complete Exam Preparation"
            price="99"
          />

        </div>

        <button className="view-all-btn">
          View All Notes
        </button>

      </section>
    </>
  );
}

export default Home;