import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      <div className="logo">
        Disha The Academy
      </div>

      <div className="nav-links">

        <Link to="/">Home</Link>

        <Link to="/notes">Notes</Link>

        <Link to="/tests">Tests</Link>

        <Link to="/about">About</Link>

        <Link to="/login" className="login-btn">
          Login
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;