import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./ContactUs.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

function Icon({ children, viewBox = "0 0 24 24", className = "" }) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function MessageIcon() {
  return (
    <Icon>
      <path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-5 4v-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </Icon>
  );
}

function BoltIcon() {
  return (
    <Icon>
      <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />
    </Icon>
  );
}

function HeadphonesIcon() {
  return (
    <Icon>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5ZM20 14h-3v6h2a1 1 0 0 0 1-1v-5Z" />
    </Icon>
  );
}

function ShieldIcon() {
  return (
    <Icon>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

function UsersIcon() {
  return (
    <Icon>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3 19c.5-4 3-6 6-6s5.5 2 6 6M14 14c3-.3 5.5 1.5 6 5" />
    </Icon>
  );
}

function MailIcon() {
  return (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

function PhoneIcon() {
  return (
    <Icon>
      <path d="M7 3 4 5c-1 1-.6 4 1.6 7.1 2.2 3.2 5.1 5.7 8.3 7 3.1 1.3 5.6 1.1 6.4-.1l1.2-3.4-4.7-2.3-2 2c-2.4-1-5-3.7-6-6l2-2L7 3Z" />
    </Icon>
  );
}

function PinIcon() {
  return (
    <Icon>
      <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </Icon>
  );
}

function UserIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20c.8-5 3.5-7 7-7s6.2 2 7 7" />
    </Icon>
  );
}

function ListIcon() {
  return (
    <Icon>
      <path d="M8 6h11M8 12h11M8 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </Icon>
  );
}

function SendIcon() {
  return (
    <Icon>
      <path d="m3 11 18-8-7 18-3-7-8-3Z" />
      <path d="m11 14 10-11" />
    </Icon>
  );
}

function CardIcon() {
  return (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M7 14h4" />
    </Icon>
  );
}

function DocIcon() {
  return (
    <Icon>
      <path d="M6 3h9l4 4v14H6V3Z" />
      <path d="M15 3v5h4M9 12h6M9 16h6" />
    </Icon>
  );
}

function CapIcon() {
  return (
    <Icon>
      <path d="m2 9 10-5 10 5-10 5L2 9Z" />
      <path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6" />
    </Icon>
  );
}

function BuildingIcon() {
  return (
    <Icon>
      <path d="M5 21V4h10v17M15 9h4v12M8 8h2M8 12h2M8 16h2" />
    </Icon>
  );
}

function ChevronIcon() {
  return (
    <Icon>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

function SocialArrow() {
  return (
    <span className="contact-fit-social-arrow">
      <ChevronIcon />
    </span>
  );
}

function ContactHeroArt() {
  return (
    <svg
      className="contact-fit-hero-art"
      viewBox="0 0 430 260"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cfBlue" x1="0" x2="1">
          <stop offset="0%" stopColor="#12396f" />
          <stop offset="100%" stopColor="#0d57b6" />
        </linearGradient>
        <linearGradient id="cfGold" x1="0" x2="1">
          <stop offset="0%" stopColor="#f6a700" />
          <stop offset="100%" stopColor="#ffd15f" />
        </linearGradient>
      </defs>

      <circle cx="330" cy="70" r="62" fill="#dcecff" />
      <circle cx="248" cy="65" r="50" fill="#fff3cf" />

      <path d="M67 32 115 42 81 72Z" fill="#6ea1ef" />
      <path
        d="M84 64c32 29 58 33 86 9 28-23 59-13 79 18"
        fill="none"
        stroke="#4b83d7"
        strokeWidth="2"
        strokeDasharray="8 8"
      />

      <g>
        <path d="M212 204c-31-40-36-74-10-98 26 31 31 64 10 98Z" fill="#2d5d95" />
        <path d="M184 212c-20-38-14-68 8-84 20 32 17 59-8 84Z" fill="#416fa7" />
        <path d="M232 213c-13-34-3-61 23-77 15 31 7 56-23 77Z" fill="#1f4c83" />
      </g>

      <g>
        <path d="M259 129 374 129 409 170 332 225 259 184Z" fill="#0a3472" />
        <path d="m259 129 74 55 76-55v102H259Z" fill="url(#cfGold)" />
        <path d="m259 231 74-57 76 57Z" fill="url(#cfBlue)" />
        <path d="m259 129 74 56-74 45Z" fill="#123f85" />
      </g>

      <g transform="rotate(-5 326 112)">
        <rect x="292" y="42" width="98" height="132" rx="10" fill="#fff" stroke="#dbe5f2" />
        <text x="311" y="85" fill="#071f4b" fontSize="22" fontFamily="cursive">Let's</text>
        <text x="306" y="112" fill="#071f4b" fontSize="22" fontFamily="cursive">Connect</text>
        <path d="M309 126h55" stroke="#f0a000" strokeWidth="4" />
      </g>

      <g>
        <path d="M389 65h36a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8h-10l-12 13v-13h-14a8 8 0 0 1-8-8V73a8 8 0 0 1 8-8Z" fill="#286bc5" />
        <circle cx="397" cy="90" r="3.2" fill="#fff" />
        <circle cx="407" cy="90" r="3.2" fill="#fff" />
        <circle cx="417" cy="90" r="3.2" fill="#fff" />
      </g>

      <g>
        <path d="M385 142h35a7 7 0 0 1 7 7v28a7 7 0 0 1-7 7h-8l-10 11v-11h-17a7 7 0 0 1-7-7v-28a7 7 0 0 1 7-7Z" fill="#58a1e8" />
        <circle cx="393" cy="162" r="3" fill="#fff" />
        <circle cx="403" cy="162" r="3" fill="#fff" />
        <circle cx="413" cy="162" r="3" fill="#fff" />
      </g>

      <path d="M176 220h56l-5 33h-46Z" fill="#fff" stroke="#dbe5f2" strokeWidth="2" />
    </svg>
  );
}

function MiniMap() {
  return (
    <svg
      className="contact-fit-map-svg"
      viewBox="0 0 330 112"
      aria-hidden="true"
    >
      <rect width="330" height="112" rx="12" fill="#eef3ee" />
      <path d="M0 72 120 18l210 38" stroke="#d8d6c9" strokeWidth="15" fill="none" />
      <path d="M15 18 145 112M104 0l84 112M240 0l-58 112" stroke="#c9d7e6" strokeWidth="5" fill="none" />
      <path d="M0 35h330M0 92h330" stroke="#fff" strokeWidth="4" fill="none" />

      <g transform="translate(97 23)">
        <rect width="154" height="59" rx="12" fill="#fff" />
        <path d="M20 16c-7 0-12 5-12 12 0 10 12 22 12 22s12-12 12-22c0-7-5-12-12-12Z" fill="#f34142" />
        <circle cx="20" cy="28" r="4" fill="#fff" />
        <text x="43" y="28" fill="#102d58" fontSize="12" fontWeight="700">Disha The Academy</text>
        <text x="43" y="43" fill="#547095" fontSize="10">Himachal Pradesh</text>
      </g>
    </svg>
  );
}

const quickItems = [
  {
    icon: <BoltIcon />,
    title: "Quick Response",
    text: "Usually within 24 hours",
  },
  {
    icon: <HeadphonesIcon />,
    title: "Dedicated Support",
    text: "For students & learners",
  },
  {
    icon: <ShieldIcon />,
    title: "Reliable Assistance",
    text: "We are always here",
  },
  {
    icon: <UsersIcon />,
    title: "Student Friendly",
    text: "Support team",
  },
];

const faqTopics = [
  ["card", "Payment related queries"],
  ["doc", "Access to purchased notes"],
  ["cap", "Mock test issues"],
  ["user", "Account login problems"],
  ["message", "Suggestion or feedback"],
  ["building", "Partnership or collaboration"],
];

function TopicIcon({ type }) {
  if (type === "card") return <CardIcon />;
  if (type === "doc") return <DocIcon />;
  if (type === "cap") return <CapIcon />;
  if (type === "user") return <UserIcon />;
  if (type === "building") return <BuildingIcon />;
  return <MessageIcon />;
}

export default function ContactUs() {
  const savedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("dishaUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const [form, setForm] = useState({
    name: savedUser?.fullName || "",
    email: savedUser?.email || "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.subject ||
      !form.message.trim()
    ) {
      setStatus("Please fill in all required fields.");
      return;
    }

    try {
      setSending(true);
      setStatus("");

      const response = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject,
          message: form.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to send your message."
        );
      }

      setStatus(
        data.message ||
          "Message sent successfully. We'll get back to you soon."
      );

      setForm((current) => ({
        ...current,
        subject: "",
        message: "",
      }));
    } catch (error) {
      setStatus(
        error.message ||
          "Unable to send your message right now."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="contact-fit-page">
      <section className="contact-fit-hero">
        <div className="contact-fit-hero-copy">
          <div className="contact-fit-badge">
            <MessageIcon />
            <span>GET IN TOUCH</span>
          </div>

          <h1>
            Contact <span>Us</span>
          </h1>

          <p>
            Have a question, suggestion or need support? We’re here to help you.
            <br />
            Send us a message and our team will get back to you soon.
          </p>

          <div className="contact-fit-quick-grid">
            {quickItems.map((item) => (
              <div
                className="contact-fit-quick-item"
                key={item.title}
              >
                <div className="contact-fit-quick-icon">
                  {item.icon}
                </div>

                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="contact-fit-art-wrap">
          <ContactHeroArt />
        </div>
      </section>

      <section className="contact-fit-main-grid">
        <div className="contact-fit-left-column">
          <article className="contact-fit-card contact-fit-info-card">
            <h2>
              <i />
              Contact Information
            </h2>

            <div className="contact-fit-info-row">
              <div className="contact-fit-info-icon">
                <MailIcon />
              </div>

              <div>
                <strong>Email Us</strong>
                <a href="mailto:support@dishatheacademy.com">
                  support@dishatheacademy.com
                </a>
                <span>For support, queries and feedback</span>
              </div>
            </div>

            <div className="contact-fit-info-row">
              <div className="contact-fit-info-icon">
                <PhoneIcon />
              </div>

              <div>
                <strong>Call Us</strong>
                <a href="tel:+919876543210">
                  +91 98765 43210
                </a>
                <span>Mon - Sat, 10:00 AM - 6:00 PM</span>
              </div>
            </div>

            <div className="contact-fit-info-row">
              <div className="contact-fit-info-icon">
                <PinIcon />
              </div>

              <div>
                <strong>Our Location</strong>
                <span className="contact-fit-primary-text">
                  Himachal Pradesh, India
                </span>
                <span>Online platform – accessible everywhere</span>
              </div>
            </div>
          </article>

          <article className="contact-fit-card contact-fit-map-card">
            <h2>
              <i />
              Find Us Here
            </h2>
            <MiniMap />
          </article>
        </div>

        <article className="contact-fit-card contact-fit-form-card">
          <h2>
            <i />
            Send Us a Message
          </h2>

          <form onSubmit={handleSubmit}>
            <label>
              Your Name <b>*</b>
            </label>

            <div className="contact-fit-field">
              <UserIcon />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={updateForm}
                placeholder="Enter your name"
              />
            </div>

            <label>
              Email Address <b>*</b>
            </label>

            <div className="contact-fit-field">
              <MailIcon />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateForm}
                placeholder="Enter your email address"
              />
            </div>

            <label>
              Subject <b>*</b>
            </label>

            <div className="contact-fit-field contact-fit-select-field">
              <ListIcon />

              <select
                name="subject"
                value={form.subject}
                onChange={updateForm}
              >
                <option value="">Select a subject</option>
                <option value="Payment related query">
                  Payment related query
                </option>
                <option value="Purchased notes access">
                  Purchased notes access
                </option>
                <option value="Mock test issue">
                  Mock test issue
                </option>
                <option value="Account support">
                  Account support
                </option>
                <option value="Suggestion or feedback">
                  Suggestion or feedback
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <label>
              Message <b>*</b>
            </label>

            <div className="contact-fit-textarea">
              <MessageIcon />
              <textarea
                name="message"
                value={form.message}
                onChange={updateForm}
                maxLength={500}
                placeholder="How can we help you?"
              />
              <span>{form.message.length}/500</span>
            </div>

            {status && (
              <div className="contact-fit-status">
                {status}
              </div>
            )}

            <button
              type="submit"
              className="contact-fit-send"
              disabled={sending}
            >
              <SendIcon />
              <span>
                {sending ? "Sending..." : "Send Message"}
              </span>
              <strong>→</strong>
            </button>
          </form>
        </article>

        <div className="contact-fit-right-column">
          <article className="contact-fit-card contact-fit-social-card">
            <h2>
              <i />
              Other Ways to Reach Us
            </h2>

            <div className="contact-fit-social-grid">
              <a href="#" className="contact-fit-social-item">
                <div className="contact-fit-social-logo whatsapp">
                  W
                </div>
                <div>
                  <strong>WhatsApp Support</strong>
                  <span>Chat with us</span>
                </div>
                <SocialArrow />
              </a>

              <a href="#" className="contact-fit-social-item">
                <div className="contact-fit-social-logo telegram">
                  ➤
                </div>
                <div>
                  <strong>Telegram</strong>
                  <span>Join our community</span>
                </div>
                <SocialArrow />
              </a>

              <a href="#" className="contact-fit-social-item">
                <div className="contact-fit-social-logo instagram">
                  ◎
                </div>
                <div>
                  <strong>Instagram</strong>
                  <span>Follow for updates</span>
                </div>
                <SocialArrow />
              </a>

              <a href="#" className="contact-fit-social-item">
                <div className="contact-fit-social-logo youtube">
                  ▶
                </div>
                <div>
                  <strong>YouTube</strong>
                  <span>Subscribe for tips</span>
                </div>
                <SocialArrow />
              </a>
            </div>
          </article>

          <article className="contact-fit-card contact-fit-topics-card">
            <h2>
              <i />
              Frequently Asked Topics
            </h2>

            <div className="contact-fit-topic-list">
              {faqTopics.map(([type, label]) => (
                <Link
                  key={label}
                  to="/faq"
                  className="contact-fit-topic-row"
                >
                  <span className="contact-fit-topic-icon">
                    <TopicIcon type={type} />
                  </span>

                  <span>{label}</span>

                  <ChevronIcon />
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
