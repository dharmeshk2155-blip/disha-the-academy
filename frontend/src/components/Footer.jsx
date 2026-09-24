```jsx
import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-column footer-brand">
          <h2>Disha The Academy</h2>
          <p>
            Quality study notes, exam preparation material and current affairs
            to help you prepare smarter and achieve your goals.
          </p>

          <div className="footer-social">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">◎</a>
            <a href="#" aria-label="YouTube">▶</a>
            <a href="#" aria-label="Telegram">✈</a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>
          <a href="/">Home</a>
          <a href="/notes">Study Notes</a>
          <a href="/exams">Popular Exams</a>
          <a href="/current-affairs">Current Affairs</a>
        </div>

        {/* Exams */}
        <div className="footer-column">
          <h3>Popular Exams</h3>
          <a href="/exams/hp-police">HP Police</a>
          <a href="/exams/ssc">SSC Exams</a>
          <a href="/exams/banking">Banking Exams</a>
          <a href="/exams/railways">Railway Exams</a>
        </div>

        {/* Important Links */}
        <div className="footer-column">
          <h3>Important</h3>
          <a href="/about">About Us</a>
          <a href="/contact">Contact Us</a>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms">Terms & Conditions</a>
          <a href="/refund-policy">Refund Policy</a>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} <strong>Disha The Academy</strong>.
          All Rights Reserved.
        </p>

        <p className="footer-made">
          Learn • Prepare • Succeed
        </p>
      </div>
    </footer>
  );
};

export default Footer;
```
