import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
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

export default function AdminLayout() {
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem("adminKey") || ""
  );
  const [unlocked, setUnlocked] = useState(!!sessionStorage.getItem("adminKey"));
  const [keyInput, setKeyInput] = useState("");

  function handleUnlock(e) {
    e.preventDefault();
    sessionStorage.setItem("adminKey", keyInput);
    setAdminKey(keyInput);
    setUnlocked(true);
  }

  function handleLogout() {
    sessionStorage.removeItem("adminKey");
    setUnlocked(false);
    setKeyInput("");
  }

  if (!unlocked) {
    return (
      <div className="admin-lock-page">
        <form className="admin-lock-card" onSubmit={handleUnlock}>
          <h2>Admin Dashboard</h2>
          <p>Enter the admin key to continue.</p>
          <input
            type="password"
            placeholder="Admin key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            required
          />
          <button type="submit">Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2>Admin</h2>
        <nav>
          {SECTIONS.map((section) => (
            <NavLink
              key={section.path}
              to={`/admin/${section.path}`}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""} ${
                  !section.ready ? "disabled" : ""
                }`
              }
              onClick={(e) => {
                if (!section.ready) e.preventDefault();
              }}
            >
              {section.label}
              {!section.ready && <span className="admin-soon-tag">soon</span>}
            </NavLink>
          ))}
        </nav>
        <button className="admin-logout-btn" onClick={handleLogout}>
          Lock Dashboard
        </button>
      </aside>

      <main className="admin-main">
        <Outlet context={{ adminKey }} />
      </main>
    </div>
  );
}