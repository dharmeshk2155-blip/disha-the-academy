import { useState } from "react";

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      console.log("LOGIN BUTTON CLICKED", formData);

      const response = await fetch(
        "http://localhost:5000/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      // ==================================================
      // LOGIN SUCCESS
      // ==================================================

      if (response.ok && data.success) {

        // ------------------------------------------
        // SAVE JWT TOKEN
        // ------------------------------------------

        if (data.token) {

          localStorage.setItem(
            "dishaToken",
            data.token
          );

          console.log(
            "JWT TOKEN SAVED"
          );

        } else {

          console.error(
            "JWT token not received from backend"
          );

        }

        // ------------------------------------------
        // SAVE USER INFORMATION
        // ------------------------------------------

        localStorage.setItem(
          "dishaUser",
          JSON.stringify(data.user)
        );
        localStorage.setItem(
  "dishaToken",
  data.token
);

        console.log(
          "USER SAVED:",
          data.user
        );

        // ------------------------------------------
        // SUCCESS MESSAGE
        // ------------------------------------------

        setMessage(
          "Login successful!"
        );

        // ------------------------------------------
        // REDIRECT TO HOME
        // ------------------------------------------

        setTimeout(() => {

          window.location.href = "/";

        }, 800);

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