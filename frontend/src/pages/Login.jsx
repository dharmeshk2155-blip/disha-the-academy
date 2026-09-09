import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  // Handles the actual redirect to home + saving token/user after any
  // successful login (normal or Google)
  function handleLoginSuccess(data) {
    if (data.token) {
      localStorage.setItem("dishaToken", data.token);
    }
    localStorage.setItem("dishaUser", JSON.stringify(data.user));
    setMessage("Login successful!");
    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  }

  const handleGoogleLogin = () => {
    if (!window.google || !window.google.accounts) {
      setMessage("Google login is still loading, please try again in a moment.");
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile",
      callback: async (response) => {
        if (response.error) {
          setMessage("Google login failed. Please try again.");
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: response.access_token }),
          });
          const data = await res.json();

          if (res.ok && data.success) {
            handleLoginSuccess(data);
          } else {
            setMessage(data.message || "Google login failed.");
          }
        } catch (err) {
          setMessage("Backend se connection nahi ho raha. Check karo backend running hai ya nahi.");
        }
      },
    });

    client.requestAccessToken();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        handleLoginSuccess(data);
      } else {
        setMessage(
          data.message ||
            "Invalid email or password."
        );
      }

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      setMessage(
        "Backend se connection nahi ho raha. Check karo backend running hai ya nahi."
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* LOGO */}

        <div className="login-logo">

          <span>D</span>
          isha The Academy

        </div>

        {/* TITLE */}

        <h1>
          Welcome Back!
        </h1>

        <p className="login-subtitle">
          Login to continue your learning journey.
        </p>

        {/* GOOGLE SIGN IN */}
        <div className="google-login-wrapper">
          <button type="button" className="google-login-btn" onClick={handleGoogleLogin}>
            <svg viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.8l5.7-5.7C33.5 6.5 29 5 24 5 13 5 4 14 4 25s9 20 20 20c11 0 19.5-8 19.5-19.5 0-1.3-.1-2.7-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c2.8 0 5.3 1 7.3 2.8l5.7-5.7C33.5 6.5 29 5 24 5c-7.4 0-13.8 4.2-17 10.7z"/>
              <path fill="#4CAF50" d="M24 45c5.2 0 9.9-1.7 13.5-4.6l-6.3-5.3C29.2 36.6 26.7 37.5 24 37.5c-5.2 0-9.6-3.5-11.2-8.3l-6.6 5.1C9.9 40.5 16.4 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.3 5.3C40.9 36 44 30.9 44 25c0-1.3-.1-2.7-.4-3.9z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="auth-divider">OR</div>

        {/* LOGIN FORM */}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}

          <div className="input-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

          </div>

          {/* PASSWORD */}

          <div className="input-group">

            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />

          </div>

          {/* OPTIONS */}

          <div className="login-options">

            <label className="remember">

              <input
                type="checkbox"
              />

              Remember me

            </label>

            <a href="#">
              Forgot Password?
            </a>

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

          {/* MESSAGE */}

          {message && (

            <p
              style={{
                marginTop: "15px",
                textAlign: "center",
              }}
            >
              {message}
            </p>

          )}

        </form>

        {/* REGISTER */}

        <p className="register-text">

          Don't have an account?{" "}

          <a href="/register">
            Create Account
          </a>

        </p>

      </div>

    </div>
  );
}

export default Login;