import { useState } from "react";
import { useParams, Link } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const notes = {
  1: {
    title: "HP General Knowledge",
    subject: "Himachal Pradesh GK",
    price: 49,
  },

  2: {
    title: "HP Police Constable",
    subject: "Complete Exam Preparation",
    price: 99,
  },

  3: {
    title: "Mathematics Notes",
    subject: "Quantitative Aptitude",
    price: 49,
  },

  4: {
    title: "Reasoning Notes",
    subject: "Verbal & Non-Verbal Reasoning",
    price: 49,
  },

  5: {
    title: "General Science",
    subject: "Physics, Chemistry & Biology",
    price: 59,
  },

  6: {
    title: "English Notes",
    subject: "Grammar & Vocabulary",
    price: 49,
  },

  7: {
    title: "Indian Polity",
    subject: "Constitution & Government",
    price: 59,
  },

  8: {
    title: "Current Affairs",
    subject: "Important Current Affairs",
    price: 39,
  },

  9: {
    title: "General Hindi",
    subject: "Hindi Grammar & Vocabulary",
    price: 49,
  },
};

function OrderSuccess() {
  const { id } = useParams();

  const note = notes[id];

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");

  // Login token — sent as an Authorization header (never placed in the
  // URL) so a copied/forwarded link can't be reused by anyone else to
  // download the same file.
  const authToken = localStorage.getItem("dishaToken");

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownload = async () => {
    if (!orderId) return;

    setDownloading(true);
    setDownloadError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/pdf/download/${encodeURIComponent(orderId)}`,
        {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to download this file.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${note?.title || "note"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setDownloadError(error.message || "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!note) {
    return (
      <main className="success-page">
        <div className="success-card">

          <div className="success-icon">
            !
          </div>

          <h1>Order Not Found</h1>

          <p className="success-info">
            We could not find this note.
          </p>

          <Link
            to="/notes"
            className="success-shopping-button"
          >
            ← Back to Notes
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="success-page">

      {/* CONFETTI */}

      <span className="success-confetti confetti-1"></span>
      <span className="success-confetti confetti-2"></span>
      <span className="success-confetti confetti-3"></span>
      <span className="success-confetti confetti-4"></span>
      <span className="success-confetti confetti-5"></span>
      <span className="success-confetti confetti-6"></span>
      <span className="success-confetti confetti-7"></span>
      <span className="success-confetti confetti-8"></span>

      {/* SUCCESS CARD */}

      <div className="success-card">

        <div className="success-icon">
          ✓
        </div>

        <div className="success-verified">
          ✓ Payment Verified
        </div>

        <h1>
          Payment Successful!
        </h1>

        <p className="success-message">
          Thank you for your purchase.
          Your study material is ready.
        </p>

        {/* PURCHASE INFORMATION */}

        <div className="success-note">

          <h2>
            {note.title}
          </h2>

          <p>
            {note.subject}
          </p>

          <strong>
            ₹{note.price}
          </strong>

        </div>

        <p className="success-info">
          Your payment has been successfully verified.
          You now have instant access to your purchased PDF.
        </p>

        {/* READY MESSAGE */}

        <div className="success-ready">
          🎉 Your PDF is ready to download
        </div>

        {/* DOWNLOAD */}

        {orderId ? (
          <>
            <button
              type="button"
              onClick={handleDownload}
              className="success-download-button"
              disabled={downloading}
            >
              <span>↓</span>
              {downloading ? "Preparing..." : "Download Your PDF"}
            </button>
            {downloadError && (
              <p className="success-info" style={{ color: "red" }}>
                {downloadError}
              </p>
            )}
          </>
        ) : (
          <p className="success-info">
            Download link is not available.
          </p>
        )}

        {/* CONTINUE SHOPPING */}

        <div>
          <Link
            to="/notes"
            className="success-shopping-button"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* SECURITY MESSAGE */}

        <p className="success-security">
          🔒 Secure Payment &nbsp;•&nbsp;
          ✓ Payment Verified &nbsp;•&nbsp;
          ⚡ Instant Access
        </p>

      </div>

    </main>
  );
}

export default OrderSuccess;