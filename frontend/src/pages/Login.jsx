function Login() {
  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <span>D</span>isha The Academy
        </div>

        <h1>Welcome Back!</h1>
        <p className="login-subtitle">
          Login to continue your learning journey.
        </p>

        <form>
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="login-options">
            <label className="remember">
              <input type="checkbox" />
              Remember me
            </label>

            <a href="#">Forgot Password?</a>
          </div>

          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <a href="/register">Create Account</a>
        </p>

      </div>
    </div>
  );
}

export default Login;