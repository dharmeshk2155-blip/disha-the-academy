import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Save,
  RefreshCw,
  FileText,
  Target,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import "./AdminAbout.css";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5000"
  : import.meta.env.VITE_API_BASE ||
    "https://disha-the-academy.onrender.com";

const EMPTY_FORM = {
  title: "",
  introduction: "",
  content: "",
  mission: "",
  vision: "",
  isActive: true,
};

function AdminAbout() {
  const { adminToken } = useOutletContext();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAboutPage = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE}/api/about/admin`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load About page");
      }

      if (data.page) {
        setForm({
          title: data.page.title || "",
          introduction: data.page.introduction || "",
          content: data.page.content || "",
          mission: data.page.mission || "",
          vision: data.page.vision || "",
          isActive: Boolean(data.page.isActive),
        });

        setLastUpdated(data.page.updatedAt || data.page.createdAt || null);
      } else {
        setForm(EMPTY_FORM);
        setLastUpdated(null);
      }
    } catch (err) {
      console.error("Load About page error:", err);
      setError(err.message || "Unable to load About page");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAboutPage();
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

    if (!form.title.trim()) {
      setError("Page title is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE}/api/about`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          introduction: form.introduction.trim(),
          content: form.content.trim(),
          mission: form.mission.trim(),
          vision: form.vision.trim(),
          isActive: form.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save About page");
      }

      setMessage("About page saved successfully.");

      if (data.page) {
        setForm({
          title: data.page.title || "",
          introduction: data.page.introduction || "",
          content: data.page.content || "",
          mission: data.page.mission || "",
          vision: data.page.vision || "",
          isActive: Boolean(data.page.isActive),
        });

        setLastUpdated(data.page.updatedAt || data.page.createdAt || null);
      }
    } catch (err) {
      console.error("Save About page error:", err);
      setError(err.message || "Unable to save About page");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "Not saved yet";

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
      <div className="admin-about-loading">
        <RefreshCw size={26} className="admin-about-spin" />
        <p>Loading About page...</p>
      </div>
    );
  }

  return (
    <div className="admin-about-page">
      <div className="admin-about-header">
        <div>
          <span className="admin-about-eyebrow">Website Pages</span>
          <h1>About Us</h1>
          <p>
            Manage the content displayed on the Disha The Academy About page.
          </p>
        </div>

        <button
          type="button"
          className="admin-about-refresh"
          onClick={loadAboutPage}
          disabled={saving}
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="admin-about-status-grid">
        <div className="admin-about-status-card">
          <div className="admin-about-status-icon">
            <FileText size={22} />
          </div>

          <div>
            <span>Page</span>
            <strong>About Us</strong>
          </div>
        </div>

        <div className="admin-about-status-card">
          <div className="admin-about-status-icon">
            <Eye size={22} />
          </div>

          <div>
            <span>Status</span>
            <strong>{form.isActive ? "Published" : "Hidden"}</strong>
          </div>
        </div>

        <div className="admin-about-status-card">
          <div className="admin-about-status-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Last Updated</span>
            <strong>{formatDate(lastUpdated)}</strong>
          </div>
        </div>
      </div>

      {message && (
        <div className="admin-about-alert success">
          <CheckCircle2 size={19} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="admin-about-alert error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      <form className="admin-about-form" onSubmit={handleSubmit}>
        <div className="admin-about-section">
          <div className="admin-about-section-heading">
            <div className="admin-about-section-icon">
              <FileText size={21} />
            </div>

            <div>
              <h2>General Content</h2>
              <p>Main information shown on the About Us page.</p>
            </div>
          </div>

          <div className="admin-about-field">
            <label htmlFor="about-title">
              Page Title <span>*</span>
            </label>

            <input
              id="about-title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="About Disha The Academy"
              maxLength={300}
            />
          </div>

          <div className="admin-about-field">
            <label htmlFor="about-introduction">Short Introduction</label>

            <textarea
              id="about-introduction"
              name="introduction"
              value={form.introduction}
              onChange={handleChange}
              placeholder="Write a short introduction about Disha The Academy..."
              rows={4}
            />
          </div>

          <div className="admin-about-field">
            <label htmlFor="about-content">Main Content</label>

            <textarea
              id="about-content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write the main About Us content here..."
              rows={9}
            />
          </div>
        </div>

        <div className="admin-about-section">
          <div className="admin-about-section-heading">
            <div className="admin-about-section-icon">
              <Target size={21} />
            </div>

            <div>
              <h2>Mission & Vision</h2>
              <p>Explain the purpose and future direction of the platform.</p>
            </div>
          </div>

          <div className="admin-about-two-columns">
            <div className="admin-about-field">
              <label htmlFor="about-mission">Our Mission</label>

              <textarea
                id="about-mission"
                name="mission"
                value={form.mission}
                onChange={handleChange}
                placeholder="What is the mission of Disha The Academy?"
                rows={7}
              />
            </div>

            <div className="admin-about-field">
              <label htmlFor="about-vision">Our Vision</label>

              <textarea
                id="about-vision"
                name="vision"
                value={form.vision}
                onChange={handleChange}
                placeholder="What is the vision of Disha The Academy?"
                rows={7}
              />
            </div>
          </div>
        </div>

        <div className="admin-about-publish">
          <div>
            <h3>Page Visibility</h3>
            <p>
              When enabled, this About page can be displayed on the public
              website.
            </p>
          </div>

          <label className="admin-about-switch">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />

            <span className="admin-about-slider" />

            <strong>{form.isActive ? "Published" : "Hidden"}</strong>
          </label>
        </div>

        <div className="admin-about-actions">
          <button
            type="submit"
            className="admin-about-save"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw size={19} className="admin-about-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={19} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminAbout;