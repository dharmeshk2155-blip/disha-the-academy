import { useNavigate } from "react-router-dom";

function Account() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem("dishaUser");

  let user = null;

  try {
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error("User data error:", error);
  }

  // Agar login nahi hai
  if (!user) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <h1>Please Login</h1>

          <p>
            You need to login to view your account.
          </p>

          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "12px 25px",
              border: "none",
              borderRadius: "8px",
              background: "#f5b82e",
              color: "#071a49",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("dishaUser");

    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "white",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
        }}
      >

        <h1
          style={{
            textAlign: "center",
            color: "#071a49",
            marginBottom: "35px",
          }}
        >
          My Account
        </h1>

        {/* PROFILE ICON */}
        <div
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            background: "#f5b82e",
            color: "#071a49",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            fontWeight: "700",
            margin: "0 auto 30px",
          }}
        >
          {user.fullName
            ? user.fullName.charAt(0).toUpperCase()
            : "U"}
        </div>

        {/* NAME */}
        <div style={{ marginBottom: "20px" }}>
          <strong>Full Name</strong>

          <p
            style={{
              marginTop: "6px",
              fontSize: "18px",
            }}
          >
            {user.fullName}
          </p>
        </div>

        {/* EMAIL */}
        <div style={{ marginBottom: "20px" }}>
          <strong>Email Address</strong>

          <p
            style={{
              marginTop: "6px",
              fontSize: "18px",
            }}
          >
            {user.email}
          </p>
        </div>

        {/* MOBILE */}
        <div style={{ marginBottom: "30px" }}>
          <strong>Mobile Number</strong>

          <p
            style={{
              marginTop: "6px",
              fontSize: "18px",
            }}
          >
            {user.mobile}
          </p>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "8px",
            background: "#071a49",
            color: "white",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default Account;