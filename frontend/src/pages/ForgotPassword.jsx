import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function ForgotPassword() {
  // step 1 = enter email, step 2 = enter OTP + new password, step 3 = done
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || "OTP sent to your email.");
        setStep(2);
      } else {
        setError(data.message || "Could not send OTP. Please try again.");
      }
    } catch (err) {
      setError("Backend se connection nahi ho raha. Check karo backend running hai ya nahi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("Password reset successful! You can now log in.");
        setStep(3);
      } else {
        setError(data.message || "Invalid or expired OTP.");
      }
    } catch (err) {
      setError("Backend se connection nahi ho raha. Check karo backend running hai ya nahi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span>D</span>isha The Academy
        </div>

        <h1>Forgot Password</h1>

        {step === 1 && (
          <>
            <p className="login-subtitle">
              Enter your registered email — we'll send you a 6-digit OTP.
            </p>

            <form onSubmit={handleRequestOtp}>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className="login-subtitle">
              Enter the OTP sent to <strong>{email}</strong> and your new password.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="input-group">
                <label>OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <p className="register-text">
              Didn't get the OTP?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setStep(1);
                  setMessage("");
                  setError("");
                }}
              >
                Try again
              </a>
            </p>
          </>
        )}

        {step === 3 && (
          <p className="login-subtitle" style={{ textAlign: "center" }}>
            Your password has been reset. You can now{" "}
            <Link to="/login">log in</Link> with your new password.
          </p>
        )}

        {message && step !== 3 && (
          <p style={{ marginTop: "15px", textAlign: "center", color: "green" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ marginTop: "15px", textAlign: "center", color: "red" }}>
            {error}
          </p>
        )}

        <p className="register-text">
          Remembered your password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;