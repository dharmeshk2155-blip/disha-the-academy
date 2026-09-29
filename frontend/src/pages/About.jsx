import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EXAM_TAXONOMY } from "../data/examTaxonomy";
import "./About.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

const DEFAULT_ABOUT = {
  title: "About Disha The Academy",
  introduction:
    "Disha The Academy is dedicated to helping students prepare for competitive exams through high-quality study material, mock tests, and exam-focused content.",
  mission:
    "To provide high-quality, exam-oriented study material and practice resources that help every student build confidence and achieve their goals.",
  vision:
    "To become a trusted and leading platform for competitive exam preparation, known for reliable content, affordable access and student success.",
};

const TEAM = [
  {
    name: "Dharmesh Kumar",
    role: "Founder & Developer",
    bio: "Building Disha The Academy to provide quality study material, mock tests and helpful resources for every competitive exam aspirant.",
  },
];

function formatNumber(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("en-IN");
}

function StoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5c2.8-.9 5.4-.5 8 1.1v12c-2.6-1.6-5.2-2-8-1.1V5.5Zm16 0c-2.8-.9-5.4-.5-8 1.1v12c2.6-1.6 5.2-2 8-1.1V5.5Z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="17" />
      <circle cx="24" cy="24" r="10" />
      <circle cx="24" cy="24" r="3" />
      <path d="M27 20 40 7" />
      <path d="M34 7h6v6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M5 24s7-12 19-12 19 12 19 12-7 12-19 12S5 24 5 24Z" />
      <circle cx="24" cy="24" r="6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="17" cy="18" r="5.5" />
      <circle cx="31" cy="19" r="4.5" />
      <path d="M6 37c.6-7.1 5.2-11 11-11s10.4 3.9 11 11" />
      <path d="M27 28.5c6.8-.8 12.4 3 13.5 8.5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M13 6h17l7 7v29H13V6Z" />
      <path d="M30 6v8h7" />
      <path d="M19 22h12M19 28h12M19 34h8" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function AcademyIllustration() {
  return (
    <svg
      className="about-v2-art"
      viewBox="0 0 430 250"
      role="img"
      aria-label="Graduation cap, books and study materials"
    >
      <defs>
        <linearGradient id="av2-cap" x1="0" x2="1">
          <stop offset="0%" stopColor="#071f4b" />
          <stop offset="100%" stopColor="#173d72" />
        </linearGradient>

        <linearGradient id="av2-gold" x1="0" x2="1">
          <stop offset="0%" stopColor="#f39a00" />
          <stop offset="100%" stopColor="#ffc548" />
        </linearGradient>

        <linearGradient id="av2-book-blue" x1="0" x2="1">
          <stop offset="0%" stopColor="#0b2d61" />
          <stop offset="100%" stopColor="#174a82" />
        </linearGradient>

        <filter id="av2-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#16345c" floodOpacity=".16" />
        </filter>
      </defs>

      <g opacity=".98">
        <path d="M90 159C49 128 44 91 52 53c35 15 53 48 38 106Z" fill="#2d8c67" />
        <path d="M113 159c-23-48-5-87 24-108 22 44 9 79-24 108Z" fill="#53aa7d" />
        <path d="M76 179c-38 2-61-13-71-39 38-8 65 5 71 39Z" fill="#50b183" />
        <path d="M80 180c25-40 58-51 89-42-15 36-45 51-89 42Z" fill="#2f946d" />
      </g>

      <g filter="url(#av2-shadow)">
        <polygon points="191,42 289,10 392,42 290,75" fill="url(#av2-cap)" />
        <path d="M230 60v37c35 17 82 17 119 0V60" fill="#0d2f63" />
        <path d="M392 43v52" fill="none" stroke="#f4a000" strokeWidth="4" strokeLinecap="round" />
        <circle cx="392" cy="99" r="5.5" fill="#f4a000" />
        <path d="m392 103-7 23h14Z" fill="#f4a000" />

        <rect x="192" y="112" width="199" height="29" rx="9" fill="url(#av2-gold)" />
        <path d="M214 119h153c9 0 14 5 14 8s-5 8-14 8H214Z" fill="#fff4d4" opacity=".95" />
        <rect x="204" y="144" width="190" height="29" rx="8" fill="url(#av2-book-blue)" />
        <path d="M224 150h151c8 0 12 4 12 8s-4 8-12 8H224Z" fill="#eaf2fb" />
        <rect x="190" y="176" width="207" height="30" rx="9" fill="#fff" stroke="#cfdceb" strokeWidth="3" />
        <path d="M213 183h166c7 0 11 4 11 8s-4 8-11 8H213Z" fill="#f2f6fb" />
        <rect x="208" y="208" width="185" height="27" rx="8" fill="url(#av2-book-blue)" />
      </g>

      <g filter="url(#av2-shadow)">
        <path d="M108 151h62l-7 84h-48Z" fill="#fff" stroke="#dce7f2" strokeWidth="3" />
        <path d="m120 152-16-77 8-2 17 79Z" fill="#ffb62c" />
        <path d="m137 152 2-86 9 .2-2 86Z" fill="#f3a000" />
        <path d="m153 153 28-74 8 3-27 73Z" fill="#df751c" />
        <path d="m110 75-5-12 3-1 4 12Z" fill="#17375f" />
        <path d="m141 66 3-13 3 1-1 13Z" fill="#17375f" />
        <path d="m182 81 7-11 3 2-5 11Z" fill="#17375f" />
      </g>
    </svg>
  );
}

export default function About() {
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [stats, setStats] = useState(null);
  const [aboutLoading, setAboutLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function loadAbout() {
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
            mission: data.page.mission || DEFAULT_ABOUT.mission,
            vision: data.page.vision || DEFAULT_ABOUT.vision,
          });
        }
      } catch (error) {
        console.error("About page load error:", error);
        setAbout(DEFAULT_ABOUT);
      } finally {
        setAboutLoading(false);
      }
    }

    loadAbout();
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch(`${API_BASE}/api/stats`);

        if (!response.ok) {
          throw new Error("Failed to load stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Stats load error:", error);
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    {
      label: "Popular Exam Categories",
      value: EXAM_TAXONOMY.length,
      icon: <UsersIcon />,
      theme: "blue",
    },
    {
      label: "Study Notes",
      value: stats?.notesCount ?? stats?.totalNotes,
      icon: <DocumentIcon />,
      theme: "gold",
    },
    {
      label: "Mock Test Questions",
      value: stats?.questionsCount,
      icon: <DocumentIcon />,
      theme: "green",
    },
    {
      label: "Active Students",
      value: stats?.registeredStudents,
      icon: <UsersIcon />,
      theme: "red",
    },
  ];

  return (
    <div className="about-v2-page">
      <section className="about-v2-hero">
        <div className="about-v2-slogan">
          <span>Your</span>
          <span>Success</span>
          <span>Our Mission</span>
          <i aria-hidden="true" />
        </div>

        <div className="about-v2-hero-copy">
          <div className="about-v2-story">
            <StoryIcon />
            <span>OUR STORY</span>
          </div>

          <h1>
            About <span>Disha The Academy</span>
          </h1>

          <p>
            {aboutLoading ? "Loading..." : about.introduction}
          </p>
        </div>

        <div className="about-v2-art-wrap">
          <AcademyIllustration />
        </div>
      </section>

      <section className="about-v2-purpose-grid">
        <article className="about-v2-purpose-card">
          <div className="about-v2-purpose-icon">
            <TargetIcon />
          </div>

          <div className="about-v2-purpose-copy">
            <h2>Our Mission</h2>
            <p>{aboutLoading ? "Loading..." : about.mission}</p>
          </div>

          <div className="about-v2-purpose-watermark">
            <TargetIcon />
          </div>
        </article>

        <article className="about-v2-purpose-card">
          <div className="about-v2-purpose-icon">
            <EyeIcon />
          </div>

          <div className="about-v2-purpose-copy">
            <h2>Our Vision</h2>
            <p>{aboutLoading ? "Loading..." : about.vision}</p>
          </div>

          <div className="about-v2-purpose-watermark">
            <EyeIcon />
          </div>
        </article>
      </section>

      <section className="about-v2-numbers">
        <div className="about-v2-heading">
          <h2>Disha The Academy in Numbers</h2>
          <p>Trusted by thousands of aspirants across India.</p>
        </div>

        <div className="about-v2-number-grid">
          {statCards.map((stat) => (
            <article
              key={stat.label}
              className="about-v2-number-card"
            >
              <div
                className={`about-v2-number-icon ${stat.theme}`}
              >
                {stat.icon}
              </div>

              <div className="about-v2-number-copy">
                <strong>
                  {statsLoading && stat.value === undefined
                    ? "…"
                    : formatNumber(stat.value)}

                  {!statsLoading &&
                  stat.value !== null &&
                  stat.value !== undefined
                    ? "+"
                    : ""}
                </strong>

                <span>{stat.label}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-v2-team">
        <div className="about-v2-heading">
          <h2>Meet the Team</h2>
          <p>
            A small team with a big mission — to support your exam
            preparation journey.
          </p>
        </div>

        <div className="about-v2-team-grid">
          {TEAM.map((member) => (
            <article
              key={member.name}
              className="about-v2-team-card"
            >
              <div className="about-v2-avatar">
                {member.name.charAt(0).toUpperCase()}
              </div>

              <h3>{member.name}</h3>
              <span>{member.role}</span>
              <p>{member.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-v2-contact">
        <div className="about-v2-contact-copy">
          <h2>
            Have <span>questions?</span>
          </h2>

          <p>
            We're always here to help you. If you have any queries
            about notes, tests, payments or anything else, feel free
            to contact us.
          </p>
        </div>

        <Link
          to="/contact"
          className="about-v2-contact-btn"
        >
          <MailIcon />
          <span>Contact Us</span>
          <strong>→</strong>
        </Link>
      </section>
    </div>
  );
}
