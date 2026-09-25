import "./ExtraPages.css";

export default function TermsConditions() {
  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Terms &amp; Conditions</h1>
        <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="xp-card">
        <h3>1. Acceptance of Terms</h3>
        <p>
          By registering on or using Disha The Academy, you agree to these
          Terms &amp; Conditions. If you do not agree, please do not use the
          platform.
        </p>
      </div>

      <div className="xp-card">
        <h3>2. Account Responsibility</h3>
        <p>
          You are responsible for maintaining the confidentiality of your
          login credentials and for all activity under your account. Notify
          us immediately if you suspect unauthorised access.
        </p>
      </div>

      <div className="xp-card">
        <h3>3. Use of Study Material</h3>
        <p>
          All PDF notes, mock tests, and other content are for your personal
          use only. You may not copy, redistribute, resell, or publicly share
          purchased material in any form, physical or digital.
        </p>
      </div>

      <div className="xp-card">
        <h3>4. Payments</h3>
        <p>
          All payments are processed securely via Razorpay. Prices for notes
          and mock test packages are as displayed on the platform at the time
          of purchase and may change without prior notice for future
          purchases.
        </p>
      </div>

      <div className="xp-card">
        <h3>5. Mock Tests &amp; Results</h3>
        <p>
          Mock tests are designed for practice purposes and are based on
          publicly available exam patterns. We do not guarantee that mock
          test scores will directly predict actual exam results.
        </p>
      </div>

      <div className="xp-card">
        <h3>6. Limitation of Liability</h3>
        <p>
          Disha The Academy provides study material and mock tests on an
          "as-is" basis. We are not liable for any indirect or consequential
          loss arising from use of the platform, including exam outcomes.
        </p>
      </div>

      <div className="xp-card">
        <h3>7. Account Termination</h3>
        <p>
          We reserve the right to suspend or terminate accounts that violate
          these terms, including unauthorised sharing of purchased content.
        </p>
      </div>

      <div className="xp-card">
        <h3>8. Governing Law</h3>
        <p>
          These terms are governed by the laws of India, and any disputes
          will be subject to the jurisdiction of the courts of Himachal
          Pradesh.
        </p>
      </div>

      <div className="xp-card">
        <h3>9. Changes to These Terms</h3>
        <p>
          We may revise these Terms &amp; Conditions from time to time.
          Continued use of the platform after changes are posted constitutes
          acceptance of the updated terms.
        </p>
      </div>

      <div className="xp-card">
        <h3>10. Contact Us</h3>
        <p>
          For questions about these terms, please reach out via our{" "}
          <a href="/contact">Contact Us</a> page.
        </p>
      </div>
    </div>
  );
}