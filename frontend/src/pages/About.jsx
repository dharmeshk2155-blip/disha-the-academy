import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EXAM_TAXONOMY } from "../data/examTaxonomy";
import "./About.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const TEAM = [
  {
    name: "Dharmesh Kumar",
    role: "Founder & Developer",
    bio: "Built Disha The Academy to make quality, affordable exam preparation accessible to every student in Himachal Pradesh and beyond.",
  },
];

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-IN");
}

export default function About() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setStatsLoading(false);
      })
      .catch(() => {
        // If the stats endpoint fails, we simply don't show fabricated numbers.
        setStats(null);
        setStatsLoading(false);
      });
  }, []);

  const displayStats = [
    {
      label: "Registered Students",
      value: stats?.registeredStudents,
      loading: statsLoading,
    },
    {
      label: "Mock Tests",
      value: stats?.mockTestsCount,
      loading: statsLoading,
    },
    {
      label: "Exam Categories",
      value: EXAM_TAXONOMY.length,
      loading: false, // this one is static, never depends on the API call
    },
    {
      label: "Questions Bank",
      value: stats?.questionsCount,
      loading: statsLoading,
    },
  ];

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

      {/* Stats — real numbers from the database, not placeholders */}
      <section className="about-section about-stats-section">
        <h2>Disha The Academy in Numbers</h2>
        <div className="about-stats-grid">
          {displayStats.map((stat) => (
            <div key={stat.label} className="about-stat-card">
              <div className="about-stat-value">
                {stat.loading ? "…" : formatNumber(stat.value)}
              </div>
              <div className="about-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="about-stats-note">
          Live numbers, updated automatically as our platform grows.
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