import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Edit3,
  FileText,
  ImagePlus,
  Loader2,
  Newspaper,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import "./AdminCurrentAffairs.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

const CATEGORIES = [
  "National",
  "International",
  "Economy",
  "Science & Technology",
  "Sports",
  "Awards & Honours",
  "Appointments",
  "Defence",
  "Environment",
  "Government Schemes",
  "Reports & Indexes",
  "Important Days",
  "Himachal Pradesh",
  "Other",
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCurrentAffairs() {
  const { adminKey } = useOutletContext();
  const fileInputRef = useRef(null);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getToday());
  const [category, setCategory] = useState("National");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [keyPoints, setKeyPoints] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImageUrl, setExistingImageUrl] =
    useState("");

  const [editingId, setEditingId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  // =====================================================
  // LOAD CURRENT AFFAIRS
  // =====================================================
  async function loadEntries() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/current-affairs`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load current affairs."
        );
      }

      const data = await response.json();

      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(
        "Current affairs loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load current affairs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  // =====================================================
  // IMAGE PREVIEW CLEANUP
  // =====================================================
  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // =====================================================
  // RESET FORM
  // =====================================================
  function resetForm() {
    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setTitle("");
    setDate(getToday());
    setCategory("National");
    setSummary("");
    setContent("");
    setKeyPoints("");

    setImageFile(null);
    setImagePreview("");
    setExistingImageUrl("");

    setEditingId(null);
    setSubmitError("");
    setSuccessMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // =====================================================
  // SELECT IMAGE
  // =====================================================
  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSubmitError(
        "Only JPG, PNG and WEBP images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError(
        "Image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
    setSubmitError("");
    setSuccessMessage("");
  }

  // =====================================================
  // REMOVE SELECTED / EXISTING IMAGE
  // =====================================================
  function handleRemoveImage() {
    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");
    setExistingImageUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // =====================================================
  // UPLOAD IMAGE TO CLOUDINARY THROUGH BACKEND
  // =====================================================
  async function uploadImage() {
    if (!imageFile) {
      return existingImageUrl || "";
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch(
        `${API_BASE}/api/current-affairs/upload-image`,
        {
          method: "POST",
          headers: {
            "x-admin-key": adminKey,
          },
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        throw new Error(
          "Admin key rejected. Lock the dashboard and enter it again."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Image upload failed."
        );
      }

      return data.imageUrl;
    } finally {
      setUploadingImage(false);
    }
  }

  // =====================================================
  // ADD / UPDATE ARTICLE
  // =====================================================
  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !title.trim() ||
      !date ||
      !category ||
      !summary.trim() ||
      !content.trim()
    ) {
      setSubmitError(
        "Please complete all required fields."
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      setSuccessMessage("");

      const finalImageUrl = await uploadImage();

      const isEditing = editingId !== null;

      const endpoint = isEditing
        ? `${API_BASE}/api/current-affairs/${editingId}`
        : `${API_BASE}/api/current-affairs`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },

        body: JSON.stringify({
          title: title.trim(),
          date,
          category,
          imageUrl: finalImageUrl,
          summary: summary.trim(),
          content: content.trim(),
          keyPoints: keyPoints.trim(),
        }),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        throw new Error(
          "Admin key rejected. Lock the dashboard and enter it again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            (isEditing
              ? "Failed to update current affair."
              : "Failed to publish current affair.")
        );
      }

      resetForm();

      setSuccessMessage(
        isEditing
          ? "Current affair updated successfully."
          : "Current affair published successfully."
      );

      await loadEntries();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Save current affair error:",
        err
      );

      setSubmitError(
        err.message ||
          "Something went wrong while saving."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================================
  // EDIT
  // =====================================================
  function handleEdit(entry) {
    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setEditingId(entry.id);

    setTitle(entry.title || "");
    setDate(
      entry.date
        ? String(entry.date).slice(0, 10)
        : getToday()
    );

    setCategory(entry.category || "National");
    setSummary(entry.summary || "");
    setContent(entry.content || "");
    setKeyPoints(entry.keyPoints || "");

    setImageFile(null);
    setExistingImageUrl(entry.imageUrl || "");
    setImagePreview(entry.imageUrl || "");

    setSubmitError("");
    setSuccessMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // DELETE
  // =====================================================
  async function handleDelete(entry) {
    const confirmed = window.confirm(
      `Delete "${entry.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `${API_BASE}/api/current-affairs/${entry.id}`,
        {
          method: "DELETE",

          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        throw new Error(
          "Admin key rejected."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete current affair."
        );
      }

      if (editingId === entry.id) {
        resetForm();
      }

      setEntries((current) =>
        current.filter(
          (item) => item.id !== entry.id
        )
      );

      setSuccessMessage(
        "Current affair deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete current affair error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete current affair."
      );
    }
  }

  const activeImage =
    imagePreview || existingImageUrl;

  return (
    <div className="admin-ca-page">
      {/* ================= HEADER ================= */}

      <section className="admin-ca-hero">
        <div>
          <div className="admin-ca-eyebrow">
            <Sparkles size={16} />
            CONTENT MANAGEMENT
          </div>

          <h1>Current Affairs</h1>

          <p>
            Create exam-focused current affairs with
            images, detailed explanations and important
            revision points.
          </p>
        </div>

        <div className="admin-ca-hero-stat">
          <Newspaper size={24} />

          <div>
            <strong>{entries.length}</strong>
            <span>Published Articles</span>
          </div>
        </div>
      </section>

      {successMessage && (
        <div className="admin-ca-success">
          <CheckCircle2 size={19} />
          {successMessage}
        </div>
      )}

      {/* ================= FORM ================= */}

      <form
        className="admin-ca-editor"
        onSubmit={handleSubmit}
      >
        <div className="admin-ca-editor-heading">
          <div className="admin-ca-editor-icon">
            {editingId !== null ? (
              <Edit3 size={22} />
            ) : (
              <Plus size={22} />
            )}
          </div>

          <div>
            <h2>
              {editingId !== null
                ? "Edit Current Affair"
                : "Create Current Affair"}
            </h2>

            <p>
              Fields marked with * are required.
            </p>
          </div>
        </div>

        <div className="admin-ca-form-grid">
          {/* LEFT COLUMN */}

          <div className="admin-ca-form-main">
            <label className="admin-ca-field">
              <span>
                Article Title <b>*</b>
              </span>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="e.g. ISRO successfully launches new satellite"
                maxLength={500}
                required
              />

              <small>
                {title.length}/500 characters
              </small>
            </label>

            <div className="admin-ca-two-fields">
              <label className="admin-ca-field">
                <span>
                  <CalendarDays size={16} />
                  Published Date <b>*</b>
                </span>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  required
                />
              </label>

              <label className="admin-ca-field">
                <span>
                  Category <b>*</b>
                </span>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  required
                >
                  {CATEGORIES.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="admin-ca-field">
              <span>
                Short Summary <b>*</b>
              </span>

              <textarea
                value={summary}
                onChange={(e) =>
                  setSummary(e.target.value)
                }
                placeholder="Write a short, exam-relevant introduction. This will appear on the article card."
                rows={4}
                required
              />

              <small>
                Keep this short and useful for quick
                revision.
              </small>
            </label>

            <label className="admin-ca-field">
              <span>
                <FileText size={16} />
                Full Article <b>*</b>
              </span>

              <textarea
                className="admin-ca-content-input"
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
                placeholder={`Explain the current affair in detail.

You can use separate paragraphs for better readability.`}
                rows={12}
                required
              />

              <small>
                Use separate paragraphs to make the
                article easier to read.
              </small>
            </label>

            <label className="admin-ca-field">
              <span>
                Exam Key Points
              </span>

              <textarea
                value={keyPoints}
                onChange={(e) =>
                  setKeyPoints(e.target.value)
                }
                placeholder={`Write one important point per line.

Example:
Launch vehicle: PSLV-C58
Organisation: ISRO
Launch site: Sriharikota
Mission objective: Study the Sun`}
                rows={7}
              />

              <small>
                Write one fact per line. These will be
                displayed as revision points.
              </small>
            </label>
          </div>

          {/* RIGHT COLUMN */}

          <aside className="admin-ca-form-side">
            <div className="admin-ca-image-panel">
              <div className="admin-ca-image-heading">
                <Camera size={18} />

                <div>
                  <strong>Featured Image</strong>
                  <span>
                    JPG, PNG or WEBP • Max 5 MB
                  </span>
                </div>
              </div>

              {activeImage ? (
                <div className="admin-ca-image-preview">
                  <img
                    src={activeImage}
                    alt="Current affair preview"
                  />

                  <button
                    type="button"
                    className="admin-ca-remove-image"
                    onClick={handleRemoveImage}
                    title="Remove image"
                  >
                    <X size={18} />
                  </button>

                  {imageFile && (
                    <div className="admin-ca-new-image-badge">
                      New image
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="admin-ca-image-drop"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <div className="admin-ca-upload-circle">
                    <ImagePlus size={28} />
                  </div>

                  <strong>
                    Choose Featured Image
                  </strong>

                  <span>
                    Click to select an image from your
                    computer
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                hidden
              />

              {activeImage && (
                <button
                  type="button"
                  className="admin-ca-change-image"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <UploadCloud size={17} />
                  Change Image
                </button>
              )}
            </div>

            <div className="admin-ca-tips">
              <Sparkles size={18} />

              <div>
                <strong>
                  Make it exam-friendly
                </strong>

                <p>
                  Focus on names, dates, organisations,
                  places, reports, schemes and facts that
                  can become exam questions.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {submitError && (
          <div className="admin-ca-submit-error">
            {submitError}
          </div>
        )}

        <div className="admin-ca-form-actions">
          <button
            type="submit"
            className="admin-ca-save-btn"
            disabled={
              submitting || uploadingImage
            }
          >
            {submitting || uploadingImage ? (
              <>
                <Loader2
                  size={18}
                  className="admin-ca-spinner"
                />

                {uploadingImage
                  ? "Uploading Image..."
                  : "Saving..."}
              </>
            ) : (
              <>
                <Save size={18} />

                {editingId !== null
                  ? "Update Article"
                  : "Publish Article"}
              </>
            )}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="admin-ca-cancel-btn"
              onClick={resetForm}
              disabled={submitting}
            >
              <RotateCcw size={17} />
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* ================= ARTICLES ================= */}

      <section className="admin-ca-library">
        <div className="admin-ca-library-header">
          <div>
            <h2>Published Current Affairs</h2>

            <p>
              Manage articles visible to students.
            </p>
          </div>

          <span className="admin-ca-count">
            {entries.length}{" "}
            {entries.length === 1
              ? "Article"
              : "Articles"}
          </span>
        </div>

        {loading && (
          <div className="admin-ca-state">
            <Loader2
              size={24}
              className="admin-ca-spinner"
            />
            Loading current affairs...
          </div>
        )}

        {error && (
          <div className="admin-ca-state admin-ca-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          entries.length === 0 && (
            <div className="admin-ca-empty">
              <Newspaper size={38} />

              <h3>No Current Affairs Yet</h3>

              <p>
                Publish your first article using the
                editor above.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          entries.length > 0 && (
            <div className="admin-ca-articles">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className={`admin-ca-article-card ${
                    editingId === entry.id
                      ? "admin-ca-article-editing"
                      : ""
                  }`}
                >
                  <div className="admin-ca-card-image">
                    {entry.imageUrl ? (
                      <img
                        src={entry.imageUrl}
                        alt={entry.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="admin-ca-card-placeholder">
                        <Newspaper size={30} />
                      </div>
                    )}

                    <span className="admin-ca-category-badge">
                      {entry.category ||
                        "Current Affairs"}
                    </span>
                  </div>

                  <div className="admin-ca-card-body">
                    <div className="admin-ca-card-date">
                      <CalendarDays size={14} />
                      {formatDate(entry.date)}
                    </div>

                    <h3>{entry.title}</h3>

                    <p>
                      {entry.summary ||
                        "No summary available."}
                    </p>

                    <div className="admin-ca-card-actions">
                      <button
                        type="button"
                        className="admin-ca-edit-btn"
                        onClick={() =>
                          handleEdit(entry)
                        }
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-ca-delete-btn"
                        onClick={() =>
                          handleDelete(entry)
                        }
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}