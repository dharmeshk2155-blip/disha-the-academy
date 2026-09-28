import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import DOMPurify from "dompurify";

import "./ReadNote.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

export default function ReadNote() {
  const { id } = useParams();

  const navigate =
    useNavigate();

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
    order,
    setOrder,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // =====================================================
  // LOAD PURCHASED NOTE
  // =====================================================

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadPurchasedNote() {
      try {
        setLoading(true);
        setError("");

        // -----------------------------------------------
        // ORDER ID REQUIRED
        // -----------------------------------------------

        if (!orderId) {
          throw new Error(
            "Order information is missing."
          );
        }

        // -----------------------------------------------
        // LOGIN TOKEN
        // -----------------------------------------------

        const token =
          localStorage.getItem(
            "dishaToken"
          );

        if (!token) {
          navigate(
            `/login`,
            {
              replace: true,
            }
          );

          return;
        }

        // -----------------------------------------------
        // SECURE BACKEND REQUEST
        // -----------------------------------------------

        const response =
          await fetch(
            `${API_BASE}/api/orders/${encodeURIComponent(
              orderId
            )}/note-content`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              signal:
                controller.signal,
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        // -----------------------------------------------
        // SESSION EXPIRED
        // -----------------------------------------------

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "dishaToken"
          );

          throw new Error(
            data.error ||
              "Your login session has expired. Please log in again."
          );
        }

        // -----------------------------------------------
        // ACCESS DENIED
        // -----------------------------------------------

        if (
          response.status === 403
        ) {
          throw new Error(
            data.error ||
              "You do not have access to this note."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load purchased note."
          );
        }

        if (
          !data.success ||
          !data.note
        ) {
          throw new Error(
            "Purchased note could not be loaded."
          );
        }

        // -----------------------------------------------
        // EXTRA NOTE ID CHECK
        // -----------------------------------------------

        if (
          Number(data.note.id) !==
          Number(id)
        ) {
          throw new Error(
            "This order does not belong to the requested note."
          );
        }

        setNote(
          data.note
        );

        setOrder(
          data.order || null
        );
      } catch (err) {
        if (
          err.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Purchased note loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load note."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPurchasedNote();

    return () => {
      controller.abort();
    };
  }, [
    id,
    orderId,
    navigate,
  ]);

  // =====================================================
  // SANITIZE HTML
  // =====================================================

  const safeContent =
    useMemo(() => {
      if (!note?.content) {
        return "";
      }

      return DOMPurify.sanitize(
        note.content
      );
    }, [note]);

  // =====================================================
  // PRINT / SAVE AS PDF
  // =====================================================

  function handlePrint() {
    window.print();
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="read-note-page">

        <div className="read-note-status-card">

          <div className="read-note-status-icon">
            📖
          </div>

          <h1>
            Opening Your Note
          </h1>

          <p>
            Verifying your purchase
            and loading study
            material...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (
    error ||
    !note
  ) {
    return (
      <div className="read-note-page">

        <div className="read-note-status-card">

          <div className="read-note-status-icon">
            🔒
          </div>

          <h1>
            Unable to Open Note
          </h1>

          <p>
            {error ||
              "This note is not available."}
          </p>

          <div className="read-note-status-actions">

            <Link
              to="/account"
              className="read-note-primary-button"
            >
              My Account
            </Link>

            <Link
              to="/notes"
              className="read-note-secondary-button"
            >
              Browse Notes
            </Link>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // READER
  // =====================================================

  return (
    <div className="read-note-page">

      {/* TOP BAR */}

      <div className="read-note-topbar">

        <div className="read-note-topbar-inner">

          <div className="read-note-topbar-left">

            <Link
              to="/account"
              className="read-note-back"
            >
              ← My Notes
            </Link>

            <div>
              <span className="read-note-label">
                PURCHASED STUDY NOTE
              </span>

              <h1>
                {note.title}
              </h1>
            </div>

          </div>

          <div className="read-note-actions">

            <button
              type="button"
              onClick={
                handlePrint
              }
              className="read-note-print-button"
            >
              🖨 Print / Save PDF
            </button>

          </div>

        </div>

      </div>

      {/* DOCUMENT */}

      <main className="read-note-main">

        <article className="read-note-paper">

          <header className="read-note-cover">

            <div className="read-note-book-icon">
              📘
            </div>

            <span>
              Disha The Academy
            </span>

            <h1>
              {note.title}
            </h1>

            <p>
              {note.categoryTitle}

              {note.subcategoryTitle
                ? ` · ${note.subcategoryTitle}`
                : ""}
            </p>

          </header>

          <div
            className="read-note-content"
            dangerouslySetInnerHTML={{
              __html:
                safeContent,
            }}
          />

          <footer className="read-note-document-footer">

            <strong>
              Disha The Academy
            </strong>

            <span>
              Study material for
              personal use
            </span>

            {order?.orderId && (
              <small>
                Order:{" "}
                {order.orderId}
              </small>
            )}

          </footer>

        </article>

      </main>

    </div>
  );
}