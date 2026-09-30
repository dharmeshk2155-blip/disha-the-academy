import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Settings,
  Save,
  RefreshCw,
  Globe2,
  Mail,
  Phone,
  Wrench,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import "./AdminSettings.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

const DEFAULT_SETTINGS = {
  siteName: "Disha The Academy",
  tagline: "",
  supportEmail: "",
  supportPhone: "",
  maintenanceMode: false,
  notesSalesEnabled: true,
};

export default function AdminSettings() {
  const { adminToken } = useOutletContext();

  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/api/settings/admin`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load settings");
      }

      if (data.settings) {
        setForm({
          siteName: data.settings.siteName || "",
          tagline: data.settings.tagline || "",
          supportEmail: data.settings.supportEmail || "",
          supportPhone: data.settings.supportPhone || "",
          maintenanceMode: Boolean(data.settings.maintenanceMode),
          notesSalesEnabled: Boolean(data.settings.notesSalesEnabled),
        });

        setLastUpdated(
          data.settings.updatedAt || data.settings.createdAt || null
        );
      }
    } catch (err) {
      console.error("Load settings error:", err);
      setError(err.message || "Unable to load website settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [adminToken]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.siteName.trim()) {
      setError("Site name is required.");
      return;
    }

    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const response = await fetch(`${API_BASE}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          siteName: form.siteName.trim(),
          tagline: form.tagline.trim(),
          supportEmail: form.supportEmail.trim(),
          supportPhone: form.supportPhone.trim(),
          maintenanceMode: form.maintenanceMode,
          notesSalesEnabled: form.notesSalesEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save settings");
      }

      setSuccess("Website settings saved successfully.");

      if (data.settings) {
        setLastUpdated(
          data.settings.updatedAt || data.settings.createdAt || null
        );
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setError(err.message || "Unable to save website settings.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "Not updated yet";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="admin-settings-loading">
        <RefreshCw className="admin-settings-spin" size={28} />
        <p>Loading website settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <div>
          <span className="admin-settings-eyebrow">
            Website Configuration
          </span>

          <h1>Settings</h1>

          <p>
            Manage the main configuration and availability of Disha The
            Academy.
          </p>
        </div>

        <button
          type="button"
          className="admin-settings-refresh"
          onClick={loadSettings}
          disabled={saving}
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="admin-settings-summary">
        <div className="admin-settings-summary-card">
          <div className="admin-settings-summary-icon">
            <Globe2 size={22} />
          </div>

          <div>
            <span>Website</span>
            <strong>{form.siteName || "Disha The Academy"}</strong>
          </div>
        </div>

        <div className="admin-settings-summary-card">
          <div className="admin-settings-summary-icon">
            <Wrench size={22} />
          </div>

          <div>
            <span>Website Status</span>
            <strong>
              {form.maintenanceMode ? "Maintenance" : "Live"}
            </strong>
          </div>
        </div>

        <div className="admin-settings-summary-card">
          <div className="admin-settings-summary-icon">
            <ShoppingBag size={22} />
          </div>

          <div>
            <span>Notes Sales</span>
            <strong>
              {form.notesSalesEnabled ? "Enabled" : "Disabled"}
            </strong>
          </div>
        </div>
      </div>

      {success && (
        <div className="admin-settings-alert success">
          <CheckCircle2 size={19} />
          {success}
        </div>
      )}

      {error && (
        <div className="admin-settings-alert error">
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      <form className="admin-settings-form" onSubmit={handleSubmit}>
        <section className="admin-settings-section">
          <div className="admin-settings-section-title">
            <div className="admin-settings-section-icon">
              <Globe2 size={21} />
            </div>

            <div>
              <h2>General Information</h2>
              <p>Basic information about your website.</p>
            </div>
          </div>

          <div className="admin-settings-field">
            <label htmlFor="siteName">Site Name *</label>

            <input
              id="siteName"
              name="siteName"
              value={form.siteName}
              onChange={handleChange}
              placeholder="Disha The Academy"
              maxLength={200}
            />
          </div>

          <div className="admin-settings-field">
            <label htmlFor="tagline">Tagline</label>

            <input
              id="tagline"
              name="tagline"
              value={form.tagline}
              onChange={handleChange}
              placeholder="Learn. Practice. Achieve."
              maxLength={500}
            />
          </div>
        </section>

        <section className="admin-settings-section">
          <div className="admin-settings-section-title">
            <div className="admin-settings-section-icon">
              <Mail size={21} />
            </div>

            <div>
              <h2>Support Details</h2>
              <p>Contact information students can use for support.</p>
            </div>
          </div>

          <div className="admin-settings-two-columns">
            <div className="admin-settings-field">
              <label htmlFor="supportEmail">
                <Mail size={15} />
                Support Email
              </label>

              <input
                id="supportEmail"
                type="email"
                name="supportEmail"
                value={form.supportEmail}
                onChange={handleChange}
                placeholder="support@dishatheacademy.com"
              />
            </div>

            <div className="admin-settings-field">
              <label htmlFor="supportPhone">
                <Phone size={15} />
                Support Phone
              </label>

              <input
                id="supportPhone"
                type="tel"
                name="supportPhone"
                value={form.supportPhone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                maxLength={30}
              />
            </div>
          </div>
        </section>

        <section className="admin-settings-section">
          <div className="admin-settings-section-title">
            <div className="admin-settings-section-icon">
              <Settings size={21} />
            </div>

            <div>
              <h2>Website Controls</h2>
              <p>Control important website features.</p>
            </div>
          </div>

          <div className="admin-settings-toggle-row">
            <div>
              <h3>Maintenance Mode</h3>
              <p>
                Temporarily mark the website as under maintenance.
              </p>
            </div>

            <label className="admin-settings-switch">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={form.maintenanceMode}
                onChange={handleChange}
              />

              <span className="admin-settings-slider" />

              <strong>
                {form.maintenanceMode ? "On" : "Off"}
              </strong>
            </label>
          </div>

          <div className="admin-settings-toggle-row">
            <div>
              <h3>Notes Sales</h3>
              <p>
                Enable or disable purchasing study notes from the website.
              </p>
            </div>

            <label className="admin-settings-switch">
              <input
                type="checkbox"
                name="notesSalesEnabled"
                checked={form.notesSalesEnabled}
                onChange={handleChange}
              />

              <span className="admin-settings-slider" />

              <strong>
                {form.notesSalesEnabled ? "Enabled" : "Disabled"}
              </strong>
            </label>
          </div>
        </section>

        <div className="admin-settings-footer">
          <span>
            Last updated: <strong>{formatDate(lastUpdated)}</strong>
          </span>

          <button
            type="submit"
            className="admin-settings-save"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw
                  size={19}
                  className="admin-settings-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={19} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}