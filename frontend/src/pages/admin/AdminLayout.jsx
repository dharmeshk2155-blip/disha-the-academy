import { useState } from "react";
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
        path: "/admin/tests",
        label: "Tests / Mock Tests",
        icon: ClipboardList,
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
  "/admin/tests": "Tests / Mock Tests",
  "/admin/current-affairs": "Current Affairs",
  "/admin/blog": "Blog",
  "/admin/faq": "FAQ",
  "/admin/users": "Users",
  "/admin/orders": "Orders",
  "/admin/contact-submissions": "Contact Messages",
  "/admin/about": "Pages",
  "/admin/settings": "Settings",
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem("adminKey") || ""
  );

  const [unlocked, setUnlocked] = useState(
    () => !!sessionStorage.getItem("adminKey")
  );

  const [keyInput, setKeyInput] = useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const currentPageTitle =
    PAGE_TITLES[location.pathname] ||
    "Admin Dashboard";

  function handleUnlock(e) {
    e.preventDefault();

    const key = keyInput.trim();

    if (!key) {
      return;
    }

    sessionStorage.setItem(
      "adminKey",
      key
    );

    setAdminKey(key);
    setUnlocked(true);
    setKeyInput("");
  }

  function handleLogout() {
    sessionStorage.removeItem(
      "adminKey"
    );

    setAdminKey("");
    setUnlocked(false);
    setKeyInput("");
    setSidebarOpen(false);

    navigate("/admin");
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  /* ==========================
     ADMIN LOCK SCREEN
  ========================== */

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
            Enter your admin key to continue.
          </p>

          <label htmlFor="adminKey">
            Admin Key
          </label>

          <input
            id="adminKey"
            type="password"
            placeholder="Enter admin key"
            value={keyInput}
            onChange={(e) =>
              setKeyInput(
                e.target.value
              )
            }
            autoComplete="off"
            required
          />

          <button type="submit">
            <ShieldCheck size={18} />

            Unlock Dashboard
          </button>

          <div className="admin-lock-security">
            🔒 Secure administrator access
          </div>

        </form>

      </div>
    );
  }

  /* ==========================
     ADMIN PANEL
  ========================== */

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
                          strokeWidth={1.8}
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
              A
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="admin-main">

          <Outlet
            context={{
              adminKey,
            }}
          />

        </main>

      </div>

    </div>
  );
}