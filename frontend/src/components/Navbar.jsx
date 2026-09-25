import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import logoIcon from "../assets/logo-icon.png";
import logoWordmark from "../assets/logo-wordmark.png";
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
  Languages,
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
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("dishaUser"));
  const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "?";

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
  <img src={logoIcon} alt="Disha" className="logo-icon" />
  <img src={logoWordmark} alt="Disha The Academy" className="logo-wordmark" />
</div>

        {/* NAVIGATION */}
        <div className="nav-links">

          <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <House size={21} strokeWidth={1.8} />
            <span>Home</span>
          </NavLink>

          <NavLink to="/notes" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <BookOpen size={21} strokeWidth={1.8} />
            <span>Notes</span>
          </NavLink>

          <NavLink to="/tests" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <ClipboardList size={21} strokeWidth={1.8} />
            <span>Tests</span>
          </NavLink>

          {user && (
            <NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              <LayoutDashboard size={21} strokeWidth={1.8} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {user && (
            <NavLink to="/my-results" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              <Target size={21} strokeWidth={1.8} />
              <span>My Results</span>
            </NavLink>
          )}

          <NavLink to="/leaderboard" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <Trophy size={21} strokeWidth={1.8} />
            <span>Leaderboard</span>
          </NavLink>

          <NavLink to="/current-affairs" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <Newspaper size={21} strokeWidth={1.8} />
            <span>Current Affairs</span>
          </NavLink>

          <NavLink to="/blog" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <PenLine size={21} strokeWidth={1.8} />
            <span>Blog</span>
          </NavLink>

          <NavLink to="/faq" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <CircleHelp size={21} strokeWidth={1.8} />
            <span>FAQ</span>
          </NavLink>

          <NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <Mail size={21} strokeWidth={1.8} />
            <span>Contact Us</span>
          </NavLink>

          <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            <Info size={21} strokeWidth={1.8} />
            <span>About</span>
          </NavLink>

          {/* Search moved here for mobile drawer only (top bar search is desktop) */}
          <form className="xp-search-form navbar-mobile-search" onSubmit={handleSearch}>
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

        </div>
      </nav>

      {/* TOP HEADER BAR */}
      <div className="topbar-right">

        {/* SEARCH (desktop) */}
        <form className="topbar-search-form" onSubmit={handleSearch}>
          <div className="topbar-search-wrapper">
            <Search size={18} strokeWidth={1.8} />
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search notes, tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="topbar-actions">

          {/* LANGUAGE (icon only for now, functionality coming later) */}
          <div className="topbar-lang-wrapper">
            <button
              className="topbar-icon-btn"
              onClick={() => setShowLangMenu((prev) => !prev)}
              aria-label="Language"
            >
              <Languages size={20} strokeWidth={1.8} />
            </button>

            {showLangMenu && (
              <div className="topbar-lang-dropdown">
                <div className="topbar-lang-item active">English</div>
                <div className="topbar-lang-item disabled">
                  हिंदी <span className="topbar-soon-tag">soon</span>
                </div>
              </div>
            )}
          </div>

          {/* NOTIFICATIONS */}
          {user && (
            <div className="xp-notif-wrapper">
              <button
                className="xp-notif-btn"
                onClick={() => setShowNotif((prev) => !prev)}
                aria-label="Notifications"
              >
                <Bell size={20} strokeWidth={1.8} />
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

          {/* USER */}
          {user ? (
            <>
              <Link
                to="/account"
                className="topbar-avatar"
                title={user.fullName}
                onClick={closeMenu}
              >
                {initial}
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
      </div>
    </>
  );
}

export default Navbar;