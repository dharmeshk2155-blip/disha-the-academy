import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  FileQuestion,
  Clock3,
  Trophy,
  Pencil,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import "./AdminQuestions.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const INITIAL_FORM = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "1",

  questionTextHi: "",
  optionAHi: "",
  optionBHi: "",
  optionCHi: "",
  optionDHi: "",
};

function AdminQuestions() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { adminKey } = useOutletContext();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ---------------------------------------------------
  // LOAD QUESTIONS
  // ---------------------------------------------------

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/admin/tests/${encodeURIComponent(
          testId
        )}/questions`,
        {
          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load questions."
        );
      }

      setTest(data.test || null);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Load questions error:", err);

      setError(
        err.message || "Failed to load questions."
      );
    } finally {
      setLoading(false);
    }
  }, [adminKey, testId]);

  useEffect(() => {
    if (adminKey && testId) {
      fetchQuestions();
    }
  }, [adminKey, testId, fetchQuestions]);

  // ---------------------------------------------------
  // FORM
  // ---------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const openAddQuestion = () => {
  setEditingQuestionId(null);
  setForm(INITIAL_FORM);
  setFormError("");
  setSuccessMessage("");
  setShowModal(true);
};

 const closeModal = () => {
  if (saving) return;

  setShowModal(false);
  setEditingQuestionId(null);
  setForm(INITIAL_FORM);
  setFormError("");
  setSuccessMessage("");
};

  // ---------------------------------------------------
  // ADD QUESTION
  // ---------------------------------------------------

 const handleAddQuestion = async (event) => {
  event.preventDefault();

  if (saving) return;

  setFormError("");
  setSuccessMessage("");

  const cleanQuestionText = form.questionText.trim();
  const cleanOptionA = form.optionA.trim();
  const cleanOptionB = form.optionB.trim();
  const cleanOptionC = form.optionC.trim();
  const cleanOptionD = form.optionD.trim();

  if (
    !cleanQuestionText ||
    !cleanOptionA ||
    !cleanOptionB ||
    !cleanOptionC ||
    !cleanOptionD
  ) {
    setFormError(
      "Question and all four English options are required."
    );
    return;
  }

  const correctAnswer = Number(form.correctAnswer);

  if (
    !Number.isInteger(correctAnswer) ||
    correctAnswer < 1 ||
    correctAnswer > 4
  ) {
    setFormError("Please select the correct answer.");
    return;
  }

  try {
    setSaving(true);

    const payload = {
      questionText: cleanQuestionText,
      optionA: cleanOptionA,
      optionB: cleanOptionB,
      optionC: cleanOptionC,
      optionD: cleanOptionD,
      correctAnswer,

      questionTextHi: form.questionTextHi.trim(),
      optionAHi: form.optionAHi.trim(),
      optionBHi: form.optionBHi.trim(),
      optionCHi: form.optionCHi.trim(),
      optionDHi: form.optionDHi.trim(),
    };

    const isEditing = editingQuestionId !== null;

    const url = isEditing
      ? `${API_BASE}/api/admin/tests/${encodeURIComponent(
          testId
        )}/questions/${encodeURIComponent(
          editingQuestionId
        )}`
      : `${API_BASE}/api/admin/tests/${encodeURIComponent(
          testId
        )}/questions`;

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",

      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },

      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          `Failed to ${
            isEditing ? "update" : "add"
          } question.`
      );
    }

    await fetchQuestions();

    setShowModal(false);
    setEditingQuestionId(null);
    setForm(INITIAL_FORM);
    setFormError("");

    setSuccessMessage(
      isEditing
        ? "Question updated successfully."
        : "Question added successfully."
    );
  } catch (error) {
    console.error(
      "Save question error:",
      error
    );

    setFormError(
      error.message || "Failed to save question."
    );
  } finally {
    setSaving(false);
  }
};

  // ---------------------------------------------------
  // PLACEHOLDERS FOR NEXT STEP
  // ---------------------------------------------------
const handleEditQuestion = (question) => {
  setEditingQuestionId(question.questionId);

  setForm({
    questionText: question.questionText || "",
    optionA: question.optionA || "",
    optionB: question.optionB || "",
    optionC: question.optionC || "",
    optionD: question.optionD || "",
    correctAnswer: String(question.correctAnswer || 1),

    questionTextHi: question.questionTextHi || "",
    optionAHi: question.optionAHi || "",
    optionBHi: question.optionBHi || "",
    optionCHi: question.optionCHi || "",
    optionDHi: question.optionDHi || "",
  });

  setFormError("");
  setSuccessMessage("");
  setShowModal(true);
};

  const handleDeleteQuestion = (question) => {
    alert(
      `Delete Question ${question.questionId} will be added next.`
    );
  };

  // ---------------------------------------------------
  // HELPERS
  // ---------------------------------------------------

  const getCorrectLetter = (correctAnswer) => {
    const map = {
      1: "A",
      2: "B",
      3: "C",
      4: "D",
    };

    return map[Number(correctAnswer)] || "-";
  };

  const formatDuration = (seconds) => {
    const totalSeconds = Number(seconds) || 0;

    if (totalSeconds < 60) {
      return `${totalSeconds} sec`;
    }

    const minutes = Math.round(
      totalSeconds / 60
    );

    return `${minutes} min`;
  };

  // ---------------------------------------------------
  // LOADING
  // ---------------------------------------------------

  if (loading) {
    return (
      <div className="admin-questions-state">
        <RefreshCw
          size={26}
          className="admin-questions-spin"
        />

        <p>Loading questions...</p>
      </div>
    );
  }

  // ---------------------------------------------------
  // ERROR
  // ---------------------------------------------------

  if (error) {
    return (
      <div className="admin-questions-state">
        <AlertCircle size={32} />

        <h2>Unable to load questions</h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={fetchQuestions}
          className="admin-question-primary-btn"
        >
          <RefreshCw size={17} />
          Try Again
        </button>
      </div>
    );
  }

  // ---------------------------------------------------
  // PAGE
  // ---------------------------------------------------

  return (
    <div className="admin-questions-page">

      {/* HEADER */}

      <div className="admin-questions-heading">
        <div>
          <button
            type="button"
            className="admin-question-back"
            onClick={() =>
              navigate("/admin/tests")
            }
          >
            <ArrowLeft size={17} />
            Back to Tests
          </button>

          <span className="admin-question-eyebrow">
            MANAGE QUESTIONS
          </span>

          <h1>
            {test?.title || "Test Questions"}
          </h1>

          <p>
            Add and manage questions for this
            mock test.
          </p>
        </div>

        <button
          type="button"
          className="admin-question-primary-btn"
          onClick={openAddQuestion}
        >
          <Plus size={18} />
          Add Question
        </button>
      </div>

      {/* TEST INFO */}

      <div className="admin-question-stats">

        <div className="admin-question-stat-card">
          <FileQuestion size={22} />

          <div>
            <span>Total Questions</span>
            <strong>{questions.length}</strong>
          </div>
        </div>

        <div className="admin-question-stat-card">
          <Clock3 size={22} />

          <div>
            <span>Duration</span>

            <strong>
              {formatDuration(test?.duration)}
            </strong>
          </div>
        </div>

        <div className="admin-question-stat-card">
          <Trophy size={22} />

          <div>
            <span>Marks / Correct</span>

            <strong>
              {test?.marksPerCorrect ?? 0}
            </strong>
          </div>
        </div>

      </div>

      {/* TEST META */}

      <div className="admin-question-test-meta">
        <span>
          <strong>Test ID:</strong>{" "}
          {test?.testId}
        </span>

        <span>
          <strong>Category:</strong>{" "}
          {test?.category}
        </span>

        <span>
          <strong>Subject:</strong>{" "}
          {test?.subject}
        </span>

        <span>
          <strong>Negative:</strong>{" "}
          {test?.negativeMarking}
        </span>
      </div>

      {/* QUESTIONS */}

      {questions.length === 0 ? (
        <div className="admin-questions-empty">
          <FileQuestion size={42} />

          <h2>No questions yet</h2>

          <p>
            Start building this mock test by
            adding the first question.
          </p>

          <button
            type="button"
            className="admin-question-primary-btn"
            onClick={openAddQuestion}
          >
            <Plus size={18} />
            Add First Question
          </button>
        </div>
      ) : (
        <div className="admin-question-list">

          {questions.map((question, index) => (
            <article
              className="admin-question-card"
              key={question.questionId}
            >

              <div className="admin-question-card-top">

                <span className="admin-question-number">
                  Question {index + 1}
                </span>

                <div className="admin-question-actions">

                  <button
                    type="button"
                    title="Edit Question"
                    onClick={() =>
                      handleEditQuestion(question)
                    }
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    title="Delete Question"
                    className="danger"
                    onClick={() =>
                      handleDeleteQuestion(question)
                    }
                  >
                    <Trash2 size={16} />
                  </button>

                </div>
              </div>

              <h3>
                {question.questionText}
              </h3>

              <div className="admin-question-options">

                {[
                  ["A", question.optionA, 1],
                  ["B", question.optionB, 2],
                  ["C", question.optionC, 3],
                  ["D", question.optionD, 4],
                ].map(
                  ([letter, option, value]) => (
                    <div
                      key={letter}
                      className={
                        Number(
                          question.correctAnswer
                        ) === value
                          ? "admin-question-option correct"
                          : "admin-question-option"
                      }
                    >
                      <strong>{letter}</strong>

                      <span>{option}</span>

                      {Number(
                        question.correctAnswer
                      ) === value && (
                        <CheckCircle2
                          size={17}
                        />
                      )}
                    </div>
                  )
                )}

              </div>

              <div className="admin-question-answer">
                Correct Answer:
                <strong>
                  {getCorrectLetter(
                    question.correctAnswer
                  )}
                </strong>
              </div>

              {question.questionTextHi && (
                <div className="admin-question-hindi">
                  <span>Hindi</span>

                  <p>
                    {question.questionTextHi}
                  </p>
                </div>
              )}

            </article>
          ))}

        </div>
      )}

      {/* ADD QUESTION MODAL */}

      {showModal && (
        <div
          className="admin-question-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="admin-question-modal">

            <div className="admin-question-modal-header">

              <div>
                <span>
  {editingQuestionId !== null
    ? "EDIT QUESTION"
    : "NEW QUESTION"}
</span>

                <h2>
  {editingQuestionId !== null
    ? "Edit Question"
    : "Add Question"}
</h2>

                <p>
                  {test?.title}
                </p>
              </div>

              <button
                type="button"
                className="admin-question-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleAddQuestion}
              className="admin-question-form"
            >

              {formError && (
                <div className="admin-question-form-message error">
                  <AlertCircle size={17} />
                  {formError}
                </div>
              )}

              {successMessage && (
                <div className="admin-question-form-message success">
                  <CheckCircle2 size={17} />
                  {successMessage}
                </div>
              )}

              {/* ENGLISH */}

              <div className="admin-question-form-section">
                <span className="admin-question-section-label">
                  ENGLISH
                </span>

                <label>
                  Question *

                  <textarea
                    name="questionText"
                    value={form.questionText}
                    onChange={handleChange}
                    placeholder="Enter question..."
                    rows="3"
                    disabled={saving}
                  />
                </label>

                <div className="admin-question-form-grid">

                  <label>
                    Option A *

                    <input
                      type="text"
                      name="optionA"
                      value={form.optionA}
                      onChange={handleChange}
                      placeholder="Option A"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Option B *

                    <input
                      type="text"
                      name="optionB"
                      value={form.optionB}
                      onChange={handleChange}
                      placeholder="Option B"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Option C *

                    <input
                      type="text"
                      name="optionC"
                      value={form.optionC}
                      onChange={handleChange}
                      placeholder="Option C"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Option D *

                    <input
                      type="text"
                      name="optionD"
                      value={form.optionD}
                      onChange={handleChange}
                      placeholder="Option D"
                      disabled={saving}
                    />
                  </label>

                </div>

                <label>
                  Correct Answer *

                  <select
                    name="correctAnswer"
                    value={form.correctAnswer}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="1">
                      A
                    </option>

                    <option value="2">
                      B
                    </option>

                    <option value="3">
                      C
                    </option>

                    <option value="4">
                      D
                    </option>
                  </select>
                </label>

              </div>

              {/* HINDI */}

              <div className="admin-question-form-section">
                <span className="admin-question-section-label">
                  HINDI — OPTIONAL
                </span>

                <label>
                  Hindi Question

                  <textarea
                    name="questionTextHi"
                    value={form.questionTextHi}
                    onChange={handleChange}
                    placeholder="हिंदी में प्रश्न..."
                    rows="3"
                    disabled={saving}
                  />
                </label>

                <div className="admin-question-form-grid">

                  <label>
                    Hindi Option A

                    <input
                      type="text"
                      name="optionAHi"
                      value={form.optionAHi}
                      onChange={handleChange}
                      placeholder="विकल्प A"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Hindi Option B

                    <input
                      type="text"
                      name="optionBHi"
                      value={form.optionBHi}
                      onChange={handleChange}
                      placeholder="विकल्प B"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Hindi Option C

                    <input
                      type="text"
                      name="optionCHi"
                      value={form.optionCHi}
                      onChange={handleChange}
                      placeholder="विकल्प C"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    Hindi Option D

                    <input
                      type="text"
                      name="optionDHi"
                      value={form.optionDHi}
                      onChange={handleChange}
                      placeholder="विकल्प D"
                      disabled={saving}
                    />
                  </label>

                </div>

              </div>

              {/* FOOTER */}

              <div className="admin-question-form-footer">

                <button
                  type="button"
                  className="admin-question-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-question-primary-btn"
                  disabled={saving}
                >
               {saving
  ? editingQuestionId !== null
    ? "Updating..."
    : "Adding..."
  : editingQuestionId !== null
    ? "Save Changes"
    : "Add Question"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminQuestions;