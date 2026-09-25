import "./ExtraPages.css";

export default function RefundPolicy() {
  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Refund Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="xp-card">
        <h3>1. Digital Products</h3>
        <p>
          All notes and mock test packages on Disha The Academy are digital
          products delivered instantly upon successful payment. Because the
          content becomes accessible immediately, purchases are generally
          non-refundable once payment is confirmed.
        </p>
      </div>

      <div className="xp-card">
        <h3>2. When a Refund May Apply</h3>
        <p>
          We will issue a refund only in the following cases:
        </p>
        <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>You were charged more than once for the same order (duplicate payment)</li>
          <li>Payment was deducted from your account but the order was not confirmed or the content was not unlocked</li>
          <li>A technical error on our platform prevented you from accessing the notes or mock test you paid for</li>
        </ul>
      </div>

      <div className="xp-card">
        <h3>3. How to Request a Refund</h3>
        <p>
          If you believe you are eligible for a refund under the cases above,
          contact us within <strong>7 days</strong> of the transaction via our{" "}
          <a href="/contact">Contact Us</a> page, along with your registered
          email and the payment/order ID from your Razorpay receipt.
        </p>
      </div>

      <div className="xp-card">
        <h3>4. Refund Timeline</h3>
        <p>
          Approved refunds are processed back to the original payment method
          within 5–7 business days, depending on your bank or payment
          provider.
        </p>
      </div>

      <div className="xp-card">
        <h3>5. Non-Refundable Situations</h3>
        <p>
          Refunds will not be issued for change of mind after successful
          access to notes or mock tests, dissatisfaction with exam results,
          or failure to use purchased material before an exam date.
        </p>
      </div>

      <div className="xp-card">
        <h3>6. Contact Us</h3>
        <p>
          For any refund-related queries, please reach out via our{" "}
          <a href="/contact">Contact Us</a> page.
        </p>
      </div>
    </div>
  );
}