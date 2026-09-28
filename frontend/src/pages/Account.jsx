import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

function Account() {
  const navigate =
    useNavigate();

  const [
    user,
    setUser,
  ] = useState(null);

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

  // =====================================================
  // LOAD USER FROM LOCAL STORAGE
  // =====================================================

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem(
          "dishaUser"
        );

      const parsedUser =
        savedUser
          ? JSON.parse(
              savedUser
            )
          : null;

      setUser(
        parsedUser
      );
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
          Array.isArray(
            data.notes
          )
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
        setLoadingNotes(false);
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

    navigate(
      "/login"
    );
  }

  // =====================================================
  // DATE FORMAT
  // =====================================================

  function formatDate(
    value
  ) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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

  // =====================================================
  // NO LOGIN
  // =====================================================

  if (!user) {
    return (
      <div
        style={{
          minHeight:
            "80vh",

          display:
            "flex",

          justifyContent:
            "center",

          alignItems:
            "center",

          padding:
            "30px 20px",

          textAlign:
            "center",
        }}
      >

        <div
          style={{
            maxWidth:
              "500px",

            width:
              "100%",

            padding:
              "40px 30px",

            background:
              "#ffffff",

            borderRadius:
              "16px",

            boxShadow:
              "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >

          <div
            style={{
              fontSize:
                "48px",

              marginBottom:
                "15px",
            }}
          >
            🔐
          </div>

          <h1
            style={{
              color:
                "#071a49",

              marginBottom:
                "10px",
            }}
          >
            Please Login
          </h1>

          <p
            style={{
              color:
                "#667085",

              lineHeight:
                "1.6",

              marginBottom:
                "25px",
            }}
          >
            You need to login to
            view your account and
            purchased notes.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/login"
              )
            }
            style={{
              padding:
                "12px 25px",

              border:
                "none",

              borderRadius:
                "8px",

              background:
                "#f5b82e",

              color:
                "#071a49",

              fontWeight:
                "700",

              cursor:
                "pointer",
            }}
          >
            Go to Login
          </button>

        </div>

      </div>
    );
  }

  return (
    <div
      style={{
        minHeight:
          "80vh",

        padding:
          "50px 20px",

        background:
          "#f5f7fb",
      }}
    >

      <div
        style={{
          maxWidth:
            "1000px",

          margin:
            "0 auto",
        }}
      >

        {/* =================================================
            PROFILE
        ================================================= */}

        <div
          style={{
            background:
              "#ffffff",

            padding:
              "35px",

            borderRadius:
              "16px",

            boxShadow:
              "0 5px 25px rgba(0,0,0,0.06)",

            marginBottom:
              "30px",
          }}
        >

          <h1
            style={{
              textAlign:
                "center",

              color:
                "#071a49",

              margin:
                "0 0 30px",
            }}
          >
            My Account
          </h1>

          {/* PROFILE ICON */}

          <div
            style={{
              width:
                "90px",

              height:
                "90px",

              borderRadius:
                "50%",

              background:
                "#f5b82e",

              color:
                "#071a49",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              fontSize:
                "36px",

              fontWeight:
                "700",

              margin:
                "0 auto 30px",
            }}
          >
            {user.fullName
              ? user.fullName
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",

              gap:
                "18px",

              marginBottom:
                "25px",
            }}
          >

            {/* NAME */}

            <div
              style={{
                padding:
                  "16px",

                background:
                  "#f8fafc",

                borderRadius:
                  "10px",

                border:
                  "1px solid #e7ecf3",
              }}
            >
              <strong
                style={{
                  color:
                    "#667085",

                  fontSize:
                    "13px",
                }}
              >
                Full Name
              </strong>

              <p
                style={{
                  margin:
                    "7px 0 0",

                  fontSize:
                    "17px",

                  fontWeight:
                    "600",

                  color:
                    "#1d2939",
                }}
              >
                {user.fullName ||
                  "—"}
              </p>
            </div>

            {/* EMAIL */}

            <div
              style={{
                padding:
                  "16px",

                background:
                  "#f8fafc",

                borderRadius:
                  "10px",

                border:
                  "1px solid #e7ecf3",
              }}
            >
              <strong
                style={{
                  color:
                    "#667085",

                  fontSize:
                    "13px",
                }}
              >
                Email Address
              </strong>

              <p
                style={{
                  margin:
                    "7px 0 0",

                  fontSize:
                    "17px",

                  fontWeight:
                    "600",

                  color:
                    "#1d2939",

                  wordBreak:
                    "break-word",
                }}
              >
                {user.email ||
                  "—"}
              </p>
            </div>

            {/* MOBILE */}

            <div
              style={{
                padding:
                  "16px",

                background:
                  "#f8fafc",

                borderRadius:
                  "10px",

                border:
                  "1px solid #e7ecf3",
              }}
            >
              <strong
                style={{
                  color:
                    "#667085",

                  fontSize:
                    "13px",
                }}
              >
                Mobile Number
              </strong>

              <p
                style={{
                  margin:
                    "7px 0 0",

                  fontSize:
                    "17px",

                  fontWeight:
                    "600",

                  color:
                    "#1d2939",
                }}
              >
                {user.mobile ||
                  "—"}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            style={{
              width:
                "100%",

              padding:
                "13px",

              border:
                "none",

              borderRadius:
                "8px",

              background:
                "#071a49",

              color:
                "#ffffff",

              fontSize:
                "15px",

              fontWeight:
                "700",

              cursor:
                "pointer",
            }}
          >
            Logout
          </button>

        </div>

        {/* =================================================
            PURCHASED NOTES
        ================================================= */}

        <div
          style={{
            background:
              "#ffffff",

            padding:
              "35px",

            borderRadius:
              "16px",

            boxShadow:
              "0 5px 25px rgba(0,0,0,0.06)",
          }}
        >

          <div
            style={{
              marginBottom:
                "25px",
            }}
          >
            <span
              style={{
                color:
                  "#b78300",

                fontSize:
                  "12px",

                fontWeight:
                  "800",

                letterSpacing:
                  "1px",
              }}
            >
              MY LIBRARY
            </span>

            <h2
              style={{
                margin:
                  "5px 0",

                color:
                  "#071a49",

                fontSize:
                  "27px",
              }}
            >
              My Purchased Notes
            </h2>

            <p
              style={{
                margin:
                  "6px 0 0",

                color:
                  "#667085",

                lineHeight:
                  "1.6",
              }}
            >
              Access all study notes
              purchased from your
              account.
            </p>
          </div>

          {/* LOADING */}

          {loadingNotes && (
            <div
              style={{
                padding:
                  "35px 20px",

                textAlign:
                  "center",

                color:
                  "#667085",
              }}
            >
              Loading purchased
              notes...
            </div>
          )}

          {/* ERROR */}

          {!loadingNotes &&
            notesError && (

              <div
                style={{
                  padding:
                    "16px",

                  border:
                    "1px solid #f1c0c0",

                  borderRadius:
                    "10px",

                  background:
                    "#fff2f2",

                  color:
                    "#a52727",

                  marginBottom:
                    "20px",
                }}
              >
                {notesError}
              </div>

            )}

          {/* NO PURCHASE */}

          {!loadingNotes &&
            !notesError &&
            purchasedNotes.length ===
              0 && (

              <div
                style={{
                  padding:
                    "45px 20px",

                  textAlign:
                    "center",

                  border:
                    "1px dashed #cfd7e4",

                  borderRadius:
                    "12px",

                  background:
                    "#fafbfd",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "42px",

                    marginBottom:
                      "12px",
                  }}
                >
                  📚
                </div>

                <h3
                  style={{
                    margin:
                      "0 0 8px",

                    color:
                      "#253858",
                  }}
                >
                  No Purchased Notes
                </h3>

                <p
                  style={{
                    margin:
                      "0 0 20px",

                    color:
                      "#758195",
                  }}
                >
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
                  style={{
                    padding:
                      "11px 20px",

                    border:
                      "none",

                    borderRadius:
                      "8px",

                    background:
                      "#f5b82e",

                    color:
                      "#071a49",

                    fontWeight:
                      "700",

                    cursor:
                      "pointer",
                  }}
                >
                  Browse Notes
                </button>

              </div>

            )}

          {/* PURCHASE LIST */}

          {!loadingNotes &&
            !notesError &&
            purchasedNotes.length >
              0 && (

              <div
                style={{
                  display:
                    "grid",

                  gap:
                    "15px",
                }}
              >

                {purchasedNotes.map(
                  (note) => (

                    <div
                      key={
                        note.orderId
                      }
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "space-between",

                        gap:
                          "20px",

                        padding:
                          "20px",

                        border:
                          "1px solid #e2e8f0",

                        borderRadius:
                          "12px",

                        background:
                          "#ffffff",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",

                          gap:
                            "15px",

                          alignItems:
                            "flex-start",

                          minWidth:
                            "0",
                        }}
                      >

                        <div
                          style={{
                            width:
                              "48px",

                            height:
                              "48px",

                            flexShrink:
                              "0",

                            borderRadius:
                              "10px",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            background:
                              "#eef4ff",

                            fontSize:
                              "24px",
                          }}
                        >
                          📖
                        </div>

                        <div
                          style={{
                            minWidth:
                              "0",
                          }}
                        >

                          <h3
                            style={{
                              margin:
                                "0 0 5px",

                              color:
                                "#15294c",

                              fontSize:
                                "18px",
                            }}
                          >
                            {note.title}
                          </h3>

                          <p
                            style={{
                              margin:
                                "0 0 7px",

                              color:
                                "#667085",

                              fontSize:
                                "13px",
                            }}
                          >
                            {note.categoryTitle}

                            {note.subcategoryTitle
                              ? ` · ${note.subcategoryTitle}`
                              : ""}
                          </p>

                          <div
                            style={{
                              display:
                                "flex",

                              flexWrap:
                                "wrap",

                              gap:
                                "8px",

                              alignItems:
                                "center",
                            }}
                          >

                            <span
                              style={{
                                display:
                                  "inline-block",

                                padding:
                                  "4px 8px",

                                borderRadius:
                                  "999px",

                                background:
                                  "#eaf8ef",

                                color:
                                  "#14743a",

                                fontSize:
                                  "11px",

                                fontWeight:
                                  "700",
                              }}
                            >
                              ✓ Purchased
                            </span>

                            {note.purchasedAt && (

                              <span
                                style={{
                                  color:
                                    "#8994a5",

                                  fontSize:
                                    "11px",
                                }}
                              >
                                {formatDate(
                                  note.purchasedAt
                                )}
                              </span>

                            )}

                          </div>

                        </div>

                      </div>

                      <div
                        style={{
                          display:
                            "flex",

                          flexDirection:
                            "column",

                          alignItems:
                            "flex-end",

                          gap:
                            "10px",

                          flexShrink:
                            "0",
                        }}
                      >

                        <strong
                          style={{
                            color:
                              "#071a49",

                            fontSize:
                              "17px",
                          }}
                        >
                          ₹{note.price}
                        </strong>

                        {note.hasContent ? (

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/read-note/${note.noteId}?orderId=${encodeURIComponent(
                                  note.orderId
                                )}`
                              )
                            }
                            style={{
                              padding:
                                "10px 16px",

                              border:
                                "none",

                              borderRadius:
                                "8px",

                              background:
                                "#071a49",

                              color:
                                "#ffffff",

                              fontWeight:
                                "700",

                              cursor:
                                "pointer",

                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            Read Note →
                          </button>

                        ) : (

                          <button
                            type="button"
                            disabled
                            style={{
                              padding:
                                "10px 16px",

                              border:
                                "none",

                              borderRadius:
                                "8px",

                              background:
                                "#e5e7eb",

                              color:
                                "#8a94a5",

                              fontWeight:
                                "700",

                              cursor:
                                "not-allowed",
                            }}
                          >
                            Unavailable
                          </button>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

        </div>

      </div>

    </div>
  );
}

export default Account;