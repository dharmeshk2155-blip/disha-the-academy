import "./ExtraPages.css";

export default function PrivacyPolicy() {
  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="xp-card">
        <h3>1. Information We Collect</h3>
        <p>
          When you register on Disha The Academy, we collect your name, email
          address, and mobile number. When you purchase notes or mock test
          access, payment is processed securely through Razorpay — we do not
          store your card, UPI, or bank details on our servers.
        </p>
      </div>

      <div className="xp-card">
        <h3>2. How We Use Your Information</h3>
        <p>
          We use your information to create and manage your account, process
          payments, deliver purchased study material, send important updates
          (exam alerts, current affairs, order confirmations), and improve our
          platform.
        </p>
      </div>

      <div className="xp-card">
        <h3>3. Third-Party Services</h3>
        <p>
          We use trusted third-party services to operate our platform,
          including Razorpay for payment processing and Google for optional
          sign-in. These providers have their own privacy policies governing
          the data they process.
        </p>
      </div>

      <div className="xp-card">
        <h3>4. Data Security</h3>
        <p>
          Passwords are stored using industry-standard hashing and are never
          saved in plain text. We take reasonable technical measures to
          protect your data, though no online platform can guarantee absolute
          security.
        </p>
      </div>

      <div className="xp-card">
        <h3>5. Cookies</h3>
        <p>
          We use basic browser storage to keep you logged in and remember
          your preferences (such as your selected test language). We do not
          use cookies for third-party advertising.
        </p>
      </div>

      <div className="xp-card">
        <h3>6. Your Rights</h3>
        <p>
          You can request access to, correction of, or deletion of your
          personal data by contacting us through our Contact Us page.
        </p>
      </div>

      <div className="xp-card">
        <h3>7. Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. Continued use
          of the platform after changes are posted constitutes acceptance of
          the revised policy.
        </p>
      </div>

      <div className="xp-card">
        <h3>8. Contact Us</h3>
        <p>
          For any privacy-related questions, please reach out via our{" "}
          <a href="/contact">Contact Us</a> page.
        </p>
      </div>
    </div>
  );
}