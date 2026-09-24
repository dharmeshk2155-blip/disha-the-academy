import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  House,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Target,
  Trophy,
  Newspaper,
  PenLine,
  CircleHelp,
  Mail,
  Info,
  Bell,
  X,
  Menu,
  Search,
} from "lucide-react";

import "../pages/ExtraPages.css";

const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    title: "New mock test added",
    body: "SSC CGL Reasoning Test 02 is now live.",
  },
  {
    id: 2,
    title: "Result ready",
    body: "Your last mock test result has been calculated.",
  },
  {
    id: 3,
    title: "Maintenance notice",
    body: "Site under maintenance — payments temporarily paused.",
  },
];

function Navbar() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("dishaUser"));

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
      {/* MOBILE MENU BUTTON */}
      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* MOBILE OVERLAY */}
      {menuOpen && (
        <div className="navbar-overlay" onClick={closeMenu} />
      )}

      {/* LEFT SIDEBAR */}
      <nav className={`navbar ${menuOpen ? "open" : ""}`}>

        {/* LOGO */}
        <div className="logo">
          <span>D</span>isha The Academy
        </div>

        {/* SEARCH */}
        <form className="xp-search-form" onSubmit={handleSearch}>
          <div className="navbar-search-wrapper">
            <Search size={19} strokeWidth={1.8} />

            <input
              type="text"
              className="xp-search-input"
              placeholder="Search notes, tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* NAVIGATION */}
        <div className="nav-links">

          <Link to="/" onClick={closeMenu}>
            <House size={21} strokeWidth={1.8} />
            <span>Home</span>
          </Link>

          <Link to="/notes" onClick={closeMenu}>
            <BookOpen size={21} strokeWidth={1.8} />
            <span>Notes</span>
          </Link>

          <Link to="/tests" onClick={closeMenu}>
            <ClipboardList size={21} strokeWidth={1.8} />
            <span>Tests</span>
          </Link>

          {user && (
            <Link to="/dashboard" onClick={closeMenu}>
              <LayoutDashboard size={21} strokeWidth={1.8} />
              <span>Dashboard</span>
            </Link>
          )}

          {user && (
            <Link to="/my-results" onClick={closeMenu}>
              <Target size={21} strokeWidth={1.8} />
              <span>My Results</span>
            </Link>
          )}

          <Link to="/leaderboard" onClick={closeMenu}>
            <Trophy size={21} strokeWidth={1.8} />
            <span>Leaderboard</span>
          </Link>

          <Link to="/current-affairs" onClick={closeMenu}>
            <Newspaper size={21} strokeWidth={1.8} />
            <span>Current Affairs</span>
          </Link>

          <Link to="/blog" onClick={closeMenu}>
            <PenLine size={21} strokeWidth={1.8} />
            <span>Blog</span>
          </Link>

          <Link to="/faq" onClick={closeMenu}>
            <CircleHelp size={21} strokeWidth={1.8} />
            <span>FAQ</span>
          </Link>

          <Link to="/contact" onClick={closeMenu}>
            <Mail size={21} strokeWidth={1.8} />
            <span>Contact Us</span>
          </Link>

          <Link to="/about" onClick={closeMenu}>
            <Info size={21} strokeWidth={1.8} />
            <span>About</span>
          </Link>

        </div>
      </nav>

      {/* TOP RIGHT BAR */}
      <div className="topbar-right">

        {/* NOTIFICATIONS */}
        {user && (
          <div className="xp-notif-wrapper">

            <button
              className="xp-notif-btn"
              onClick={() => setShowNotif((prev) => !prev)}
              aria-label="Notifications"
            >
              <Bell size={22} strokeWidth={1.8} />
              <span className="xp-notif-dot" />
            </button>

            {showNotif && (
              <div className="xp-notif-dropdown">

                {SAMPLE_NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className="xp-notif-item"
                  >
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                  </div>
                ))}

              </div>
            )}

          </div>
        )}

        {/* USER */}
        {user ? (
          <>
            <Link
              to="/account"
              className="welcome-user"
              onClick={closeMenu}
            >
              Hi, {user.fullName}
            </Link>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="login-btn"
            onClick={closeMenu}
          >
            Login
          </Link>
        )}

      </div>
    </>
  );
}

export default Navbar;