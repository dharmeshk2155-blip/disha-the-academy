import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../pages/ExtraPages.css";

const SAMPLE_NOTIFICATIONS = [
  { id: 1, title: "New mock test added", body: "SSC CGL Reasoning Test 02 is now live." },
  { id: 2, title: "Result ready", body: "Your last mock test result has been calculated." },
  { id: 3, title: "Maintenance notice", body: "Site under maintenance — payments temporarily paused." },
];

function Navbar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("dishaUser")
  );

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("dishaUser");
    localStorage.removeItem("dishaToken");
    closeMenu();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      closeMenu();
    }
  };

  return (
    <>
      {/* HAMBURGER TOGGLE - mobile only (hidden on desktop via CSS) */}
      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* DARK OVERLAY - shows behind the drawer on mobile when open */}
      {menuOpen && (
        <div className="navbar-overlay" onClick={closeMenu} />
      )}

      {/* LEFT VERTICAL SIDEBAR - logo + search + nav links */}
      <nav className={`navbar ${menuOpen ? "open" : ""}`}>
        <div className="logo">
          <span>D</span>isha The Academy
        </div>

        <form className="xp-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="xp-search-input"
            placeholder="Search notes, tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="nav-links">
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/notes" onClick={closeMenu}>Notes</Link>
          <Link to="/tests" onClick={closeMenu}>Tests</Link>
          {user && <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>}
          {user && <Link to="/my-results" onClick={closeMenu}>My Results</Link>}
          <Link to="/leaderboard" onClick={closeMenu}>Leaderboard</Link>
          <Link to="/current-affairs" onClick={closeMenu}>Current Affairs</Link>
          <Link to="/blog" onClick={closeMenu}>Blog</Link>
          <Link to="/faq" onClick={closeMenu}>FAQ</Link>
          <Link to="/contact" onClick={closeMenu}>Contact Us</Link>
          <Link to="/about" onClick={closeMenu}>About</Link>
        </div>
      </nav>

      {/* TOP-RIGHT BAR - notifications + user info / login / logout */}
      <div className="topbar-right">
        {user && (
          <div className="xp-notif-wrapper">
            <button
              className="xp-notif-btn"
              onClick={() => setShowNotif((prev) => !prev)}
            >
              🔔
              <span className="xp-notif-dot" />
            </button>
            {showNotif && (
              <div className="xp-notif-dropdown">
                {SAMPLE_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="xp-notif-item">
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user ? (
          <>
            <Link to="/account" className="welcome-user" onClick={closeMenu}>
              Hi, {user.fullName}
            </Link>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn" onClick={closeMenu}>
            Login
          </Link>
        )}
      </div>
    </>
  );
}

export default Navbar;