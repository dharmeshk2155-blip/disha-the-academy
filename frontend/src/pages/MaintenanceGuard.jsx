import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./MaintenanceGuard.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

export default function MaintenanceGuard() {
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [siteName, setSiteName] = useState("Disha The Academy");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings`);

        if (!response.ok) {
          throw new Error("Unable to load website settings");
        }

        const data = await response.json();

        if (data.success && data.settings) {
          setMaintenanceMode(
            Boolean(data.settings.maintenanceMode)
          );

          setSiteName(
            data.settings.siteName || "Disha The Academy"
          );
        }
      } catch (error) {
        console.error("Maintenance settings error:", error);

        // Fail open:
        // API failure should not accidentally take the website offline.
        setMaintenanceMode(false);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="maintenance-loading">
        <div className="maintenance-loading-spinner" />
      </div>
    );
  }

  if (maintenanceMode) {
    return (
      <main className="maintenance-page">
        <div className="maintenance-card">
          <div className="maintenance-logo">
            D
          </div>

          <span className="maintenance-badge">
            WEBSITE MAINTENANCE
          </span>

          <h1>We'll Be Back Shortly</h1>

          <p className="maintenance-main-text">
            We're making things better. {siteName} is
            currently under maintenance.
          </p>

          <div className="maintenance-warning">
            Please do not make any purchases while
            maintenance is in progress.
          </div>

          <div className="maintenance-divider" />

          <p className="maintenance-small-text">
            Our team is working on improvements to give
            you a better learning experience.
          </p>

          <strong className="maintenance-brand">
            {siteName}
          </strong>
        </div>
      </main>
    );
  }

  return <Outlet />;
}