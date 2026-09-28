import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

function OrderSuccess() {
  const { id } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const orderId =
    searchParams.get(
      "orderId"
    );

  const [
    note,
    setNote,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const [
    downloadError,
    setDownloadError,
  ] = useState("");

  // =====================================================
  // LOAD NOTE INFORMATION
  // =====================================================

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadNote() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/api/notes/${encodeURIComponent(
              id
            )}`,
            {
              signal:
                controller.signal,
            }
          );

        const data =
          await response
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
          err.name ===
          "AbortError"
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
        setLoading(false);
      }
    }

    loadNote();

    return () => {
      controller.abort();
    };
  }, [id]);

  // =====================================================
  // LEGACY PDF DOWNLOAD
  // Only for old notes that still have PDFs
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

      link.href =
        blobUrl;

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

        <div className="success-card">

          <div className="success-icon">
            ✓
          </div>

          <h1>
            Loading Purchase...
          </h1>

          <p className="success-info">
            Please wait while we
            prepare your study
            material.
          </p>

        </div>

      </main>
    );
  }

  // =====================================================
  // NOTE ERROR
  // =====================================================

  if (
    error ||
    !note
  ) {
    return (
      <main className="success-page">

        <div className="success-card">

          <div className="success-icon">
            !
          </div>

          <h1>
            Order Information
            Unavailable
          </h1>

          <p className="success-info">
            {error ||
              "We could not find this note."}
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

      <span className="success-confetti confetti-1" />
      <span className="success-confetti confetti-2" />
      <span className="success-confetti confetti-3" />
      <span className="success-confetti confetti-4" />
      <span className="success-confetti confetti-5" />
      <span className="success-confetti confetti-6" />
      <span className="success-confetti confetti-7" />
      <span className="success-confetti confetti-8" />

      <div className="success-card">

        {/* SUCCESS ICON */}

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
          Your study material is now
          available.
        </p>

        {/* NOTE INFORMATION */}

        <div className="success-note">

          <h2>
            {note.title}
          </h2>

          <p>
            {note.categoryTitle}

            {note.subcategoryTitle
              ? ` · ${note.subcategoryTitle}`
              : ""}
          </p>

          <strong>
            ₹{note.price}
          </strong>

        </div>

        {orderId && (
          <p className="success-info">
            Order ID:{" "}
            <strong>
              {orderId}
            </strong>
          </p>
        )}

        {/* =================================================
            NEW ARTICLE NOTE
        ================================================= */}

        {note.hasContent &&
          orderId && (

            <>
              <div className="success-ready">
                📖 Your online study
                note is ready
              </div>

              <Link
                to={`/read-note/${note.id}?orderId=${encodeURIComponent(
                  orderId
                )}`}
                className="success-download-button"
                style={{
                  textDecoration:
                    "none",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  gap:
                    "8px",
                }}
              >
                <span>
                  📖
                </span>

                Read Your Note
              </Link>

              <p className="success-info">
                Open the note online.
                You can also print it
                or save it as PDF from
                the reader.
              </p>
            </>

          )}

        {/* =================================================
            LEGACY PDF SUPPORT
        ================================================= */}

        {note.pdf &&
          orderId && (

            <>
              <button
                type="button"
                onClick={
                  handleDownload
                }
                className="success-shopping-button"
                disabled={
                  downloading
                }
                style={{
                  marginTop:
                    "10px",

                  cursor:
                    downloading
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {downloading
                  ? "Preparing PDF..."
                  : "↓ Download Original PDF"}
              </button>

              {downloadError && (
                <p
                  className="success-info"
                  style={{
                    color:
                      "#b42318",
                  }}
                >
                  {downloadError}
                </p>
              )}
            </>

          )}

        {/* NO ORDER ID */}

        {!orderId && (

          <p
            className="success-info"
            style={{
              color:
                "#b42318",
            }}
          >
            Order ID is missing.
            Please open this purchase
            from your account.
          </p>

        )}

        {/* CONTINUE */}

        <div
          style={{
            marginTop:
              "18px",
          }}
        >
          <Link
            to="/notes"
            className="success-shopping-button"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* SECURITY */}

        <p className="success-security">
          🔒 Secure Payment
          &nbsp;•&nbsp;
          ✓ Payment Verified
          &nbsp;•&nbsp;
          ⚡ Instant Access
        </p>

      </div>

    </main>
  );
}

export default OrderSuccess;