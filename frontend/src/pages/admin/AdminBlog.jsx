import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ArticleBody from "../../components/ArticleBody";
import "./AdminBlog.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const emptyForm = {
  title: "",
  category: "",
  summary: "",
  content: "",
  author: "Disha The Academy",
  date: new Date().toISOString().split("T")[0],
  status: "Published",
  imageUrl: "",
};

const TABLE_TEMPLATE =
  "| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Data | Data | Data |\n| Data | Data | Data |";

// toolbar buttons: what each one writes into the article text
const TOOLS = [
  { key: "h2", label: "H2", title: "Main heading", prefix: "## " },
  { key: "h3", label: "H3", title: "Sub heading", prefix: "### " },
  { key: "b", label: "B", title: "Bold", wrap: "**" },
  { key: "i", label: "I", title: "Italic", wrap: "*" },
  { key: "ul", label: "\u2022 List", title: "Bullet list", prefix: "- " },
  { key: "ol", label: "1. List", title: "Numbered list", prefix: "1. " },
  { key: "quote", label: "Quote", title: "Quote / important note", prefix: "> " },
  { key: "table", label: "Table", title: "Insert a table", insert: TABLE_TEMPLATE },
  { key: "link", label: "Link", title: "Link", link: true },
  { key: "hr", label: "Line", title: "Divider line", insert: "---" },
];

export default function AdminBlog() {
  const { adminToken } = useOutletContext();

  const contentRef = useRef(null);
  const [contentView, setContentView] = useState("write"); // write | preview

  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/blog/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load blogs");
      }

      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }

  async function uploadImage() {
    if (!imageFile) {
      return form.imageUrl;
    }

    const imageData = new FormData();
    imageData.append("image", imageFile);

    setUploading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/blog/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: imageData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed");
      }

      return data.imageUrl;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      let imageUrl = form.imageUrl;

      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const payload = {
        ...form,
        imageUrl,
      };

      const url = editingId
        ? `${API_BASE}/api/blog/${editingId}`
        : `${API_BASE}/api/blog`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save blog");
      }

      setMessage(
        editingId
          ? "Blog updated successfully."
          : "Blog published successfully."
      );

      resetForm();
      await loadBlogs();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // write the formatting symbols around the selected text
  function applyTool(tool) {
    const box = contentRef.current;
    const text = form.content || "";
    const start = box ? box.selectionStart : text.length;
    const end = box ? box.selectionEnd : text.length;
    const selected = text.slice(start, end);

    let next = text;
    let caretStart = start;
    let caretEnd = end;

    if (tool.wrap) {
      const inner = selected || "text";
      next = text.slice(0, start) + tool.wrap + inner + tool.wrap + text.slice(end);
      caretStart = start + tool.wrap.length;
      caretEnd = caretStart + inner.length;
    } else if (tool.link) {
      const label = selected || "link text";
      next = text.slice(0, start) + `[${label}](https://)` + text.slice(end);
      caretStart = start + label.length + 3;
      caretEnd = caretStart + 8;
    } else if (tool.insert) {
      const before = start > 0 && text[start - 1] !== "\n" ? "\n" : "";
      const block = `${before}${tool.insert}\n`;
      next = text.slice(0, start) + block + text.slice(end);
      caretStart = caretEnd = start + block.length;
    } else if (tool.prefix) {
      // every selected line gets the symbol (a lone cursor = its own line)
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const lineEndRaw = text.indexOf("\n", end);
      const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
      const lines = text.slice(lineStart, lineEnd).split("\n");
      let n = 0;
      const changed = lines.map((line) => {
        const clean = line.replace(/^(#{1,4}\s+|[-*]\s+|\d+[.)]\s+|>\s?)/, "");
        if (!clean.trim()) return line;
        n += 1;
        return (tool.key === "ol" ? `${n}. ` : tool.prefix) + clean;
      });
      next = text.slice(0, lineStart) + changed.join("\n") + text.slice(lineEnd);
      caretStart = lineStart;
      caretEnd = lineStart + changed.join("\n").length;
    }

    setForm((f) => ({ ...f, content: next }));
    setContentView("write");

    requestAnimationFrame(() => {
      const el = contentRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(caretStart, caretEnd);
      }
    });
  }

  function startEdit(blog) {
    setEditingId(blog.id);

    setForm({
      title: blog.title || "",
      category: blog.category || "",
      summary: blog.summary || "",
      content: blog.content || "",
      author: blog.author || "Disha The Academy",
      date: blog.date
        ? String(blog.date).split("T")[0]
        : "",
      status: blog.status || "Published",
      imageUrl: blog.imageUrl || "",
    });

    setImageFile(null);
    setPreview(blog.imageUrl || "");
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      date: new Date().toISOString().split("T")[0],
    });

    setImageFile(null);
    setPreview("");
  }

  async function deleteBlog(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this blog?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE}/api/blog/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete blog");
      }

      setBlogs((previous) =>
        previous.filter((blog) => blog.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setMessage("Blog deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  return (
    <div className="admin-blog-page">
      <div className="admin-blog-heading">
        <div>
          <span className="admin-blog-eyebrow">
            CONTENT MANAGEMENT
          </span>

          <h1>Blog Management</h1>

          <p>
            Create educational articles, preparation guides,
            exam strategies and useful resources for students.
          </p>
        </div>

        <div className="admin-blog-count">
          <strong>{blogs.length}</strong>
          <span>Total Blogs</span>
        </div>
      </div>

      {message && (
        <div className="admin-blog-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-blog-message error">
          {error}
        </div>
      )}

      <div className="admin-blog-grid">
        {/* FORM */}

        <section className="admin-blog-form-card">
          <div className="admin-blog-card-heading">
            <div>
              <span>
                {editingId ? "EDIT ARTICLE" : "NEW ARTICLE"}
              </span>

              <h2>
                {editingId
                  ? "Update Blog"
                  : "Create New Blog"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                className="admin-blog-cancel"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-blog-field">
              <label>Blog Title *</label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter an attractive blog title"
                required
              />
            </div>

            <div className="admin-blog-two">
              <div className="admin-blog-field">
                <label>Category</label>

                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Exam Preparation"
                />
              </div>

              <div className="admin-blog-field">
                <label>Published Date *</label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="admin-blog-two">
              <div className="admin-blog-field">
                <label>Author</label>

                <input
                  type="text"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Disha The Academy"
                />
              </div>

              <div className="admin-blog-field">
                <label>Status</label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Published">
                    Published
                  </option>

                  <option value="Draft">
                    Draft
                  </option>
                </select>
              </div>
            </div>

            <div className="admin-blog-field">
              <label>Short Summary *</label>

              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                rows="4"
                placeholder="Write a short introduction for the blog card..."
                required
              />
            </div>

            <div className="admin-blog-field">
              <label>Featured Image</label>

              <div className="admin-blog-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                />

                <small>
                  JPG, PNG or WEBP • Maximum 5 MB
                </small>
              </div>

              {(preview || form.imageUrl) && (
                <div className="admin-blog-preview">
                  <img
                    src={preview || form.imageUrl}
                    alt="Blog preview"
                  />
                </div>
              )}
            </div>

            <div className="admin-blog-field">
              <label>Full Blog Content *</label>

              <div className="admin-blog-tabs">
                <button type="button" className={contentView === "write" ? "on" : ""} onClick={() => setContentView("write")}>Write</button>
                <button type="button" className={contentView === "preview" ? "on" : ""} onClick={() => setContentView("preview")}>Preview</button>
              </div>

              {contentView === "write" && (
                <div className="admin-blog-tools" role="toolbar" aria-label="Formatting">
                  {TOOLS.map((tool) => (
                    <button key={tool.key} type="button" title={tool.title} onClick={() => applyTool(tool)}>
                      {tool.label}
                    </button>
                  ))}
                </div>
              )}

              {contentView === "write" ? (
                <textarea
                  ref={contentRef}
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows="16"
                  placeholder={"Write the complete article here.\n\n## Heading\nA normal paragraph.\n- bullet point\n\nYou can also paste a table copied from Word or Excel."}
                  required
                />
              ) : (
                <div className="admin-blog-live">
                  {form.content.trim() ? <ArticleBody text={form.content} /> : <p className="admin-blog-live-empty">Nothing to preview yet.</p>}
                </div>
              )}

              <p className="admin-blog-help">
                Use the buttons above to make headings, lists, quotes and tables. A table copied from Word or Excel
                is turned into a proper table automatically. Check "Preview" to see how readers will see it.
              </p>
            </div>

            <button
              className="admin-blog-submit"
              type="submit"
              disabled={saving || uploading}
            >
              {uploading
                ? "Uploading Image..."
                : saving
                ? "Saving Blog..."
                : editingId
                ? "Update Blog"
                : form.status === "Draft"
                ? "Save Draft"
                : "Publish Blog"}
            </button>
          </form>
        </section>

        {/* BLOG LIST */}

        <section className="admin-blog-list-card">
          <div className="admin-blog-card-heading">
            <div>
              <span>BLOG LIBRARY</span>
              <h2>Your Articles</h2>
            </div>
          </div>

          {loading ? (
            <div className="admin-blog-empty">
              Loading blogs...
            </div>
          ) : blogs.length === 0 ? (
            <div className="admin-blog-empty">
              <div>✦</div>
              <h3>No Blogs Yet</h3>
              <p>
                Your first blog will appear here after you
                create it.
              </p>
            </div>
          ) : (
            <div className="admin-blog-list">
              {blogs.map((blog) => (
                <article
                  className="admin-blog-item"
                  key={blog.id}
                >
                  <div className="admin-blog-item-image">
                    {blog.imageUrl ? (
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                      />
                    ) : (
                      <div className="admin-blog-no-image">
                        BLOG
                      </div>
                    )}

                    <span
                      className={`admin-blog-status ${
                        blog.status === "Draft"
                          ? "draft"
                          : "published"
                      }`}
                    >
                      {blog.status}
                    </span>
                  </div>

                  <div className="admin-blog-item-content">
                    <div className="admin-blog-item-meta">
                      <span>
                        {blog.category || "General"}
                      </span>

                      <span>
                        {blog.date
                          ? new Date(
                              blog.date
                            ).toLocaleDateString("en-IN")
                          : ""}
                      </span>
                    </div>

                    <h3>{blog.title}</h3>

                    <p>{blog.summary}</p>

                    <div className="admin-blog-author">
                      By{" "}
                      {blog.author ||
                        "Disha The Academy"}
                    </div>

                    <div className="admin-blog-actions">
                      <button
                        type="button"
                        className="edit"
                        onClick={() => startEdit(blog)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete"
                        onClick={() =>
                          deleteBlog(blog.id)
                        }
                      >
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
    </div>
  );
}