import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import "./AdminFAQ.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const emptyForm = {
  question: "",
  answer: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminFAQ() {
  const { adminKey } = useOutletContext();

  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadFaqs() {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/faq/admin/all`, {
        headers: {
          "x-admin-key": adminKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load FAQs");
      }

      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) {
      loadFaqs();
    }
  }, [adminKey]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startEdit(faq) {
    setEditingId(faq.id);

    setForm({
      question: faq.question || "",
      answer: faq.answer || "",
      isActive: Boolean(faq.isActive),
      sortOrder: faq.sortOrder ?? 0,
    });

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.question.trim() || !form.answer.trim()) {
      setMessage("Question and answer are required.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const url = editingId
        ? `${API_BASE}/api/faq/${editingId}`
        : `${API_BASE}/api/faq`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          question: form.question.trim(),
          answer: form.answer.trim(),
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save FAQ");
      }

      setMessage(
        editingId
          ? "FAQ updated successfully."
          : "FAQ added successfully."
      );

      setEditingId(null);
      setForm(emptyForm);

      await loadFaqs();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFaq(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this FAQ?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/faq/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": adminKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete FAQ");
      }

      setFaqs((current) =>
        current.filter((faq) => faq.id !== id)
      );

      setMessage("FAQ deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="admin-faq-page">
      <div className="admin-faq-heading">
        <div>
          <span className="admin-faq-label">CONTENT</span>
          <h1>FAQ Management</h1>
          <p>Add and manage frequently asked questions.</p>
        </div>
      </div>

      <form className="admin-faq-form" onSubmit={handleSubmit}>
        <div className="admin-faq-form-title">
          <h2>{editingId ? "Edit FAQ" : "Add FAQ"}</h2>

          {editingId && (
            <button
              type="button"
              className="admin-faq-cancel"
              onClick={cancelEdit}
            >
              <X size={17} />
              Cancel
            </button>
          )}
        </div>

        <label>
          Question
          <input
            type="text"
            name="question"
            value={form.question}
            onChange={handleChange}
            placeholder="Enter question"
          />
        </label>

        <label>
          Answer
          <textarea
            name="answer"
            value={form.answer}
            onChange={handleChange}
            rows="5"
            placeholder="Enter answer"
          />
        </label>

        <div className="admin-faq-small-fields">
          <label>
            Order
            <input
              type="number"
              name="sortOrder"
              min="0"
              value={form.sortOrder}
              onChange={handleChange}
            />
          </label>

          <label className="admin-faq-checkbox">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        <button
          className="admin-faq-save"
          type="submit"
          disabled={saving}
        >
          <Plus size={18} />
          {saving
            ? "Saving..."
            : editingId
              ? "Update FAQ"
              : "Add FAQ"}
        </button>

        {message && (
          <div className="admin-faq-message">{message}</div>
        )}
      </form>

      <div className="admin-faq-list">
        <div className="admin-faq-list-heading">
          <h2>FAQs</h2>
          <span>{faqs.length} total</span>
        </div>

        {loading ? (
          <div className="admin-faq-empty">Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className="admin-faq-empty">
            No FAQs added yet.
          </div>
        ) : (
          faqs.map((faq) => (
            <article className="admin-faq-card" key={faq.id}>
              <div className="admin-faq-card-content">
                <div className="admin-faq-card-meta">
                  <span>Order {faq.sortOrder}</span>

                  <span
                    className={
                      faq.isActive
                        ? "faq-status active"
                        : "faq-status inactive"
                    }
                  >
                    {faq.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>

              <div className="admin-faq-actions">
                <button
                  type="button"
                  onClick={() => startEdit(faq)}
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  type="button"
                  className="delete"
                  onClick={() => deleteFaq(faq.id)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}