import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EXAM_TAXONOMY } from "../data/examTaxonomy";
import "./About.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

const TEAM = [
  {
    name: "Dharmesh Kumar",
    role: "Founder & Developer",
    bio: "Built Disha The Academy to make quality, affordable exam preparation accessible to every student in Himachal Pradesh and beyond.",
  },
];

const DEFAULT_ABOUT = {
  title: "About Disha The Academy",
  introduction:
    "Disha The Academy is dedicated to helping students prepare for competitive exams through structured mock tests, curated notes, and daily current affairs updates.",
  content: "",
  mission:
    "To provide every aspiring candidate — regardless of location or background — with quality exam preparation at an affordable price.",
  vision:
    "To become a trusted platform for government exam preparation and help students achieve their career goals.",
};

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-IN");
}

export default function About() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [aboutLoading, setAboutLoading] = useState(true);

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/about`);

        if (!response.ok) {
          throw new Error("Failed to load About page");
        }

        const data = await response.json();

        if (data.success && data.page) {
          setAbout({
            title: data.page.title || DEFAULT_ABOUT.title,
            introduction:
              data.page.introduction || DEFAULT_ABOUT.introduction,
            content: data.page.content || "",
            mission: data.page.mission || DEFAULT_ABOUT.mission,
            vision: data.page.vision || DEFAULT_ABOUT.vision,
          });
        }
      } catch (error) {
        console.error("About page load error:", error);

        // Keep fallback content if API is temporarily unavailable.
        setAbout(DEFAULT_ABOUT);
      } finally {
        setAboutLoading(false);
      }
    };

    loadAbout();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/stats`);

        if (!response.ok) {
          throw new Error("Failed to load stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Stats load error:", error);

        // Do not display fabricated statistics.
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
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
      loading: false,
    },
    {
      label: "Questions Bank",
      value: stats?.questionsCount,
      loading: statsLoading,
    },
  ];

  return (
    <div className="about-page">
      {/* =========================
          HERO
      ========================== */}
      <section className="about-hero">
        {aboutLoading ? (
          <>
            <h1>About Disha The Academy</h1>
            <p>Loading...</p>
          </>
        ) : (
          <>
            <h1>{about.title}</h1>

            {about.introduction && (
              <p>{about.introduction}</p>
            )}
          </>
        )}
      </section>

      {/* =========================
          MAIN ABOUT CONTENT
      ========================== */}
      {!aboutLoading && about.content && (
        <section className="about-section">
          <div className="about-card about-main-content">
            <h2>Who We Are</h2>

            <p className="about-content-text">
              {about.content}
            </p>
          </div>
        </section>
      )}

      {/* =========================
          MISSION & VISION
      ========================== */}
      <section className="about-section">
        <div className="about-grid-2col">
          <div className="about-card">
            <h2>Our Mission</h2>

            <p>
              {aboutLoading
                ? "Loading..."
                : about.mission}
            </p>
          </div>

          <div className="about-card">
            <h2>Our Vision</h2>

            <p>
              {aboutLoading
                ? "Loading..."
                : about.vision}
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          LIVE STATISTICS
      ========================== */}
      <section className="about-section about-stats-section">
        <h2>Disha The Academy in Numbers</h2>

        <div className="about-stats-grid">
          {displayStats.map((stat) => (
            <div
              key={stat.label}
              className="about-stat-card"
            >
              <div className="about-stat-value">
                {stat.loading
                  ? "…"
                  : formatNumber(stat.value)}
              </div>

              <div className="about-stat-label">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <p className="about-stats-note">
          Live numbers, updated automatically as our
          platform grows.
        </p>
      </section>

      {/* =========================
          TEAM
      ========================== */}
      <section className="about-section">
        <h2>Meet the Team</h2>

        <div className="about-team-grid">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="about-team-card"
            >
              <div className="about-team-avatar">
                {member.name.charAt(0)}
              </div>

              <h3>{member.name}</h3>

              <p className="about-team-role">
                {member.role}
              </p>

              <p className="about-team-bio">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================
          CONTACT CTA
      ========================== */}
      <section className="about-contact-section">
        <h2>Have questions?</h2>

        <p>
          Reach out to us — we're happy to help with
          anything about mock tests, study notes, or
          your exam preparation journey.
        </p>

        <Link
          to="/contact"
          className="about-contact-btn"
        >
          Contact Us
        </Link>
      </section>
    </div>
  );
}