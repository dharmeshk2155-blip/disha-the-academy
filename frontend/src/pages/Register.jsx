import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage("");
  };

  function handleLoginSuccess(data) {
    if (data.token) {
      localStorage.setItem(
        "dishaToken",
        data.token
      );
    }

    localStorage.setItem(
      "dishaUser",
      JSON.stringify(data.user)
    );

    setMessage(
      "Account created successfully!"
    );

    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  }

  /* ==========================
     GOOGLE LOGIN
  ========================== */

  const handleGoogleLogin = () => {
    if (
      !window.google ||
      !window.google.accounts
    ) {
      setMessage(
        "Google login is still loading, please try again in a moment."
      );
      return;
    }

    const client =
      window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "email profile",

        callback: async (response) => {
          if (response.error) {
            setMessage(
              "Google login failed. Please try again."
            );
            return;
          }

          try {
            const res = await fetch(
              `${API_BASE}/api/auth/google`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  accessToken:
                    response.access_token,
                }),
              }
            );

            const data =
              await res.json();

            if (
              res.ok &&
              data.success
            ) {
              handleLoginSuccess(data);
            } else {
              setMessage(
                data.message ||
                  "Google sign up failed."
              );
            }
          } catch (err) {
            console.error(
              "Google sign up error:",
              err
            );

            setMessage(
              "Backend se connection nahi ho raha. Please try again."
            );
          }
        },
      });

    client.requestAccessToken();
  };

  /* ==========================
     VALIDATION
  ========================== */

  function validateForm() {
    const {
      name,
      email,
      mobile,
      password,
      confirmPassword,
    } = formData;

    if (
      !name.trim() ||
      !email.trim() ||
      !mobile.trim() ||
      !password ||
      !confirmPassword
    ) {
      return "All fields are required.";
    }

    if (name.trim().length < 2) {
      return "Please enter a valid full name.";
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    const mobileRegex =
      /^[6-9]\d{9}$/;

    if (
      !mobileRegex.test(
        mobile.trim()
      )
    ) {
      return "Please enter a valid 10-digit mobile number.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    if (
      password !==
      confirmPassword
    ) {
      return "Passwords do not match.";
    }

    return null;
  }

  /* ==========================
     REGISTER
  ========================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setMessage(
        validationError
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `${API_BASE}/api/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              fullName:
                formData.name.trim(),

              email:
                formData.email.trim(),

              mobile:
                formData.mobile.trim(),

              password:
                formData.password,

              confirmPassword:
                formData.confirmPassword,
            }),
          }
        );

      const data =
        await response.json();

      if (response.ok) {
        setMessage(
          "Account created successfully!"
        );

        setFormData({
          name: "",
          email: "",
          mobile: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setMessage(
          data.message ||
            "Registration failed."
        );
      }
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setMessage(
        "Backend se connection nahi ho raha. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page premium-login-page register-premium-page">

      {/* BACKGROUND */}

      <div className="login-orb login-orb-1"></div>
      <div className="login-orb login-orb-2"></div>
      <div className="login-orb login-orb-3"></div>

      <div className="login-particle particle-1">
        ✦
      </div>

      <div className="login-particle particle-2">
        ✦
      </div>

      <div className="login-particle particle-3">
        ✦
      </div>

      {/* CARD */}

      <div className="login-card premium-login-card register-premium-card">

        <div className="login-card-gold-line"></div>

        {/* BRAND */}

        <div className="login-logo login-animate-1">
          <span>D</span>isha The Academy
        </div>

        {/* ICON */}

        <div className="login-welcome-icon login-animate-2">
          <span>🎓</span>
        </div>

        {/* TITLE */}

        <h1 className="login-animate-3">
          Create Account
        </h1>

        <p className="login-subtitle login-animate-4">
          Join Disha The Academy and start learning.
        </p>

        {/* GOOGLE */}

        <div className="google-login-wrapper login-animate-5">

          <button
            type="button"
            className="google-login-btn premium-google-btn"
            onClick={handleGoogleLogin}
          >

            <svg viewBox="0 0 48 48">

              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.8l5.7-5.7C33.5 6.5 29 5 24 5 13 5 4 14 4 25s9 20 20 20c11 0 19.5-8 19.5-19.5 0-1.3-.1-2.7-.4-3.9z"
              />

              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c2.8 0 5.3 1 7.3 2.8l5.7-5.7C33.5 6.5 29 5 24 5c-7.4 0-13.8 4.2-17 10.7z"
              />

              <path
                fill="#4CAF50"
                d="M24 45c5.2 0 9.9-1.7 13.5-4.6l-6.3-5.3C29.2 36.6 26.7 37.5 24 37.5c-5.2 0-9.6-3.5-11.2-8.3l-6.6 5.1C9.9 40.5 16.4 45 24 45z"
              />

              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.3 5.3C40.9 36 44 30.9 44 25c0-1.3-.1-2.7-.4-3.9z"
              />

            </svg>

            <span>
              Continue with Google
            </span>

          </button>

        </div>

        {/* DIVIDER */}

        <div className="auth-divider login-animate-6">
          OR
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="premium-login-form register-premium-form"
        >

          {/* NAME */}

          <div className="input-group login-animate-7">

            <label>
              Full Name
            </label>

            <div className="premium-input-wrapper">

              <span className="login-input-icon">
                ♙
              </span>

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />

            </div>

          </div>

          {/* EMAIL */}

          <div className="input-group login-animate-7">

            <label>
              Email Address
            </label>

            <div className="premium-input-wrapper">

              <span className="login-input-icon">
                @
              </span>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />

            </div>

          </div>

          {/* MOBILE */}

          <div className="input-group login-animate-8">

            <label>
              Mobile Number
            </label>

            <div className="premium-input-wrapper">

              <span className="login-input-icon">
                ☎
              </span>

              <input
                type="tel"
                name="mobile"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
                required
              />

            </div>

          </div>

          {/* PASSWORD ROW */}

          <div className="register-password-grid">

            {/* PASSWORD */}

            <div className="input-group login-animate-9">

              <label>
                Password
              </label>

              <div className="premium-input-wrapper">

                <span className="login-input-icon">
                  ●
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="input-group login-animate-9">

              <label>
                Confirm Password
              </label>

              <div className="premium-input-wrapper">

                <span className="login-input-icon">
                  ●
                </span>

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

          </div>

          {/* BUTTON */}

          <div className="login-animate-10">

            <button
              type="submit"
              className="login-button premium-login-button"
              disabled={loading}
            >

              <span>
                {loading
                  ? "Creating Account..."
                  : "Create Your Account"}
              </span>

              {!loading && (
                <span className="login-arrow">
                  →
                </span>
              )}

            </button>

          </div>

          {/* MESSAGE */}

          {message && (

            <div
              className={
                message ===
                "Account created successfully!"
                  ? "login-status success"
                  : "login-status error"
              }
            >

              {message ===
              "Account created successfully!"
                ? "✓ "
                : ""}

              {message}

            </div>

          )}

        </form>

        {/* LOGIN */}

        <p className="register-text login-animate-11">

          Already have an account?{" "}

          <Link to="/login">
            Login
          </Link>

        </p>

        {/* SECURITY */}

        <div className="login-security login-animate-11">

          🔒 Secure Registration
          &nbsp;•&nbsp;
          Disha The Academy

        </div>

      </div>

    </div>
  );
}

export default Register;