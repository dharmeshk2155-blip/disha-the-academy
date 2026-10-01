import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ClipboardList,
  Newspaper,
  PenLine,
  X,
} from "lucide-react";

import "./NotificationBell.css";

// ======================================================
// NOTIFICATION BELL (top bar)
//
// - Shows what is new on the site (mock tests, current affairs,
//   blog posts, study notes) from GET /api/notifications.
// - The red badge counts items the user has not seen yet. Opening
//   the bell marks them as seen (on the server, so it is the same
//   on every device).
// - Right after login a small popup appears under the bell for a
//   few seconds and then hides by itself.
// - Checks for new items every few minutes while the tab is open.
// ======================================================

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

const POLL_MS = 3 * 60 * 1000; // look for new items every 3 minutes
const MIN_REFETCH_MS = 60 * 1000; // when the tab becomes visible again
const TOAST_MS = 4000; // how long the popup stays

// Login.jsx / Register.jsx set this sessionStorage flag right before
// redirecting to the home page.
const LOGIN_FLAG = "dishaJustLoggedIn";

const TYPE_STYLE = {
  test: { Icon: ClipboardList, color: "#1d6fdc", bg: "#e6f0fd" },
  "current-affair": { Icon: Newspaper, color: "#16805f", bg: "#e3f6ef" },
  blog: { Icon: PenLine, color: "#6d28d9", bg: "#efe8ff" },
  notes: { Icon: BookOpen, color: "#b4530a", bg: "#fff0e1" },
};

const FALLBACK_STYLE = { Icon: Bell, color: "#0b1f4d", bg: "#e8edf7" };

function timeAgo(iso) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);

  if (Number.isNaN(seconds)) return "";
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function makeToast(items, count) {
  const fresh = items.filter((item) => item.isNew);
  const latest = fresh[0] || items[0];

  if (!latest) return null;

  if (count === 1) {
    return { title: latest.title, body: latest.body };
  }

  return {
    title: `${count} new updates for you`,
    body: `Latest: ${latest.body}`,
  };
}

function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastPaused, setToastPaused] = useState(false);

  const wrapRef = useRef(null);
  const openRef = useRef(false);
  const previousUnread = useRef(null); // null until the first load finishes
  const announceLogin = useRef(null); // true if the user just logged in
  const lastFetch = useRef(0);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* ---------------- load from the server ---------------- */

  const load = useCallback(async () => {
    const token = localStorage.getItem("dishaToken");

    if (!token) {
      setStatus("error");
      return;
    }

    lastFetch.current = Date.now();

    try {
      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const list = Array.isArray(data.items) ? data.items : [];
      const count = Number(data.unreadCount) || 0;

      setItems(list);
      setUnread(count);
      setStatus("ok");

      // Popup: right after login, or when something new arrives later
      const before = previousUnread.current;
      const firstLoad = before === null;

      const shouldPop = firstLoad
        ? announceLogin.current && count > 0
        : count > before && !openRef.current;

      if (shouldPop) {
        setToast(makeToast(list, count));
        setToastPaused(false);
      }

      previousUnread.current = count;
    } catch {
      // keep whatever we already had; only show an error if we have nothing
      setStatus((current) => (current === "ok" ? "ok" : "error"));
    }
  }, []);

  useEffect(() => {
    // read the "just logged in" flag once (a ref survives StrictMode re-runs)
    if (announceLogin.current === null) {
      try {
        announceLogin.current = sessionStorage.getItem(LOGIN_FLAG) === "1";
        sessionStorage.removeItem(LOGIN_FLAG);
      } catch {
        announceLogin.current = false;
      }
    }

    load();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);

    function onVisible() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastFetch.current > MIN_REFETCH_MS
      ) {
        load();
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  /* ---------------- popup hides itself ---------------- */

  useEffect(() => {
    if (!toast || toastPaused) return undefined;

    const timer = setTimeout(() => setToast(null), TOAST_MS);

    return () => clearTimeout(timer);
  }, [toast, toastPaused]);

  /* ---------------- open / close the list ---------------- */

  const closePanel = useCallback(() => {
    setOpen(false);
    // the "new" highlight is only for the moment the list is opened
    setItems((list) => list.map((item) => ({ ...item, isNew: false })));
  }, []);

  function openPanel() {
    setOpen(true);
    setToast(null);

    if (unread > 0) {
      const token = localStorage.getItem("dishaToken");

      // tell the server the newest item the user is looking at
      fetch(`${API_BASE}/api/notifications/seen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upTo: items[0]?.createdAt }),
      }).catch(() => {});

      setUnread(0);
      previousUnread.current = 0;
    }
  }

  function togglePanel() {
    if (open) {
      closePanel();
    } else {
      openPanel();
    }
  }

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        closePanel();
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") closePanel();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closePanel]);

  /* ---------------- render ---------------- */

  return (
    <div className="xp-notif-wrapper nb" ref={wrapRef}>
      <button
        type="button"
        className="xp-notif-btn nb-btn"
        onClick={togglePanel}
        aria-label={
          unread > 0 ? `Notifications, ${unread} new` : "Notifications"
        }
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={20} strokeWidth={1.8} />

        {unread > 0 && (
          <span className="nb-badge" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <div className="nb-live" aria-live="polite">
        {toast && !open && (
          <div
            className="nb-toast"
            onMouseEnter={() => setToastPaused(true)}
            onMouseLeave={() => setToastPaused(false)}
            onFocus={() => setToastPaused(true)}
            onBlur={() => setToastPaused(false)}
          >
            <button type="button" className="nb-toast-main" onClick={openPanel}>
              <span className="nb-toast-icon" aria-hidden="true">
                <Bell size={16} />
              </span>

              <span className="nb-toast-text">
                <strong>{toast.title}</strong>
                <small>{toast.body}</small>
              </span>
            </button>

            <button
              type="button"
              className="nb-toast-close"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="nb-panel" role="region" aria-label="Notifications">
          <div className="nb-panel-head">Notifications</div>

          {status === "loading" && (
            <p className="nb-empty">Loading updates…</p>
          )}

          {status === "error" && (
            <p className="nb-empty">
              Could not load notifications right now. Please try again later.
            </p>
          )}

          {status === "ok" && items.length === 0 && (
            <p className="nb-empty">
              No new updates in the last 30 days. We will let you know when
              something new is added.
            </p>
          )}

          {status === "ok" && items.length > 0 && (
            <ul className="nb-list">
              {items.map((item) => {
                const { Icon, color, bg } =
                  TYPE_STYLE[item.type] || FALLBACK_STYLE;

                return (
                  <li key={item.id}>
                    <Link
                      to={item.link}
                      className={`nb-item${item.isNew ? " is-new" : ""}`}
                      onClick={closePanel}
                    >
                      <span
                        className="nb-item-icon"
                        style={{ color, background: bg }}
                        aria-hidden="true"
                      >
                        <Icon size={17} />
                      </span>

                      <span className="nb-item-text">
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                        <small>{timeAgo(item.createdAt)}</small>
                      </span>

                      {item.isNew && (
                        <span className="nb-new-dot" aria-label="New" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;