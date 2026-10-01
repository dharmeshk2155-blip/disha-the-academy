import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileQuestion,
  FileText,
  Newspaper,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";

import {
  CATEGORY_ICONS,
  CATEGORY_TILES,
  DEFAULT_ICON,
  POPULAR_EXAMS,
  RESOURCES,
  WHY_POINTS,
} from "./home/homeConfig";

import {
  badgeTone,
  buildNoteCards,
  buildTestTabs,
  formatDate,
  priceText,
  readMinutes,
  shortText,
  testLogoUrl,
} from "./home/homeHelpers";

import "./Home.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

// Optional: put a hero picture at src/assets/home-hero.png (or .webp/.jpg)
// and it replaces the drawn illustration automatically.
const heroFiles = import.meta.glob("../assets/home-hero.{png,webp,jpg,jpeg}", {
  eager: true,
  import: "default",
});

const HERO_IMAGE = Object.values(heroFiles)[0] || null;

const RESOURCE_ICONS = {
  file: FileText,
  book: BookOpen,
  clipboard: ClipboardList,
};

/* =====================================================
   SMALL HELPERS
===================================================== */

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("dishaUser"));
  } catch {
    return null;
  }
}

// Loads a public list once. status: "loading" | "ok" | "error"
function useApiList(path) {
  const [state, setState] = useState({ status: "loading", data: [] });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE}${path}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        return response.json();
      })
      .then((data) =>
        setState({ status: "ok", data: Array.isArray(data) ? data : [] })
      )
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ status: "error", data: [] });
        }
      });

    return () => controller.abort();
  }, [path]);

  return state;
}

function SectionHead({ id, title, subtitle, to, linkText }) {
  return (
    <div className="hm-head">
      <div>
        <h2 id={id}>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {to && (
        <Link to={to} className="hm-viewall">
          {linkText}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function SkeletonGrid({ className, count, height }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="hm-skel" style={{ height }} />
      ))}
    </div>
  );
}

// Exam logo with a safe fallback icon if the image cannot load
function ExamLogo({ src, Icon, color }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className="hm-logo hm-logo-fallback"
        style={{ color, background: `${color}14` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
    );
  }

  return (
    <img
      className="hm-logo"
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

/* =====================================================
   1. HERO
===================================================== */

function HeroIllustration() {
  const books = [
    { x: 128, y: 238, w: 152, fill: "#6b46c1", label: "SCIENCE" },
    { x: 136, y: 212, w: 144, fill: "#1d6fdc", label: "ENGLISH" },
    { x: 124, y: 186, w: 154, fill: "#e8590c", label: "MATHS" },
    { x: 134, y: 160, w: 146, fill: "#2b9348", label: "REASONING" },
    { x: 128, y: 134, w: 150, fill: "#0b1f4d", label: "GK & CA" },
  ];

  return (
    <svg
      className="hm-illus"
      viewBox="0 0 460 300"
      focusable="false"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hmSun" cx="50%" cy="40%" r="65%">
          <stop offset="0" stopColor="#fff1c2" />
          <stop offset="1" stopColor="#f9cf62" />
        </radialGradient>
      </defs>

      <circle cx="205" cy="160" r="118" fill="url(#hmSun)" />

      <path d="M86 268C52 232 60 186 102 164c12 44 6 80-16 104z" fill="#2a9d8f" />
      <path d="M102 268c-8-30 4-58 34-74 4 30-6 58-34 74z" fill="#67c6b8" />
      <path d="M326 268c34-36 26-82-16-104-12 44-6 80 16 104z" fill="#2a9d8f" />
      <path d="M310 268c8-30-4-58-34-74-4 30 6 58 34 74z" fill="#67c6b8" />

      {books.map((book) => (
        <g key={book.label}>
          <rect x={book.x} y={book.y} width={book.w} height="26" rx="4" fill={book.fill} />
          <rect x={book.x + book.w - 12} y={book.y + 3} width="10" height="20" rx="2" fill="#fdf6e3" />
          <text x={book.x + 12} y={book.y + 17} fontSize="10" fontWeight="800" fill="#fff" letterSpacing="1">
            {book.label}
          </text>
        </g>
      ))}

      <g transform="translate(0 -12)">
        <path d="M203 92l56 20-56 20-56-20z" fill="#0b1f4d" />
        <path d="M173 124v16c0 10 60 10 60 0v-16l-30 11z" fill="#17356f" />
        <path d="M259 112v26" stroke="#f4b942" strokeWidth="3" strokeLinecap="round" />
        <circle cx="259" cy="142" r="4" fill="#f4b942" />
      </g>

      <g
        transform="translate(62 56)"
        fill="none"
        stroke="#d99a16"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M0 -18a16 16 0 0 1 10 28c-3 3-4 5-4 9h-12c0-4-1-6-4-9A16 16 0 0 1 0 -18z" />
        <path d="M-6 24h12M-4 29h8" />
        <path d="M-26 -10l-6-3M26 -10l6-3M0 -30v-7" />
      </g>

      <g
        transform="rotate(-9 380 150)"
        fill="#0b1f4d"
        fontWeight="800"
        fontStyle="italic"
        fontSize="20"
        letterSpacing="2"
      >
        <text x="312" y="104">STUDY</text>
        <text x="312" y="134">PRACTICE</text>
        <text x="312" y="164">LEARN</text>
        <text x="312" y="194">ACHIEVE</text>
      </g>
    </svg>
  );
}

function Hero() {
  return (
    <section className="hm-hero" aria-labelledby="hm-hero-title">
      <div className="hm-hero-copy">
        <p className="hm-hero-kicker">Himachal's Exam Preparation Platform</p>

        <h1 id="hm-hero-title">
          <span>Right Guidence.</span>
          <span className="hm-gold">Brighter Tomorrow.</span>
        </h1>

        <p className="hm-hero-lead">
          Get exam-focused study notes, mock tests, current affairs and
          more – all in one place.
        </p>

        <div className="hm-hero-cta">
          <Link to="/notes" className="hm-btn hm-btn-gold">
            Explore Study Notes
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

          <Link to="/take-mock-test" className="hm-btn hm-btn-navy">
            Take a Mock Test
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="hm-hero-art">
        {HERO_IMAGE ? (
          <img src={HERO_IMAGE} alt="" />
        ) : (
          <HeroIllustration />
        )}
      </div>
    </section>
  );
}

/* =====================================================
   2. EXAM CATEGORIES
===================================================== */

function ExamCategories() {
  return (
    <section className="hm-sec" id="exam-categories" aria-labelledby="hm-cat-h">
      <SectionHead
        id="hm-cat-h"
        title="What are you preparing for?"
        subtitle="Choose your exam category and get started with the best study resources."
        to="/take-mock-test"
        linkText="View All Exams"
      />

      <div className="hm-cats">
        {CATEGORY_TILES.map(({ key, label, Icon, color, to }) => (
          <Link key={key} to={to} className="hm-card hm-cat">
            <span className="hm-cat-icon" style={{ color }} aria-hidden="true">
              <Icon size={30} />
            </span>
            <span className="hm-cat-name">{label}</span>
            <span className="hm-cat-sub">Exams</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* =====================================================
   3. POPULAR EXAMS
===================================================== */

function PopularExams() {
  return (
    <section className="hm-sec" aria-labelledby="hm-pop-h">
      <SectionHead
        id="hm-pop-h"
        title="Popular Exams"
        subtitle="Explore top exams and start preparing with focused study material."
        to="/take-mock-test"
        linkText="View All Exams"
      />

      <div className="hm-popular">
        {POPULAR_EXAMS.map((exam) => (
          <article key={exam.key} className="hm-card hm-exam">
            <ExamLogo
              src={exam.logo}
              Icon={exam.fallback.Icon}
              color={exam.fallback.color}
            />

            <h3>{exam.title}</h3>
            <p>
              {exam.tags.slice(0, 2).join(" • ")}
              <br />
              {exam.tags.slice(2).join(" • ")}
            </p>

            <Link to={exam.to} className="hm-btn-outline">
              Explore
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/* =====================================================
   4. POPULAR STUDY NOTES
===================================================== */

function StudyNotes({ state }) {
  const cards = useMemo(() => buildNoteCards(state.data), [state.data]);

  if (state.status === "error" || (state.status === "ok" && !cards.length)) {
    return null;
  }

  return (
    <section className="hm-sec" aria-labelledby="hm-notes-h">
      <SectionHead
        id="hm-notes-h"
        title="Popular Study Notes"
        subtitle="High-quality, exam-focused study notes to boost your preparation."
        to="/notes"
        linkText="View All Study Notes"
      />

      {state.status === "loading" ? (
        <SkeletonGrid className="hm-notes" count={6} height={150} />
      ) : (
        <div className="hm-notes">
          {cards.map((card) => (
            <article key={card.slug} className="hm-card hm-note">
              <div className="hm-note-top">
                <span
                  className="hm-note-tile"
                  style={{ background: card.tone }}
                  aria-hidden="true"
                >
                  {card.label ? <b>{card.label}</b> : <BookOpen size={24} />}
                </span>

                <div>
                  <h3>{card.title}</h3>
                  {card.subtitle && <p>{card.subtitle}</p>}
                </div>
              </div>

              <div className="hm-price">{priceText(card)}</div>

              <Link to={`/notes/${card.slug}`} className="hm-btn-outline">
                View Details
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* =====================================================
   5. MOCK TESTS
===================================================== */

function MockTests({ state }) {
  const tabs = useMemo(() => buildTestTabs(state.data), [state.data]);
  const [activeKey, setActiveKey] = useState("popular");

  if (state.status === "error" || (state.status === "ok" && !tabs.length)) {
    return null;
  }

  const active = tabs.find((tab) => tab.key === activeKey) || tabs[0];

  return (
    <section className="hm-sec" aria-labelledby="hm-tests-h">
      <SectionHead
        id="hm-tests-h"
        title="Mock Tests / Test Series"
        subtitle="Attempt exam-style mock tests and track your performance."
        to="/take-mock-test"
        linkText="View All Mock Tests"
      />

      {state.status === "loading" ? (
        <SkeletonGrid className="hm-tests" count={4} height={170} />
      ) : (
        <>
          <div className="hm-tabs" role="tablist" aria-label="Mock test categories">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                className="hm-tab"
                aria-selected={tab.key === active.key}
                onClick={() => setActiveKey(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hm-tests" role="tabpanel">
            {active.tests.map((test) => {
              const fallback = CATEGORY_ICONS[test.topCategory] || DEFAULT_ICON;

              return (
                <article key={test.id} className="hm-card hm-test">
                  <div className="hm-test-top">
                    <ExamLogo
                      src={testLogoUrl(test)}
                      Icon={fallback.Icon}
                      color={fallback.color}
                    />
                    <h3>{test.title}</h3>
                  </div>

                  <ul className="hm-test-meta">
                    <li>
                      <FileQuestion size={15} aria-hidden="true" />
                      {test.questions} Questions
                    </li>
                    <li>
                      <Target size={15} aria-hidden="true" />
                      {test.marks} Marks
                    </li>
                    <li>
                      <Clock3 size={15} aria-hidden="true" />
                      {test.minutes} Minutes
                    </li>
                  </ul>

                  <Link
                    to={
                      test.isFree
                        ? `/free-tests/attempt/${test.id}`
                        : `/mock-test/${test.id}`
                    }
                    className="hm-btn-outline"
                  >
                    Attempt Test
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

/* =====================================================
   6. CURRENT AFFAIRS
===================================================== */

function CurrentAffairs({ state }) {
  const items = state.data.slice(0, 4);

  if (state.status === "error" || (state.status === "ok" && !items.length)) {
    return null;
  }

  return (
    <section className="hm-sec" aria-labelledby="hm-ca-h">
      <SectionHead
        id="hm-ca-h"
        title="Current Affairs"
        subtitle="Stay updated with the latest current affairs important for competitive exams."
        to="/current-affairs"
        linkText="View All Current Affairs"
      />

      {state.status === "loading" ? (
        <SkeletonGrid className="hm-affairs" count={4} height={250} />
      ) : (
        <div className="hm-affairs">
          {items.map((item) => {
            const tone = badgeTone(item.category);

            return (
              <article key={item.id} className="hm-card hm-affair">
                <div className="hm-affair-img">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <Newspaper size={34} aria-hidden="true" />
                  )}
                </div>

                <div className="hm-affair-body">
                  <div className="hm-affair-meta">
                    <span>{formatDate(item.date)}</span>

                    {item.category && (
                      <span className="hm-badge" style={tone}>
                        {item.category}
                      </span>
                    )}
                  </div>

                  <h3>{item.title}</h3>
                  <p>{shortText(item.summary || item.content, 120)}</p>

                  <Link to={`/current-affairs/${item.id}`} className="hm-readmore">
                    Read Full Article
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =====================================================
   7. EXPLORE MORE RESOURCES
===================================================== */

function Resources() {
  return (
    <section className="hm-sec" aria-labelledby="hm-res-h">
      <SectionHead
        id="hm-res-h"
        title="Explore More Resources"
        subtitle="Access additional resources to strengthen your preparation."
      />

      <div className="hm-resources">
        {RESOURCES.map((item) => {
          const Icon = RESOURCE_ICONS[item.iconKey];

          return (
            <Link key={item.key} to={item.to} className="hm-card hm-resource">
              <span
                className="hm-resource-icon"
                style={{ color: item.color, background: item.bg }}
                aria-hidden="true"
              >
                <Icon size={22} />
              </span>

              <span>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* =====================================================
   8. ACCOUNT / CONTINUE LEARNING
===================================================== */

function AccountBand({ user }) {
  const firstName = user?.fullName ? String(user.fullName).split(" ")[0] : "";

  const chips = [
    { Icon: BookOpen, label: "Study Notes", color: "#d99a16" },
    { Icon: ClipboardList, label: "Mock Tests", color: "#1d6fdc" },
    { Icon: Newspaper, label: "Current Affairs", color: "#16805f" },
    { Icon: TrendingUp, label: "Track Progress", color: "#d62839" },
  ];

  return (
    <section className="hm-account" aria-labelledby="hm-acc-h">
      <div className="hm-account-main">
        <h2 id="hm-acc-h">
          {user
            ? `Welcome back${firstName ? `, ${firstName}` : ""}`
            : "Start Your Preparation Journey"}
        </h2>

        <p>
          {user
            ? "Pick up where you left off – your notes, tests and results are one click away."
            : "Create a free account and get access to study notes, mock tests, current affairs and track your progress."}
        </p>

        <ul className="hm-chips">
          {chips.map(({ Icon, label, color }) => (
            <li key={label}>
              <Icon size={16} color={color} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <Link
          to={user ? "/dashboard" : "/register"}
          className="hm-btn hm-btn-gold"
        >
          {user ? "Continue Learning" : "Create Free Account"}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="hm-account-side">
        <strong>{user ? "Your progress" : "Already a member?"}</strong>

        <p>
          {user
            ? "See your test results and performance."
            : "Login to continue your preparation."}
        </p>

        <Link
          to={user ? "/my-results" : "/login"}
          className="hm-btn-outline hm-btn-wide"
        >
          {user ? "My Results" : "Login"}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* =====================================================
   9. BLOG
===================================================== */

function BlogSection({ state }) {
  const items = state.data.slice(0, 3);

  if (state.status === "error" || (state.status === "ok" && !items.length)) {
    return null;
  }

  return (
    <section className="hm-sec" aria-labelledby="hm-blog-h">
      <SectionHead
        id="hm-blog-h"
        title="Latest From Disha Learning Journal"
        subtitle="Explore study guides, exam analysis and preparation tips."
        to="/blog"
        linkText="View All Blogs"
      />

      {state.status === "loading" ? (
        <SkeletonGrid className="hm-blogs" count={3} height={110} />
      ) : (
        <div className="hm-blogs">
          {items.map((item) => {
            const tone = badgeTone(item.category);

            return (
              <article key={item.id} className="hm-card hm-blog">
                <div className="hm-blog-img">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <FileText size={28} aria-hidden="true" />
                  )}
                </div>

                <div className="hm-blog-body">
                  {item.category && (
                    <span className="hm-badge" style={tone}>
                      {item.category}
                    </span>
                  )}

                  <h3>{item.title}</h3>

                  <span className="hm-blog-time">
                    <CalendarDays size={13} aria-hidden="true" />
                    {readMinutes(item.summary, item.content)} min read
                  </span>

                  <Link to={`/blog/${item.id}`} className="hm-readmore">
                    Read Article
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =====================================================
   10. WHY DISHA
===================================================== */

function WhyDisha() {
  return (
    <section className="hm-sec" aria-labelledby="hm-why-h">
      <SectionHead
        id="hm-why-h"
        title="Why Disha The Academy?"
        subtitle="Everything you need to prepare better."
      />

      <div className="hm-why">
        {WHY_POINTS.map(({ key, title, text, Icon, color, bg }) => (
          <div key={key} className="hm-card hm-why-item">
            <span className="hm-why-icon" style={{ color, background: bg }} aria-hidden="true">
              <Icon size={22} />
            </span>

            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =====================================================
   11. FINAL CTA
===================================================== */

function FinalCta() {
  function scrollToCategories() {
    document
      .getElementById("exam-categories")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="hm-final" aria-labelledby="hm-final-h">
      <Trophy size={40} color="#f4b942" aria-hidden="true" />

      <div className="hm-final-text">
        <h2 id="hm-final-h">Ready to Start Your Preparation?</h2>
        <p>
          Join Disha The Academy and prepare with notes, tests and current
          affairs in one place.
        </p>
      </div>

      <div className="hm-final-cta">
        <button type="button" className="hm-btn hm-btn-gold" onClick={scrollToCategories}>
          Explore Exams
          <ArrowRight size={16} aria-hidden="true" />
        </button>

        <Link to="/take-mock-test" className="hm-btn hm-btn-ghost">
          Start Mock Test
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function Home() {
  const user = useMemo(readUser, []);

  const notes = useApiList("/api/notes");
  const tests = useApiList("/api/tests");
  const affairs = useApiList("/api/current-affairs");
  const blogs = useApiList("/api/blog");

  return (
    <div className="hm">
      <Hero />
      <ExamCategories />
      <PopularExams />
      <StudyNotes state={notes} />
      <MockTests state={tests} />
      <CurrentAffairs state={affairs} />
      <Resources />
      <AccountBand user={user} />
      <BlogSection state={blogs} />
      <WhyDisha />
      <FinalCta />
    </div>
  );
}