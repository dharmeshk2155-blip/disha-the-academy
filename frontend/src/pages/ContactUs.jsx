import { useState } from "react";
import "./ExtraPages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data.message);
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus(data.message || "Something went wrong.");
      }
    } catch (err) {
      setStatus("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Contact Us</h1>
        <p>Have a question or facing an issue? Send us a message.</p>
      </div>

      <div className="xp-form-card">
        <form onSubmit={handleSubmit}>
          <div className="xp-form-group">
            <label>Your Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="xp-form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="xp-form-group">
            <label>Message</label>
            <textarea
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              placeholder="How can we help you?"
              required
            />
          </div>
          <button type="submit" className="xp-submit-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>
          {status && <p style={{ marginTop: 14, color: "#0b1f4d" }}>{status}</p>}
        </form>
      </div>
    </div>
  );
}