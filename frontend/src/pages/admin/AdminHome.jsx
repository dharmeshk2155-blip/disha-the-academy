import { Link } from "react-router-dom";
import "./AdminLayout.css";

const SECTIONS = [
  { path: "current-affairs", label: "Current Affairs", ready: true },
  { path: "blog", label: "Blog", ready: false },
  { path: "faq", label: "FAQ", ready: false },
  { path: "contact-submissions", label: "Contact Us Messages", ready: false },
  { path: "about", label: "About Page", ready: false },
  { path: "notes", label: "Notes", ready: false },
  { path: "tests", label: "Tests / Mock Tests", ready: false },
];

export default function AdminHome() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Pick a section to manage.</p>
      <div className="admin-home-cards">
        {SECTIONS.map((section) => (
          <Link
            key={section.path}
            to={`/admin/${section.path}`}
            className={`admin-home-card ${!section.ready ? "disabled" : ""}`}
          >
            <strong>{section.label}</strong>
            {!section.ready && <p style={{ fontSize: 12, color: "#9ca3af" }}>Coming soon</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}