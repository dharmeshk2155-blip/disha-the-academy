import { useCallback, useEffect, useState } from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Layers,
  Gift,
  Newspaper,
  PenLine,
  CircleHelp,
  Users,
  ShoppingBag,
  Mail,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";


import "./AdminLayout.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

const SECTIONS = [
  {
    title: "OVERVIEW",
    items: [
      {
        path: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },

  {
    title: "CONTENT",
    items: [
      {
        path: "/admin/notes",
        label: "Notes",
        icon: BookOpen,
      },
      {
        path: "/admin/notes-import",
        label: "Import Word Notes",
        icon: FileText,
      },
      {
        path: "/admin/free-tests",
        label: "Free Tests",
        icon: Gift,
      },
      {
        path: "/admin/tests",
        label: "Tests / Mock Tests",
        icon: ClipboardList,
      },
      {
        path: "/admin/exams",
        label: "Exams & Categories",
        icon: Layers,
      },
      {
        path: "/admin/current-affairs",
        label: "Current Affairs",
        icon: Newspaper,
      },
      {
        path: "/admin/blog",
        label: "Blog",
        icon: PenLine,
      },
      {
        path: "/admin/faq",
        label: "FAQ",
        icon: CircleHelp,
      },
    ],
  },

  {
    title: "USERS & SALES",
    items: [
      {
        path: "/admin/users",
        label: "Users",
        icon: Users,
      },
      {
        path: "/admin/orders",
        label: "Orders",
        icon: ShoppingBag,
      },
    ],
  },

  {
    title: "WEBSITE",
    items: [
      {
        path: "/admin/contact-submissions",
        label: "Contact Messages",
        icon: Mail,
      },
      {
        path: "/admin/about",
        label: "Pages",
        icon: FileText,
      },
      {
        path: "/admin/settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

const PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/notes": "Notes",
  "/admin/notes-import": "Import Word Notes",
  "/admin/free-tests": "Free Tests",
  "/admin/tests": "Tests / Mock Tests",
  "/admin/exams": "Exams & Categories",
  "/admin/current-affairs": "Current Affairs",
  "/admin/blog": "Blog",
  "/admin/faq": "FAQ",
  "/admin/users": "Users",
  "/admin/orders": "Orders",
  "/admin/contact-submissions": "Contact Messages",
  "/admin/about": "Pages",
  "/admin/settings": "Settings",
};

const TOKEN_KEY = "adminToken";

// Reads the expiry time (ms) out of the token so the panel can lock
// itself the moment the session ends. (Only for the UI - the server
// always re-checks the token on every request.)
function tokenExpiryMs(token) {
  try {
    const payload = JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return Number(payload.exp) * 1000 || 0;
  } catch {
    return 0;
  }
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const storedToken =
    sessionStorage.getItem(TOKEN_KEY) || "";

  const [adminToken, setAdminToken] =
    useState(storedToken);

  const [adminName, setAdminName] =
    useState("");

  const [unlocked, setUnlocked] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(Boolean(storedToken));

  const [emailInput, setEmailInput] =
    useState("");

  const [passwordInput, setPasswordInput] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [verifying, setVerifying] =
    useState(false);

  const [error, setError] =
    useState("");

  const currentPageTitle =
    PAGE_TITLES[location.pathname] ||
    "Admin Dashboard";

  // =========================================
  // LOCK ADMIN (logout / expired session)
  // =========================================

  const lockAdmin = useCallback(
    (message = "") => {
      sessionStorage.removeItem(TOKEN_KEY);

      setAdminToken("");
      setAdminName("");
      setUnlocked(false);
      setCheckingSession(false);
      setEmailInput("");
      setPasswordInput("");
      setError(message);
    },
    []
  );

  // =========================================
  // VERIFY SAVED ADMIN SESSION
  // =========================================

  useEffect(() => {
    let cancelled = false;

    // The old shared admin key is no longer used.
    // Remove any copy left in this browser.
    sessionStorage.removeItem("adminKey");

    async function verifySavedSession() {
      const savedToken =
        sessionStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        if (!cancelled) {
          lockAdmin();
        }

        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/admin/session`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          !data.success
        ) {
          lockAdmin();

          return;
        }

        setAdminToken(savedToken);
        setAdminName(data.admin?.name || "");
        setUnlocked(true);
        setCheckingSession(false);
      } catch (err) {
        console.error(
          "Saved admin session verification error:",
          err
        );

        if (!cancelled) {
          lockAdmin();
        }
      }
    }

    verifySavedSession();

    return () => {
      cancelled = true;
    };
  }, [lockAdmin]);

  // =========================================
  // AUTO-LOCK WHEN THE SESSION EXPIRES
  // =========================================

  useEffect(() => {
    if (!unlocked || !adminToken) {
      return undefined;
    }

    const message =
      "Your admin session expired. Please log in again.";

    const msLeft =
      tokenExpiryMs(adminToken) - Date.now();

    if (msLeft <= 0) {
      lockAdmin(message);

      return undefined;
    }

    // setTimeout cannot handle values above ~24 days
    const timer = setTimeout(
      () => lockAdmin(message),
      Math.min(msLeft, 2147483647)
    );

    return () => clearTimeout(timer);
  }, [unlocked, adminToken, lockAdmin]);

  // =========================================
  // ADMIN LOGIN
  // =========================================

  async function handleUnlock(e) {
    e.preventDefault();

    const email = emailInput.trim();

    if (!email || !passwordInput) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setVerifying(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password: passwordInput,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !data.success ||
        !data.token
      ) {
        setError(
          data.message ||
            "Login failed. Please try again."
        );

        setPasswordInput("");

        return;
      }

      sessionStorage.setItem(
        TOKEN_KEY,
        data.token
      );

      setAdminToken(data.token);
      setAdminName(data.admin?.name || "");
      setUnlocked(true);
      setEmailInput("");
      setPasswordInput("");
      setError("");
    } catch (err) {
      console.error(
        "Admin login error:",
        err
      );

      setError(
        "Unable to reach the server. Please check your connection and try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  // =========================================
  // LOGOUT
  // =========================================

  function handleLogout() {
    lockAdmin();
    setSidebarOpen(false);

    navigate("/admin");
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  // =========================================
  // SESSION CHECK SCREEN
  // =========================================

  if (checkingSession) {
    return (
      <div className="admin-lock-page">
        <div className="admin-lock-glow admin-lock-glow-one"></div>
        <div className="admin-lock-glow admin-lock-glow-two"></div>

        <div className="admin-lock-card">
          <div className="admin-lock-icon">
            <ShieldCheck size={34} />
          </div>

          <div className="admin-lock-brand">
            <span>D</span>isha The Academy
          </div>

          <h2>
            Verifying Admin Session
          </h2>

          <p>
            Please wait while we verify
            your secure session.
          </p>

          <div className="admin-lock-security">
            🔒 Secure administrator
            verification
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // ADMIN LOCK SCREEN
  // =========================================

  if (!unlocked) {
    return (
      <div className="admin-lock-page">
        <div className="admin-lock-glow admin-lock-glow-one"></div>
        <div className="admin-lock-glow admin-lock-glow-two"></div>

        <form
          className="admin-lock-card"
          onSubmit={handleUnlock}
        >
          <div className="admin-lock-icon">
            <ShieldCheck size={34} />
          </div>

          <div className="admin-lock-brand">
            <span>D</span>isha The Academy
          </div>

          <h2>
            Admin Dashboard
          </h2>

          <p>
            Log in with your admin
            account to continue.
          </p>

          <label htmlFor="adminEmail">
            Email
          </label>

          <input
            id="adminEmail"
            type="email"
            placeholder="Enter admin email"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(
                e.target.value
              );

              if (error) {
                setError("");
              }
            }}
            autoComplete="username"
            disabled={verifying}
            required
          />

          <label htmlFor="adminPassword">
            Password
          </label>

          <input
            id="adminPassword"
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(
                e.target.value
              );

              if (error) {
                setError("");
              }
            }}
            autoComplete="current-password"
            disabled={verifying}
            required
          />

          {error && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                background:
                  "rgba(220, 38, 38, 0.10)",
                color: "#dc2626",
                fontSize: "14px",
                lineHeight: "1.4",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
          >
            <ShieldCheck size={18} />

            {verifying
              ? "Logging in..."
              : "Log In"}
          </button>

          <div className="admin-lock-security">
            🔒 Secure administrator access
          </div>
        </form>
      </div>
    );
  }

  // =========================================
  // ADMIN PANEL
  // =========================================

  return (
    <div className="admin-shell">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`admin-sidebar ${
          sidebarOpen
            ? "admin-sidebar-open"
            : ""
        }`}
      >
        {/* LOGO */}

        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="admin-brand-icon">
              D
            </div>

            <div>
              <strong>
                Disha Admin
              </strong>

              <span>
                Control Panel
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-mobile-close"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="admin-navigation">
          {SECTIONS.map(
            (section) => (
              <div
                className="admin-nav-section"
                key={section.title}
              >
                <p className="admin-nav-title">
                  {section.title}
                </p>

                {section.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={
                          closeSidebar
                        }
                        className={({
                          isActive,
                        }) =>
                          `admin-nav-link ${
                            isActive
                              ? "active"
                              : ""
                          }`
                        }
                      >
                        <Icon
                          size={19}
                          strokeWidth={
                            1.8
                          }
                        />

                        <span>
                          {item.label}
                        </span>
                      </NavLink>
                    );
                  }
                )}
              </div>
            )
          )}
        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="admin-sidebar-footer">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-view-site"
          >
            <ExternalLink
              size={18}
            />

            View Website
          </a>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />

            Lock Dashboard
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE */}

      <div className="admin-content-area">
        {/* ADMIN TOP HEADER */}

        <header className="admin-top-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <h1>
                {currentPageTitle}
              </h1>

              <p>
                Disha The Academy
              </p>
            </div>
          </div>

          <div className="admin-header-right">
            <div className="admin-status">
              <span></span>
              Admin
            </div>

            <div className="admin-avatar">
              {(adminName || "A")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <main className="admin-main">
          <Outlet
            context={{
              adminToken,
            }}
          />
        </main>
      </div>
    </div>
  );
}