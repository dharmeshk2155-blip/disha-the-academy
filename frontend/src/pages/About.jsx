import { Link } from "react-router-dom";
import "./About.css";

const STATS = [
  { label: "Registered Students", value: "10,000+" },
  { label: "Mock Tests", value: "500+" },
  { label: "Exam Categories", value: "8" },
  { label: "Questions Bank", value: "50,000+" },
];

const TEAM = [
  {
    name: "Dharmesh Kumar",
    role: "Founder & Developer",
    bio: "Built Disha The Academy to make quality, affordable exam preparation accessible to every student in Himachal Pradesh and beyond.",
  },
];

export default function About() {
  return (
    <div className="about-page">
      {/* Hero / Mission */}
      <section className="about-hero">
        <h1>About Disha The Academy</h1>
        <p>
          Disha The Academy is dedicated to helping students crack competitive
          exams — from SSC and Banking to Railway, Defence, Teaching, and HP
          Police Constable — through structured mock tests, curated notes,
          and daily current affairs updates.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="about-section">
        <div className="about-grid-2col">
          <div className="about-card">
            <h2>Our Mission</h2>
            <p>
              To provide every aspiring candidate — regardless of location or
              background — with the same quality of exam preparation
              available in big cities, at an affordable price, in both
              English and Hindi.
            </p>
          </div>
          <div className="about-card">
            <h2>Our Vision</h2>
            <p>
              To become Himachal Pradesh's most trusted platform for
              government exam preparation, and to help thousands of students
              achieve their dream of government service every year.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="about-section about-stats-section">
        <h2>Disha The Academy in Numbers</h2>
        <div className="about-stats-grid">
          {STATS.map((stat) => (
            <div key={stat.label} className="about-stat-card">
              <div className="about-stat-value">{stat.value}</div>
              <div className="about-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="about-stats-note">
          * Figures updated periodically as our community grows.
        </p>
      </section>

      {/* Team */}
      <section className="about-section">
        <h2>Meet the Team</h2>
        <div className="about-team-grid">
          {TEAM.map((member) => (
            <div key={member.name} className="about-team-card">
              <div className="about-team-avatar">
                {member.name.charAt(0)}
              </div>
              <h3>{member.name}</h3>
              <p className="about-team-role">{member.role}</p>
              <p className="about-team-bio">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="about-contact-section">
        <h2>Have questions?</h2>
        <p>
          Reach out to us — we're happy to help with anything about mock
          tests, subscriptions, or your exam preparation journey.
        </p>
        <Link to="/contact" className="about-contact-btn">
          Contact Us
        </Link>
      </section>
    </div>
  );
}