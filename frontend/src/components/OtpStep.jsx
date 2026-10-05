import { useEffect, useState } from "react";

const RESEND_SECONDS = 60;

/**
 * OTP screen used by Login and Register.
 *
 * Props:
 *  - apiBase   : backend base URL
 *  - flow      : "register" | "login"
 *  - email     : email the OTP was sent to
 *  - onVerified(data) : called with { token, user, ... } after success
 *  - onBack()  : go back to the previous form
 */
function OtpStep({ apiBase, flow, email, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function show(text, error) {
    setMessage(text);
    setIsError(error);
  }

  async function handleVerify(e) {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      show("Please enter the 6-digit OTP.", true);
      return;
    }

    setLoading(true);
    show("", false);

    try {
      const res = await fetch(`${apiBase}/api/${flow}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        show(data.message || "Verified!", false);
        onVerified(data);
      } else {
        show(data.message || "Invalid OTP.", true);
      }
    } catch (error) {
      console.error("OTP verify error:", error);
      show("Unable to connect to the server. Please check your internet connection and try again.", true);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0) return;

    show("", false);

    try {
      const res = await fetch(`${apiBase}/api/${flow}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        show(data.message || "A new OTP has been sent.", false);
        setOtp("");
        setSecondsLeft(RESEND_SECONDS);
      } else {
        show(data.message || "Could not resend OTP.", true);
      }
    } catch (error) {
      console.error("OTP resend error:", error);
      show("Unable to connect to the server. Please check your internet connection and try again.", true);
    }
  }

  return (
    <form onSubmit={handleVerify} className="premium-login-form">
      <p className="login-subtitle">
        We sent a 6-digit OTP to <strong>{email}</strong>. Enter it below to
        continue.
      </p>

      <div className="input-group">
        <label>Enter OTP</label>
        <div className="premium-input-wrapper">
          <span className="login-input-icon">#</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              setMessage("");
            }}
            autoFocus
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="login-button premium-login-button"
        disabled={loading}
      >
        <span>{loading ? "Verifying..." : "Verify OTP"}</span>
        {!loading && <span className="login-arrow">→</span>}
      </button>

      {message && (
        <div className={isError ? "login-status error" : "login-status success"}>
          {isError ? "" : "✓ "}
          {message}
        </div>
      )}

      <p className="register-text">
        Didn't get the OTP?{" "}
        {secondsLeft > 0 ? (
          <span>Resend in {secondsLeft}s</span>
        ) : (
          <a
            href="#resend"
            onClick={(e) => {
              e.preventDefault();
              handleResend();
            }}
          >
            Resend OTP
          </a>
        )}
      </p>

      <p className="register-text">
        <a
          href="#back"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
        >
          ← Back
        </a>
      </p>
    </form>
  );
}

export default OtpStep;