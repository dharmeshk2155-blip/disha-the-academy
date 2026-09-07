import { useState } from "react";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    // Password check
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Account created successfully!");

        setFormData({
          name: "",
          email: "",
          mobile: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);

      setMessage(
        "Backend se connection nahi ho raha. Check karo backend running hai ya nahi."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <span>D</span>isha The Academy
        </div>

        <h1>Create Account</h1>

        <p className="login-subtitle">
          Join Disha The Academy and start learning.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              placeholder="Enter your mobile number"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
          >
            Create Account
          </button>

          {message && (
            <p style={{ marginTop: "15px" }}>
              {message}
            </p>
          )}

        </form>

        <p className="register-text">
          Already have an account?{" "}
          <a href="/login">Login</a>
        </p>

      </div>
    </div>
  );
}

export default Register;