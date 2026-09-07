import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("dishaUser")
  );

  const handleLogout = () => {
    localStorage.removeItem("dishaUser");
    navigate("/login");
  };

  return (
    <>
      {/* LEFT VERTICAL SIDEBAR - logo + nav links */}
      <nav className="navbar">
        <div className="logo">
          <span>D</span>isha The Academy
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/notes">Notes</Link>
          <Link to="/tests">Tests</Link>
          <Link to="/about">About</Link>
        </div>
      </nav>

      {/* TOP-RIGHT BAR - user info / login / logout, stays where it was before */}
      <div className="topbar-right">
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