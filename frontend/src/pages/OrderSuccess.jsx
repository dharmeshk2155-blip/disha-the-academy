import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

import "./OrderSuccess.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("orderId");

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [downloading, setDownloading] =
    useState(false);

  const [
    downloadError,
    setDownloadError,
  ] = useState("");

  // =====================================================
  // LOAD NOTE
  // =====================================================

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadNote() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/api/notes/${encodeURIComponent(
            id
          )}`,
          {
            signal:
              controller.signal,
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load purchased note."
          );
        }

        setNote(data);
      } catch (err) {
        if (
          err.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Order success note error:",
          err
        );

        setError(
          err.message ||
            "Unable to load note information."
        );

        setNote(null);
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    loadNote();

    return () => {
      controller.abort();
    };
  }, [id]);

  // =====================================================
  // PDF DOWNLOAD
  // =====================================================

  async function handleDownload() {
    if (
      !orderId ||
      !note?.pdf
    ) {
      return;
    }

    const authToken =
      localStorage.getItem(
        "dishaToken"
      );

    if (!authToken) {
      setDownloadError(
        "Please log in again to download this PDF."
      );

      return;
    }

    try {
      setDownloading(true);
      setDownloadError("");

      const response =
        await fetch(
          `${API_BASE}/api/pdf/download/${encodeURIComponent(
            orderId
          )}`,
          {
            headers: {
              Authorization:
                `Bearer ${authToken}`,
            },
          }
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => ({}));

        throw new Error(
          data.error ||
            "Unable to download this file."
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = blobUrl;

      link.download =
        `${note.title || "note"}.pdf`;

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      window.URL.revokeObjectURL(
        blobUrl
      );
    } catch (err) {
      console.error(
        "PDF download error:",
        err
      );

      setDownloadError(
        err.message ||
          "Download failed. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="success-page">
        <div className="success-center">
          <div className="success-icon success-loading-icon">
            …
          </div>

          <h1>
            Loading Purchase...
          </h1>

          <p>
            Please wait while we
            prepare your study
            material.
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !note) {
    return (
      <main className="success-page">
        <div className="success-center">
          <div className="success-icon success-error-icon">
            !
          </div>

          <h1>
            Order Information
            Unavailable
          </h1>

          <p>
            {error ||
              "We could not find this note."}
          </p>

          <Link
            to="/notes"
            className="success-secondary-btn"
          >
            ← Back to Notes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="success-page">
      <div className="success-decoration success-decoration-one" />
      <div className="success-decoration success-decoration-two" />

      <section className="success-layout">
        {/* SUCCESS */}

        <div className="success-icon">
          ✓
        </div>

        <div className="success-verified">
          ✓ PAYMENT VERIFIED
        </div>

        <h1>
          Payment Successful!
        </h1>

        <p className="success-message">
          Thank you for your
          purchase. Your study
          material is now available.
        </p>

        {/* NOTE */}

        <div className="success-note-row">
          <div className="success-note-info">
            <span className="success-note-label">
              PURCHASED NOTE
            </span>

            <h2>
              {note.title}
            </h2>

            <p>
              {note.categoryTitle}

              {note.subcategoryTitle
                ? ` · ${note.subcategoryTitle}`
                : ""}
            </p>
          </div>

          <strong className="success-price">
            ₹{note.price}
          </strong>
        </div>

        {/* ORDER ID */}

        {orderId && (
          <div className="success-order-id">
            <span>
              Order ID
            </span>

            <strong>
              {orderId}
            </strong>
          </div>
        )}

        {/* ACTIONS */}

        <div className="success-actions">
          {note.hasContent &&
            orderId && (
              <Link
                to={`/read-note/${note.id}?orderId=${encodeURIComponent(
                  orderId
                )}`}
                className="success-primary-btn"
              >
                📖 Read Your Note
              </Link>
            )}

          {note.pdf &&
            orderId && (
              <button
                type="button"
                onClick={
                  handleDownload
                }
                disabled={
                  downloading
                }
                className="success-secondary-btn"
              >
                {downloading
                  ? "Preparing PDF..."
                  : "↓ Download PDF"}
              </button>
            )}

          <Link
            to="/account"
            className="success-secondary-btn"
          >
            My Account
          </Link>

          <Link
            to="/notes"
            className="success-text-btn"
          >
            Continue Shopping →
          </Link>
        </div>

        {downloadError && (
          <p className="success-download-error">
            {downloadError}
          </p>
        )}

        {!orderId && (
          <p className="success-download-error">
            Order ID is missing.
            Please open this purchase
            from your account.
          </p>
        )}

        <div className="success-security">
          <span>
            🔒 Secure Payment
          </span>

          <span>
            ✓ Payment Verified
          </span>

          <span>
            ⚡ Instant Access
          </span>
        </div>
      </section>
    </main>
  );
}