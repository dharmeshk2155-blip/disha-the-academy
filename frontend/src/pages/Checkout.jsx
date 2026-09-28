import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

function Checkout() {
  const navigate =
    useNavigate();

  const { id } =
    useParams();

  // =====================================================
  // LOGGED IN USER
  // =====================================================

  let loggedInUser = null;

  try {
    const savedUser =
      localStorage.getItem(
        "dishaUser"
      );

    if (savedUser) {
      loggedInUser =
        JSON.parse(
          savedUser
        );
    }
  } catch (error) {
    console.error(
      "User data error:",
      error
    );
  }

  // =====================================================
  // NOTE
  // =====================================================

  const [
    note,
    setNote,
  ] = useState(null);

  const [
    noteLoading,
    setNoteLoading,
  ] = useState(true);

  const [
    noteError,
    setNoteError,
  ] = useState("");

  // =====================================================
  // USER DETAILS
  // =====================================================

  const [
    fullName,
    setFullName,
  ] = useState(
    loggedInUser?.fullName ||
      ""
  );

  const [
    email,
    setEmail,
  ] = useState(
    loggedInUser?.email ||
      ""
  );

  const [
    mobile,
    setMobile,
  ] = useState(
    loggedInUser?.mobile ||
      ""
  );

  // =====================================================
  // PAYMENT
  // =====================================================

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    settingsLoading,
    setSettingsLoading,
  ] = useState(true);

  const [
    notesSalesEnabled,
    setNotesSalesEnabled,
  ] = useState(true);

  // =====================================================
  // LOAD NOTE
  // =====================================================

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadNote() {
      try {
        setNoteLoading(
          true
        );

        setNoteError("");

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
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Note not found."
          );
        }

        setNote(data);
      } catch (error) {
        if (
          error.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Checkout note error:",
          error
        );

        setNote(null);

        setNoteError(
          error.message ||
            "Unable to load note."
        );
      } finally {
        setNoteLoading(
          false
        );
      }
    }

    loadNote();

    return () => {
      controller.abort();
    };
  }, [id]);

  // =====================================================
  // WEBSITE SETTINGS
  // =====================================================

  useEffect(() => {
    const loadSettings =
      async () => {
        try {
          const response =
            await fetch(
              `${API_BASE}/api/settings`
            );

          if (!response.ok) {
            throw new Error(
              "Unable to load website settings"
            );
          }

          const data =
            await response.json();

          if (
            data.success &&
            data.settings
          ) {
            setNotesSalesEnabled(
              Boolean(
                data.settings
                  .notesSalesEnabled
              )
            );
          }
        } catch (error) {
          console.error(
            "Checkout settings error:",
            error
          );

          // Backend still performs
          // the final security check.
          setNotesSalesEnabled(
            true
          );
        } finally {
          setSettingsLoading(
            false
          );
        }
      };

    loadSettings();
  }, []);

  // =====================================================
  // LOAD RAZORPAY
  // =====================================================

  const loadRazorpay =
    () => {
      return new Promise(
        (resolve) => {
          if (
            window.Razorpay
          ) {
            resolve(true);
            return;
          }

          const script =
            document.createElement(
              "script"
            );

          script.src =
            "https://checkout.razorpay.com/v1/checkout.js";

          script.onload =
            () =>
              resolve(true);

          script.onerror =
            () =>
              resolve(false);

          document.body.appendChild(
            script
          );
        }
      );
    };

  // =====================================================
  // VERIFY PAYMENT
  // =====================================================

  const verifyPayment =
    async (
      paymentResponse
    ) => {
      try {
        const response =
          await fetch(
            `${API_BASE}/api/payment/verify`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  razorpay_order_id:
                    paymentResponse
                      .razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse
                      .razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse
                      .razorpay_signature,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Payment verification failed"
          );
        }

        return data;
      } catch (error) {
        console.error(
          "Verification error:",
          error
        );

        alert(
          error.message ||
            "Payment verification failed."
        );

        setLoading(false);

        return null;
      }
    };

  // =====================================================
  // PROCEED TO PAYMENT
  // =====================================================

  const handleProceedToPay =
    async () => {
      if (!note) {
        alert(
          "Note information is not available."
        );

        return;
      }

      // NEW CONTENT SYSTEM
      if (!note.hasContent) {
        alert(
          "This note is not available for purchase yet."
        );

        return;
      }

      if (
        !notesSalesEnabled
      ) {
        alert(
          "Notes purchasing is temporarily unavailable. Please try again later."
        );

        return;
      }

      if (
        !loggedInUser?.id
      ) {
        alert(
          "Please log in before purchasing notes."
        );

        navigate(
          "/login"
        );

        return;
      }

      if (
        !fullName.trim() ||
        !email.trim() ||
        !mobile.trim()
      ) {
        alert(
          "Please fill in your name, email and mobile number"
        );

        return;
      }

      try {
        setLoading(true);

        const razorpayLoaded =
          await loadRazorpay();

        if (
          !razorpayLoaded
        ) {
          alert(
            "Razorpay failed to load. Please check your internet connection."
          );

          setLoading(false);

          return;
        }

        const response =
          await fetch(
            `${API_BASE}/api/payment/create-order`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  noteId:
                    Number(
                      note.id
                    ),

                  userId:
                    loggedInUser.id,
                }),
            }
          );

        const order =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok ||
          !order.success
        ) {
          if (
            order.code ===
            "NOTES_SALES_DISABLED"
          ) {
            setNotesSalesEnabled(
              false
            );
          }

          throw new Error(
            order.error ||
              "Failed to create payment order"
          );
        }

        const options = {
          key:
            import.meta.env
              .VITE_RAZORPAY_KEY_ID,

          amount:
            order.amount,

          currency:
            order.currency,

          name:
            "Disha The Academy",

          description:
            note.title,

          order_id:
            order.id,

          prefill: {
            name:
              fullName,

            email:
              email,

            contact:
              mobile,
          },

          theme: {
            color:
              "#2563eb",
          },

          handler:
            async function (
              paymentResponse
            ) {
              const result =
                await verifyPayment(
                  paymentResponse
                );

              if (
                result &&
                result.success
              ) {
                navigate(
                  `/order-success/${note.id}?orderId=${paymentResponse.razorpay_order_id}`
                );
              }
            },

          modal: {
            ondismiss:
              function () {
                setLoading(
                  false
                );
              },
          },
        };

        const razorpay =
          new window.Razorpay(
            options
          );

        razorpay.on(
          "payment.failed",
          function (
            response
          ) {
            console.error(
              "PAYMENT FAILED:",
              response.error
            );

            alert(
              response.error
                ?.description ||
                "Payment failed. Please try again."
            );

            setLoading(
              false
            );
          }
        );

        razorpay.open();
      } catch (error) {
        console.error(
          "Payment error:",
          error
        );

        alert(
          error.message ||
            "Unable to start payment."
        );

        setLoading(false);
      }
    };

  // =====================================================
  // LOADING
  // =====================================================

  if (noteLoading) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">

          <h1>
            Loading Checkout...
          </h1>

          <p>
            Please wait while we
            load your note.
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // NOTE NOT FOUND
  // =====================================================

  if (
    noteError ||
    !note
  ) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">

          <h1>
            Note Not Found
          </h1>

          <p>
            {noteError ||
              "This note is unavailable."}
          </p>

          <Link
            to="/notes"
            className="back-link"
          >
            ← Back to Notes
          </Link>

        </div>
      </div>
    );
  }

  const available =
    Boolean(
      note.hasContent
    );

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="checkout-page">

      <div className="checkout-container">

        <Link
          to={`/note/${note.id}`}
          className="back-link"
        >
          ← Back to Note
        </Link>

        <h1>
          Checkout
        </h1>

        <p className="checkout-subtitle">
          Complete your details to
          continue
        </p>

        {/* SALES DISABLED */}

        {!settingsLoading &&
          !notesSalesEnabled && (

            <div
              style={{
                marginBottom:
                  "22px",

                padding:
                  "18px 20px",

                border:
                  "1px solid #f0d58a",

                borderRadius:
                  "12px",

                background:
                  "#fff8e5",

                color:
                  "#7c5b08",
              }}
            >

              <strong
                style={{
                  display:
                    "block",

                  marginBottom:
                    "6px",

                  fontSize:
                    "16px",
                }}
              >
                Purchasing Temporarily Unavailable
              </strong>

              <span
                style={{
                  fontSize:
                    "14px",

                  lineHeight:
                    "1.6",
                }}
              >
                Notes purchasing is currently paused.
                Please check back later.
              </span>

            </div>
          )}

        {/* CONTENT NOT AVAILABLE */}

        {!available && (

          <div
            style={{
              marginBottom:
                "22px",

              padding:
                "18px 20px",

              border:
                "1px solid #d9e0e8",

              borderRadius:
                "12px",

              background:
                "#f8fafc",

              color:
                "#475467",
            }}
          >

            <strong
              style={{
                display:
                  "block",

                marginBottom:
                  "6px",
              }}
            >
              Note Coming Soon
            </strong>

            This study note does not
            currently have content
            available for purchase.

          </div>

        )}

        <div className="checkout-grid">

          <div className="checkout-form">

            <h2>
              Your Details
            </h2>

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={
                fullName
              }
              onChange={(
                e
              ) =>
                setFullName(
                  e.target.value
                )
              }
            />

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={
                email
              }
              onChange={(
                e
              ) =>
                setEmail(
                  e.target.value
                )
              }
            />

            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={
                mobile
              }
              onChange={(
                e
              ) =>
                setMobile(
                  e.target.value
                )
              }
            />

            <button
              className="continue-button"
              type="button"
              onClick={
                handleProceedToPay
              }
              disabled={
                loading ||
                settingsLoading ||
                !notesSalesEnabled ||
                !available
              }
            >
              {settingsLoading
                ? "Checking availability..."
                : !notesSalesEnabled
                ? "Purchasing Unavailable"
                : !available
                ? "Coming Soon"
                : loading
                ? "Processing..."
                : `Proceed to Pay ₹${note.price}`}
            </button>

          </div>

          <div className="order-summary">

            <h2>
              Order Summary
            </h2>

            <div className="order-icon">
              📖
            </div>

            <h3>
              {note.title}
            </h3>

            <p>
              {note.categoryTitle}

              {note.subcategoryTitle
                ? ` · ${note.subcategoryTitle}`
                : ""}
            </p>

            <div className="summary-line">

              <span>
                Format
              </span>

              <strong>
                Online Notes
              </strong>

            </div>

            <div className="summary-line">

              <span>
                Price
              </span>

              <strong>
                ₹{note.price}
              </strong>

            </div>

            <div className="summary-line total-line">

              <span>
                Total
              </span>

              <strong>
                ₹{note.price}
              </strong>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Checkout;