import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";

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
  FileSpreadsheet,
} from "lucide-react";

import BulkImportQuestions from "./BulkImportQuestions";

import "./AdminQuestions.css";

const API_BASE =
  import.meta.env.DEV
    ? "http://127.0.0.1:5000"
    : import.meta.env
        .VITE_API_BASE ||
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

export default function AdminFreeQuestions() {
  const {
    testId,
  } =
    useParams();

  const navigate =
    useNavigate();

  const {
    adminToken,
  } =
    useOutletContext();

  const [showImport, setShowImport] = useState(false);

  const [
    test,
    setTest,
  ] = useState(null);

  const [
    questions,
    setQuestions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingQuestionId,
    setEditingQuestionId,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );

  const [
    formError,
    setFormError,
  ] = useState("");

  const fetchQuestions =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_BASE}/api/admin/free-tests/${encodeURIComponent(
                testId
              )}/questions`,
              {
                headers: {
                  Authorization: `Bearer ${adminToken}`,
                },
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Failed to load questions."
            );
          }

          setTest(
            data.test ||
              null
          );

          setQuestions(
            Array.isArray(
              data.questions
            )
              ? data.questions
              : []
          );
        } catch (err) {
          setError(
            err.message ||
              "Failed to load questions."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        adminToken,
        testId,
      ]
    );

  useEffect(() => {
    if (
      adminToken &&
      testId
    ) {
      fetchQuestions();
    }
  }, [
    adminToken,
    testId,
    fetchQuestions,
  ]);

  function handleChange(
    event
  ) {
    const {
      name,
      value,
    } =
      event.target;

    setForm(
      (current) => ({
        ...current,
        [name]:
          value,
      })
    );
  }

  function openAdd() {
    setEditingQuestionId(
      null
    );

    setForm(
      INITIAL_FORM
    );

    setFormError("");
    setShowModal(true);
  }

  function openEdit(
    question
  ) {
    setEditingQuestionId(
      question.questionId
    );

    setForm({
      questionText:
        question.questionText ||
        "",

      optionA:
        question.optionA ||
        "",

      optionB:
        question.optionB ||
        "",

      optionC:
        question.optionC ||
        "",

      optionD:
        question.optionD ||
        "",

      correctAnswer:
        String(
          question.correctAnswer ||
            1
        ),

      questionTextHi:
        question.questionTextHi ||
        "",

      optionAHi:
        question.optionAHi ||
        "",

      optionBHi:
        question.optionBHi ||
        "",

      optionCHi:
        question.optionCHi ||
        "",

      optionDHi:
        question.optionDHi ||
        "",
    });

    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingQuestionId(
      null
    );

    setForm(
      INITIAL_FORM
    );

    setFormError("");
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setFormError("");

    if (
      !form.questionText.trim() ||
      !form.optionA.trim() ||
      !form.optionB.trim() ||
      !form.optionC.trim() ||
      !form.optionD.trim()
    ) {
      setFormError(
        "Question and all four English options are required."
      );

      return;
    }

    try {
      setSaving(true);

      const editing =
        editingQuestionId !==
        null;

      const base =
        `${API_BASE}/api/admin/free-tests/${encodeURIComponent(
          testId
        )}/questions`;

      const url =
        editing
          ? `${base}/${encodeURIComponent(
              editingQuestionId
            )}`
          : base;

      const response =
        await fetch(url, {
          method:
            editing
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${adminToken}`,
          },

          body:
            JSON.stringify({
              questionText:
                form.questionText.trim(),

              optionA:
                form.optionA.trim(),

              optionB:
                form.optionB.trim(),

              optionC:
                form.optionC.trim(),

              optionD:
                form.optionD.trim(),

              correctAnswer:
                Number(
                  form.correctAnswer
                ),

              questionTextHi:
                form.questionTextHi.trim(),

              optionAHi:
                form.optionAHi.trim(),

              optionBHi:
                form.optionBHi.trim(),

              optionCHi:
                form.optionCHi.trim(),

              optionDHi:
                form.optionDHi.trim(),
            }),
        });

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to save question."
        );
      }

      await fetchQuestions();

      closeModal();
    } catch (err) {
      setFormError(
        err.message ||
          "Failed to save question."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    question
  ) {
    if (
      !window.confirm(
        `Delete Question ${question.questionId}?`
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE}/api/admin/free-tests/${encodeURIComponent(
            testId
          )}/questions/${encodeURIComponent(
            question.questionId
          )}`,
          {
            method:
              "DELETE",

            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to delete question."
        );
      }

      await fetchQuestions();
    } catch (err) {
      setError(
        err.message
      );
    }
  }

  function correctLetter(
    answer
  ) {
    return (
      {
        1: "A",
        2: "B",
        3: "C",
        4: "D",
      }[
        Number(answer)
      ] || "-"
    );
  }

  if (loading) {
    return (
      <div className="admin-questions-state">
        <RefreshCw
          className="admin-questions-spin"
          size={26}
        />

        <p>
          Loading questions...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-questions-page">

      <div className="admin-questions-heading">

        <div>

          <button
            type="button"
            className="admin-question-back"
            onClick={() =>
              navigate(
                "/admin/free-tests"
              )
            }
          >
            <ArrowLeft
              size={17}
            />

            Back to Free Tests
          </button>

          <span className="admin-question-eyebrow">
            FREE TEST QUESTIONS
          </span>

          <h1>
            {test?.title ||
              "Free Test Questions"}
          </h1>

          <p>
            Add, edit and delete
            questions for this free
            test.
          </p>

        </div>

        <div className="bq-header-actions">

          <button type="button" className="bq-import-btn" onClick={() => setShowImport(true)}>

            <FileSpreadsheet size={18} />

            Import Excel

          </button>

        <button
          type="button"
          className="admin-question-primary-btn"
          onClick={
            openAdd
          }
        >
          <Plus
            size={18}
          />

          Add Question
        </button>

        </div>

      </div>

      {error && (
        <div className="admin-question-form-message error">
          <AlertCircle
            size={17}
          />
          {error}
        </div>
      )}

      <div className="admin-question-stats">

        <div className="admin-question-stat-card">

          <FileQuestion
            size={22}
          />

          <div>
            <span>
              Questions
            </span>

            <strong>
              {
                questions.length
              }
            </strong>
          </div>

        </div>

        <div className="admin-question-stat-card">

          <Clock3
            size={22}
          />

          <div>
            <span>
              Duration
            </span>

            <strong>
              {Math.round(
                Number(
                  test?.duration ||
                    0
                ) / 60
              )}{" "}
              min
            </strong>
          </div>

        </div>

        <div className="admin-question-stat-card">

          <Trophy
            size={22}
          />

          <div>
            <span>
              Marks / Correct
            </span>

            <strong>
              {
                test?.marksPerCorrect
              }
            </strong>
          </div>

        </div>

      </div>

      {questions.length ===
      0 ? (

        <div className="admin-questions-empty">

          <FileQuestion
            size={42}
          />

          <h2>
            No questions yet
          </h2>

          <p>
            Add the first question
            to this free test.
          </p>

          <button
            type="button"
            className="admin-question-primary-btn"
            onClick={
              openAdd
            }
          >
            <Plus
              size={18}
            />

            Add First Question
          </button>

        </div>

      ) : (

        <div className="admin-question-list">

          {questions.map(
            (
              question,
              index
            ) => (

              <article
                key={
                  question.questionId
                }
                className="admin-question-card"
              >

                <div className="admin-question-card-top">

                  <span className="admin-question-number">
                    Question{" "}
                    {index + 1}
                  </span>

                  <div className="admin-question-actions">

                    <button
                      type="button"
                      title="Edit"
                      onClick={() =>
                        openEdit(
                          question
                        )
                      }
                    >
                      <Pencil
                        size={16}
                      />
                    </button>

                    <button
                      type="button"
                      className="danger"
                      title="Delete"
                      onClick={() =>
                        handleDelete(
                          question
                        )
                      }
                    >
                      <Trash2
                        size={16}
                      />
                    </button>

                  </div>

                </div>

                <h3>
                  {
                    question.questionText
                  }
                </h3>

                <div className="admin-question-options">

                  {[
                    [
                      "A",
                      question.optionA,
                      1,
                    ],
                    [
                      "B",
                      question.optionB,
                      2,
                    ],
                    [
                      "C",
                      question.optionC,
                      3,
                    ],
                    [
                      "D",
                      question.optionD,
                      4,
                    ],
                  ].map(
                    ([
                      letter,
                      text,
                      value,
                    ]) => (

                      <div
                        key={
                          letter
                        }
                        className={
                          Number(
                            question.correctAnswer
                          ) ===
                          value
                            ? "admin-question-option correct"
                            : "admin-question-option"
                        }
                      >

                        <strong>
                          {letter}
                        </strong>

                        <span>
                          {text}
                        </span>

                        {Number(
                          question.correctAnswer
                        ) ===
                          value && (
                          <CheckCircle2
                            size={17}
                          />
                        )}

                      </div>

                    )
                  )}

                </div>

                <div className="admin-question-answer">
                  Correct Answer:{" "}
                  <strong>
                    {correctLetter(
                      question.correctAnswer
                    )}
                  </strong>
                </div>

              </article>
            )
          )}

        </div>
      )}

      {showModal && (

        <div className="admin-question-modal-overlay">

          <div className="admin-question-modal">

            <div className="admin-question-modal-header">

              <div>
                <span>
                  FREE TEST
                </span>

                <h2>
                  {editingQuestionId !==
                  null
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
                onClick={
                  closeModal
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>

            <form
              className="admin-question-form"
              onSubmit={
                handleSubmit
              }
            >

              {formError && (
                <div className="admin-question-form-message error">
                  <AlertCircle
                    size={17}
                  />

                  {formError}
                </div>
              )}

              <div className="admin-question-form-section">

                <span className="admin-question-section-label">
                  ENGLISH
                </span>

                <label>
                  Question *

                  <textarea
                    name="questionText"
                    value={
                      form.questionText
                    }
                    onChange={
                      handleChange
                    }
                    rows="3"
                  />
                </label>

                <div className="admin-question-form-grid">

                  {[
                    "A",
                    "B",
                    "C",
                    "D",
                  ].map(
                    (letter) => {

                      const name =
                        `option${letter}`;

                      return (
                        <label
                          key={
                            letter
                          }
                        >
                          Option{" "}
                          {
                            letter
                          }{" "}
                          *

                          <input
                            name={
                              name
                            }
                            value={
                              form[
                                name
                              ]
                            }
                            onChange={
                              handleChange
                            }
                          />
                        </label>
                      );
                    }
                  )}

                </div>

                <label>
                  Correct Answer *

                  <select
                    name="correctAnswer"
                    value={
                      form.correctAnswer
                    }
                    onChange={
                      handleChange
                    }
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

              <div className="admin-question-form-section">

                <span className="admin-question-section-label">
                  HINDI — OPTIONAL
                </span>

                <label>
                  Hindi Question

                  <textarea
                    name="questionTextHi"
                    value={
                      form.questionTextHi
                    }
                    onChange={
                      handleChange
                    }
                    rows="3"
                  />
                </label>

                <div className="admin-question-form-grid">

                  {[
                    "A",
                    "B",
                    "C",
                    "D",
                  ].map(
                    (letter) => {

                      const name =
                        `option${letter}Hi`;

                      return (
                        <label
                          key={
                            name
                          }
                        >
                          Hindi Option{" "}
                          {
                            letter
                          }

                          <input
                            name={
                              name
                            }
                            value={
                              form[
                                name
                              ]
                            }
                            onChange={
                              handleChange
                            }
                          />
                        </label>
                      );
                    }
                  )}

                </div>

              </div>

              <div className="admin-question-form-footer">

                <button
                  type="button"
                  className="admin-question-cancel-btn"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-question-save-btn"
                  disabled={
                    saving
                  }
                >
                  <Save
                    size={18}
                  />

                  {saving
                    ? "Saving..."
                    : "Save Question"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {showImport && (
        <BulkImportQuestions
          mode="free"
          testId={testId}
          testTitle={test?.title || ""}
          apiBase={API_BASE}
          authHeaders={{ Authorization: `Bearer ${adminToken}` }}
          existingQuestions={questions}
          onClose={() => setShowImport(false)}
          onImported={fetchQuestions}
        />
      )}

    </div>
  );
}