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

  const user = JSON.parse(
    localStorage.getItem("dishaUser")
  );

  const handleLogout = () => {
    localStorage.removeItem("dishaUser");
    localStorage.removeItem("dishaToken");
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* LEFT VERTICAL SIDEBAR - logo + search + nav links */}
      <nav className="navbar">
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
          <Link to="/">Home</Link>
          <Link to="/notes">Notes</Link>
          <Link to="/tests">Tests</Link>
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user && <Link to="/my-results">My Results</Link>}
          <Link to="/leaderboard">Leaderboard</Link>
          <Link to="/current-affairs">Current Affairs</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/about">About</Link>
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
            <Link to="/account" className="welcome-user">
              Hi, {user.fullName}
            </Link>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}
      </div>
    </>
  );
}

export default Navbar;