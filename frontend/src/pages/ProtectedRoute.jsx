import { Navigate } from "react-router-dom";

// Wrap any route's element with <ProtectedRoute> to require login first.
// If no token is found in localStorage, the user is redirected to /login.
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("dishaToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}