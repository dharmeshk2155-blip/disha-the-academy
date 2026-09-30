import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./Account.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

function getInitials(name) {
  const cleanName = String(name || "").trim();

  if (!cleanName) {
    return "U";
  }

  return cleanName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(null);

  const [
    purchasedNotes,
    setPurchasedNotes,
  ] = useState([]);

  const [
    loadingNotes,
    setLoadingNotes,
  ] = useState(true);

  const [
    notesError,
    setNotesError,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState("notes");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("all");

  const [
    downloadingId,
    setDownloadingId,
  ] = useState(null);

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem(
          "dishaUser"
        );

      const parsedUser =
        savedUser
          ? JSON.parse(savedUser)
          : null;

      setUser(parsedUser);
    } catch (error) {
      console.error(
        "User data error:",
        error
      );

      setUser(null);
    }
  }, []);

  // =====================================================
  // LOAD PURCHASED NOTES
  // =====================================================

  useEffect(() => {
    if (!user) {
      setLoadingNotes(false);
      return;
    }

    const controller =
      new AbortController();

    async function loadPurchasedNotes() {
      try {
        setLoadingNotes(true);
        setNotesError("");

        const token =
          localStorage.getItem(
            "dishaToken"
          );

        if (!token) {
          throw new Error(
            "Your login session is missing. Please log in again."
          );
        }

        const response =
          await fetch(
            `${API_BASE}/api/my-notes`,
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

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "dishaUser"
          );

          localStorage.removeItem(
            "dishaToken"
          );

          setUser(null);

          throw new Error(
            data.error ||
              "Your session has expired. Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load purchased notes."
          );
        }

        setPurchasedNotes(
          Array.isArray(data.notes)
            ? data.notes
            : []
        );
      } catch (error) {
        if (
          error.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Purchased notes error:",
          error
        );

        setNotesError(
          error.message ||
            "Unable to load purchased notes."
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setLoadingNotes(false);
        }
      }
    }

    loadPurchasedNotes();

    return () => {
      controller.abort();
    };
  }, [user]);

  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {
    localStorage.removeItem(
      "dishaUser"
    );

    localStorage.removeItem(
      "dishaToken"
    );

    navigate("/login");
  }

  // =====================================================
  // DOWNLOAD PDF
  // =====================================================

  async function handleDownload(
    note
  ) {
    if (!note?.orderId) {
      return;
    }

    try {
      setDownloadingId(
        note.orderId
      );

      const token =
        localStorage.getItem(
          "dishaToken"
        );

      if (!token) {
        throw new Error(
          "Please log in again."
        );
      }

      const response =
        await fetch(
          `${API_BASE}/api/pdf/download/${encodeURIComponent(
            note.orderId
          )}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => ({}));

        throw new Error(
          errorData.error ||
            "Unable to download PDF."
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        `${note.title || "note"}.pdf`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "PDF download error:",
        error
      );

      alert(
        error.message ||
          "Unable to download PDF."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories =
    useMemo(() => {
      const values =
        purchasedNotes
          .map(
            (note) =>
              note.categoryTitle ||
              note.category ||
              ""
          )
          .filter(Boolean);

      return [
        ...new Set(values),
      ];
    }, [purchasedNotes]);

  // =====================================================
  // FILTER NOTES
  // =====================================================

  const filteredNotes =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return purchasedNotes.filter(
        (note) => {
          const category =
            String(
              note.categoryTitle ||
                note.category ||
                ""
            );

          const categoryMatch =
            selectedCategory ===
              "all" ||
            category ===
              selectedCategory;

          if (!categoryMatch) {
            return false;
          }

          if (!query) {
            return true;
          }

          const text = [
            note.title,
            note.categoryTitle,
            note.subcategoryTitle,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(
            query
          );
        }
      );
    }, [
      purchasedNotes,
      search,
      selectedCategory,
    ]);

  // =====================================================
  // LOGIN REQUIRED
  // =====================================================

  if (!user) {
    return (
      <div className="account-login-page">
        <div className="account-login-card">
          <div className="account-lock-icon">
            🔐
          </div>

          <h1>
            Please Login
          </h1>

          <p>
            You need to login to
            view your account,
            purchased notes and
            test activity.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="account-page">
      {/* ==============================================
          HERO
      ============================================== */}

      <section className="account-hero">
        <div className="account-hero-copy">
          <h1>
            My{" "}
            <span>
              Account
            </span>
          </h1>

          <p>
            Manage your profile,
            purchases and account
            settings.
          </p>
        </div>

        <div className="account-hero-art">
          <div className="account-art-leaf">
            🌿
          </div>

          <div className="account-art-profile">
            <span>
              👤
            </span>

            <div className="account-cap">
              🎓
            </div>
          </div>

          <div className="account-books">
            📚
          </div>

          <div className="account-success-card">
            <span>
              ✓ Learn
            </span>

            <span>
              ✓ Practice
            </span>

            <span>
              ✓ Improve
            </span>

            <strong>
              Succeed
            </strong>
          </div>
        </div>

        {/* ==============================================
            PROFILE CARD
        ============================================== */}

        <div className="account-profile-card">
          <div className="account-profile-top">
            <div className="account-profile-user">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="account-avatar-image"
                />
              ) : (
                <div className="account-avatar">
                  {getInitials(
                    user.fullName
                  )}
                </div>
              )}

              <div className="account-profile-name">
                <h2>
                  {user.fullName ||
                    "Student"}
                </h2>

                <p>
                  {user.email}
                </p>

                <span className="account-student-badge">
                  👥 Registered
                  Student
                </span>
              </div>
            </div>

            <button
              type="button"
              className="account-edit-btn"
              onClick={() =>
                setActiveTab(
                  "settings"
                )
              }
            >
              ✎ Edit Profile
            </button>
          </div>

          <div className="account-info-grid">
            <div className="account-info-card">
              <div className="account-info-icon">
                ♙
              </div>

              <div>
                <span>
                  Full Name
                </span>

                <strong>
                  {user.fullName ||
                    "—"}
                </strong>
              </div>
            </div>

            <div className="account-info-card">
              <div className="account-info-icon">
                ✉
              </div>

              <div>
                <span>
                  Email Address
                </span>

                <strong>
                  {user.email ||
                    "—"}
                </strong>
              </div>
            </div>

            <div className="account-info-card">
              <div className="account-info-icon">
                ☎
              </div>

              <div className="account-mobile-data">
                <div>
                  <span>
                    Mobile Number
                  </span>

                  <strong>
                    {user.mobile ||
                      "—"}
                  </strong>
                </div>

                {!user.mobile && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        "settings"
                      )
                    }
                  >
                    Add Number
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================
          ACCOUNT NAVIGATION
      ============================================== */}

      <nav className="account-navigation">
        <button
          type="button"
          className={
            activeTab === "notes"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("notes")
          }
        >
          <span>▣</span>
          My Purchased Notes
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/take-mock-test"
            )
          }
        >
          <span>▤</span>
          My Tests
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/my-results"
            )
          }
        >
          <span>▥</span>
          My Results
        </button>

        <button
          type="button"
          className={
            activeTab ===
            "settings"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "settings"
            )
          }
        >
          <span>⚙</span>
          Account Settings
        </button>

        <button
          type="button"
          className="account-logout-nav"
          onClick={
            handleLogout
          }
        >
          <span>↪</span>
          Logout
        </button>
      </nav>

      {/* ==============================================
          PURCHASED NOTES
      ============================================== */}

      {activeTab ===
        "notes" && (
        <section className="account-library">
          <div className="account-library-header">
            <div className="account-library-title">
              <div className="account-title-line" />

              <div>
                <h2>
                  My Purchased
                  Notes
                </h2>

                <p>
                  Access all the
                  study notes you
                  have purchased
                  from your account.
                </p>
              </div>
            </div>

            <div className="account-library-tools">
              <div className="account-search">
                <span>
                  ⌕
                </span>

                <input
                  type="text"
                  value={search}
                  placeholder="Search your notes..."
                  onChange={(e) =>
                    setSearch(
                      e.target
                        .value
                    )
                  }
                />
              </div>

              <div className="account-category-select">
                <span>
                  ▽
                </span>

                <select
                  value={
                    selectedCategory
                  }
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target
                        .value
                    )
                  }
                >
                  <option value="all">
                    All Categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {loadingNotes && (
            <div className="account-message">
              Loading purchased
              notes...
            </div>
          )}

          {!loadingNotes &&
            notesError && (
              <div className="account-error">
                {notesError}
              </div>
            )}

          {!loadingNotes &&
            !notesError &&
            purchasedNotes.length ===
              0 && (
              <div className="account-empty">
                <div>
                  📚
                </div>

                <h3>
                  No Purchased
                  Notes
                </h3>

                <p>
                  Notes you purchase
                  will appear here.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/notes"
                    )
                  }
                >
                  Browse Notes
                </button>
              </div>
            )}

          {!loadingNotes &&
            !notesError &&
            purchasedNotes.length >
              0 &&
            filteredNotes.length ===
              0 && (
              <div className="account-empty account-filter-empty">
                <div>
                  🔎
                </div>

                <h3>
                  No matching notes
                </h3>

                <p>
                  Try another search
                  or category.
                </p>
              </div>
            )}

          {!loadingNotes &&
            !notesError &&
            filteredNotes.length >
              0 && (
              <div className="account-notes-list">
                {filteredNotes.map(
                  (note) => (
                    <article
                      key={
                        note.orderId
                      }
                      className="account-note-card"
                    >
                      <div className="account-note-main">
                        <div className="account-note-thumbnail">
                          <div className="account-thumbnail-shape">
                            📘
                          </div>

                          <span className="account-pdf-tag">
                            PDF
                          </span>
                        </div>

                        <div className="account-note-content">
                          <div className="account-note-category">
                            {note.categoryTitle ||
                              "Study Note"}
                          </div>

                          <h3>
                            {
                              note.title
                            }
                          </h3>

                          {note.subcategoryTitle && (
                            <strong className="account-note-subcategory">
                              {
                                note.subcategoryTitle
                              }
                            </strong>
                          )}

                          <p>
                            Complete study
                            material for
                            competitive exam
                            preparation.
                          </p>

                          <div className="account-note-meta">
                            <span className="account-purchased-badge">
                              ✓ Purchased
                            </span>

                            {note.purchasedAt && (
                              <span>
                                ▣{" "}
                                {formatDate(
                                  note.purchasedAt
                                )}
                              </span>
                            )}

                            <span>
                              ▤ PDF Note
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="account-note-actions">
                        <strong className="account-note-price">
                          ₹
                          {
                            note.price
                          }
                        </strong>

                        <div className="account-note-buttons">
                          {note.hasContent ? (
                            <button
                              type="button"
                              className="account-read-btn"
                              onClick={() =>
                                navigate(
                                  `/read-note/${note.noteId}?orderId=${encodeURIComponent(
                                    note.orderId
                                  )}`
                                )
                              }
                            >
                              ◉ Read Note
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="account-read-btn disabled"
                            >
                              Unavailable
                            </button>
                          )}

                          <button
                            type="button"
                            className="account-download-btn"
                            disabled={
                              downloadingId ===
                              note.orderId
                            }
                            onClick={() =>
                              handleDownload(
                                note
                              )
                            }
                          >
                            {downloadingId ===
                            note.orderId
                              ? "Downloading..."
                              : "⇩ Download"}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
        </section>
      )}

      {/* ==============================================
          SETTINGS
      ============================================== */}

      {activeTab ===
        "settings" && (
        <section className="account-settings-panel">
          <div className="account-settings-heading">
            <div className="account-title-line" />

            <div>
              <h2>
                Account Settings
              </h2>

              <p>
                Review your account
                information.
              </p>
            </div>
          </div>

          <div className="account-settings-grid">
            <div>
              <span>
                Full Name
              </span>

              <strong>
                {user.fullName ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Email Address
              </span>

              <strong>
                {user.email ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Mobile Number
              </span>

              <strong>
                {user.mobile ||
                  "Not added"}
              </strong>
            </div>
          </div>

          <div className="account-settings-note">
            Profile editing can be
            connected here when the
            profile-update API is
            added.
          </div>
        </section>
      )}
    </main>
  );
}