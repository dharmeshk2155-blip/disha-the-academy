import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FAQ_ITEMS } from "../data/staticContent";
import "./FAQ.css";

const categories = [
  { id: "all", label: "All", icon: "✨" },
  { id: "notes", label: "Notes", icon: "📘" },
  { id: "mock", label: "Mock Tests", icon: "📖" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "account", label: "Account", icon: "👤" },
  { id: "technical", label: "Technical", icon: "⚙️" },
  { id: "other", label: "Other", icon: "●" },
];

function detectCategory(item) {
  const text = `${item.question} ${item.answer}`.toLowerCase();

  if (
    text.includes("payment") ||
    text.includes("pay") ||
    text.includes("money") ||
    text.includes("refund")
  ) {
    return "payments";
  }

  if (
    text.includes("mock") ||
    text.includes("test") ||
    text.includes("score") ||
    text.includes("leaderboard")
  ) {
    return "mock";
  }

  if (
    text.includes("login") ||
    text.includes("password") ||
    text.includes("account") ||
    text.includes("profile")
  ) {
    return "account";
  }

  if (
    text.includes("download") ||
    text.includes("note") ||
    text.includes("pdf") ||
    text.includes("study material")
  ) {
    return "notes";
  }

  if (
    text.includes("device") ||
    text.includes("browser") ||
    text.includes("technical") ||
    text.includes("error")
  ) {
    return "technical";
  }

  return "other";
}

export default function FAQ() {
  const [openId, setOpenId] = useState(
    FAQ_ITEMS.length ? FAQ_ITEMS[0].id : null
  );

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const categorizedFaqs = useMemo(() => {
    return FAQ_ITEMS.map((item) => ({
      ...item,
      detectedCategory: item.category || detectCategory(item),
    }));
  }, []);

  const filteredFaqs = useMemo(() => {
    return categorizedFaqs.filter((item) => {
      const matchesCategory =
        activeCategory === "all" ||
        item.detectedCategory === activeCategory;

      const term = search.toLowerCase().trim();

      const matchesSearch =
        !term ||
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [categorizedFaqs, activeCategory, search]);

  const getCount = (category) => {
    if (category === "all") return categorizedFaqs.length;

    return categorizedFaqs.filter(
      (item) => item.detectedCategory === category
    ).length;
  };

  const expandAll = () => {
    if (!filteredFaqs.length) return;

    setOpenId(filteredFaqs[0].id);
  };

  return (
    <main className="faq-page">
      {/* HERO */}
      <section className="faq-hero">
        <div className="faq-hero-content">
          <div className="faq-badge">
            <span>?</span>
            SUPPORT CENTER
          </div>

          <h1>
            Frequently Asked
            <span>Questions</span>
          </h1>

          <p>
            Answers to common questions about notes, tests, payments and more.
          </p>

          <div className="faq-search">
            <span className="faq-search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search your question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button type="button">Search</button>
          </div>

          <div className="faq-category-tabs">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={
                  activeCategory === category.id
                    ? "faq-tab active"
                    : "faq-tab"
                }
                onClick={() => setActiveCategory(category.id)}
              >
                {category.id !== "all" && (
                  <span>{category.icon}</span>
                )}

                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* HERO ART */}
        <div className="faq-hero-art">
          <div className="faq-art-circle"></div>

          <div className="faq-floating-question faq-q1">
            <span>?</span>
            <strong>
              How to buy
              <br />
              study notes?
            </strong>
          </div>

          <div className="faq-floating-question faq-q2">
            <span>?</span>
            <strong>
              How are
              <br />
              mock tests scored?
            </strong>
          </div>

          <div className="faq-floating-question faq-q3">
            <span>?</span>
            <strong>
              Payment
              <br />
              related issue?
            </strong>
          </div>

          <div className="faq-floating-question faq-q4">
            <span>?</span>
            <strong>
              Account &
              <br />
              Login help?
            </strong>
          </div>

          <div className="faq-student-art">
            <div className="faq-big-question">?</div>

            <div className="faq-student-head">👨‍🎓</div>

            <div className="faq-laptop">
              <div className="faq-laptop-logo">D</div>
            </div>

            <div className="faq-books">
              <i></i>
              <i></i>
              <i></i>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="faq-main-grid">
        {/* LEFT FAQ */}
        <div className="faq-list-card">
          <div className="faq-card-heading">
            <div>
              <span className="faq-title-icon">★</span>
              <h2>Popular Questions</h2>
            </div>

            <button type="button" onClick={expandAll}>
              ⛶ Expand All
            </button>
          </div>

          <div className="faq-items">
            {filteredFaqs.length === 0 ? (
              <div className="faq-empty">
                <strong>No questions found</strong>
                <p>Try another keyword or select another category.</p>
              </div>
            ) : (
              filteredFaqs.map((item, index) => {
                const isOpen = openId === item.id;

                return (
                  <article
                    className={`faq-item ${isOpen ? "open" : ""}`}
                    key={item.id}
                  >
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() =>
                        setOpenId(isOpen ? null : item.id)
                      }
                    >
                      <span className="faq-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <strong>{item.question}</strong>

                      <span className="faq-toggle">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="faq-answer">
                        {item.answer}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT */}
        <aside className="faq-sidebar">
          <div className="faq-help-card">
            <div className="faq-card-heading faq-side-heading">
              <div>
                <span className="faq-grid-icon">▦</span>
                <h2>Quick Help Categories</h2>
              </div>
            </div>

            <div className="faq-help-grid">
              <button
                type="button"
                onClick={() => setActiveCategory("payments")}
              >
                <span className="help-icon blue">💳</span>

                <div>
                  <strong>Purchase & Payment</strong>
                  <small>{getCount("payments")} questions</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("notes")}
              >
                <span className="help-icon red">📖</span>

                <div>
                  <strong>Notes & Study Material</strong>
                  <small>{getCount("notes")} questions</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("mock")}
              >
                <span className="help-icon orange">📋</span>

                <div>
                  <strong>Mock Tests</strong>
                  <small>{getCount("mock")} questions</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("account")}
              >
                <span className="help-icon purple">👤</span>

                <div>
                  <strong>Account & Login</strong>
                  <small>{getCount("account")} questions</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("mock")}
              >
                <span className="help-icon yellow">🏆</span>

                <div>
                  <strong>Results & Leaderboard</strong>
                  <small>{getCount("mock")} questions</small>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("technical")}
              >
                <span className="help-icon green">⚙️</span>

                <div>
                  <strong>Technical Issues</strong>
                  <small>{getCount("technical")} questions</small>
                </div>
              </button>
            </div>
          </div>

          {/* SUPPORT CARD */}
          <div className="faq-support-card">
            <div className="faq-support-icon">🎧</div>

            <div className="faq-support-content">
              <h3>Still Need Help?</h3>

              <p>Our support team is here to assist you.</p>

              <Link to="/contact-us" className="faq-contact-button">
                Contact Us
                <span>→</span>
              </Link>
            </div>

            <div className="faq-support-person">👩‍💻</div>
          </div>
        </aside>
      </section>
    </main>
  );
}