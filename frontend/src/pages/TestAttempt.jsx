import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import "./TestAttempt.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

const LANGUAGES = ["English", "Hindi"];

// Login token ke saath header (subscription check ke liye)
function authHeaders() {
  const token =
    localStorage.getItem(
      "dishaToken"
    );

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

// 403 NO_ACTIVE_SUBSCRIPTION ko alag pehchanne ke liye
async function readTestResponse(res) {
  const data =
    await res
      .json()
      .catch(() => ({}));

  if (
    res.status === 403 &&
    data?.code ===
      "NO_ACTIVE_SUBSCRIPTION"
  ) {
    const err = new Error(
      data.error ||
        "Please subscribe to attempt mock tests."
    );

    err.code =
      "NO_ACTIVE_SUBSCRIPTION";

    throw err;
  }

  if (res.status === 401) {
    const err = new Error(
      data.error ||
        "Please log in again."
    );

    err.code = "LOGIN_REQUIRED";

    throw err;
  }

  if (!res.ok) {
    throw new Error(
      data?.error ||
        "Test not found"
    );
  }

  return data;
}

function getTimeParts(totalSeconds) {
  const seconds = Math.max(
    0,
    Number(totalSeconds) || 0
  );

  return {
    hours: String(
      Math.floor(seconds / 3600)
    ).padStart(2, "0"),

    minutes: String(
      Math.floor((seconds % 3600) / 60)
    ).padStart(2, "0"),

    seconds: String(
      seconds % 60
    ).padStart(2, "0"),
  };
}

function formatQuestionTime(totalSeconds) {
  const seconds = Math.max(
    0,
    Number(totalSeconds) || 0
  );

  const minutes = Math.floor(
    seconds / 60
  );

  const secs = seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
}

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("dishaUser") ||
        "null"
    );
  } catch {
    return null;
  }
}

function getInitials(name) {
  const value = String(name || "").trim();

  if (!value) {
    return "S";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function TestAttempt({ freeMode = false }) {
  const { testId } = useParams();
  const navigate = useNavigate();

  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);

  // seconds spent on every question  { questionId: seconds }  (sent on submit)
  const questionTimesRef = useRef({});
  const currentIndexRef = useRef(0);
  const timeLeftRef = useRef(0);

  const [test, setTest] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState(null);
  const [needsSubscription, setNeedsSubscription] = useState(false);

  const [
    testStarted,
    setTestStarted,
  ] = useState(false);

  const [agreed, setAgreed] =
    useState(false);

  const [language, setLanguage] =
    useState("English");

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  // 0 = A
  // 1 = B
  // 2 = C
  // 3 = D
  const [answers, setAnswers] =
    useState({});

  const [status, setStatus] =
    useState({});

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [
    questionTime,
    setQuestionTime,
  ] = useState(0);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [result, setResult] =
    useState(null);

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [
    startingTest,
    setStartingTest,
  ] = useState(false);

  const [paused, setPaused] =
    useState(false);

  const [
    isFullscreen,
    setIsFullscreen,
  ] = useState(false);

  const [
    switchingLanguage,
    setSwitchingLanguage,
  ] = useState(false);

  const currentUser = getStoredUser();

  // =====================================================
  // FETCH TEST
  // =====================================================

  useEffect(() => {
    async function loadTest() {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_BASE}/api/tests/${testId}`,
          {
            headers: authHeaders(),
          }
        );

        const data =
          await readTestResponse(res);

        setTest(data);

        setTimeLeft(
          Number(data.duration) || 0
        );

        const initialStatus = {};

        data.questions.forEach(
          (q, index) => {
            initialStatus[q.id] =
              index === 0
                ? "notAnswered"
                : "notVisited";
          }
        );

        setStatus(initialStatus);
      } catch (err) {
        console.error(
          "Test loading error:",
          err
        );

        if (
          err.code ===
          "NO_ACTIVE_SUBSCRIPTION"
        ) {
          setNeedsSubscription(true);
        }

        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [testId]);

  // =====================================================
  // FULLSCREEN STATE
  // =====================================================

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement
        )
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (
        !document.fullscreenElement
      ) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(
        "Fullscreen error:",
        err
      );
    }
  }

  // =====================================================
  // SUBMIT TEST
  // =====================================================

  const handleSubmit =
    useCallback(async () => {
      if (!test || submitting) {
        return;
      }

      setSubmitting(true);

      clearInterval(
        timerRef.current
      );

      clearInterval(
        questionTimerRef.current
      );

      try {
        const langParam =
          language === "Hindi"
            ? "hi"
            : "en";

        // Frontend = 0,1,2,3
        // Backend = 1,2,3,4
        const submissionAnswers =
          Object.fromEntries(
            Object.entries(
              answers
            ).map(
              ([
                questionId,
                optionIndex,
              ]) => [
                questionId,
                Number(
                  optionIndex
                ) + 1,
              ]
            )
          );

        const token =
          localStorage.getItem(
            "dishaToken"
          );

        const res = await fetch(
          `${API_BASE}/api/tests/${testId}/submit?lang=${langParam}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },

            body: JSON.stringify({
              answers:
                submissionAnswers,
              timeTakenSeconds:
                Math.max(
                  0,
                  (Number(test.duration) || 0) -
                    timeLeftRef.current
                ),
              questionTimes:
                questionTimesRef.current,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Failed to submit test"
          );
        }

        setShowConfirm(false);
        setPaused(false);

        // result page: overview, leaderboard and solutions
        navigate(
          `/test-result/${data.resultId}`,
          { replace: true }
        );
      } catch (err) {
        console.error(
          "Submit test error:",
          err
        );

        alert(
          err.message ||
            "Failed to submit test. Please try again."
        );

        setSubmitting(false);
      }
    }, [
      test,
      testId,
      answers,
      submitting,
      language,
      navigate,
    ]);

  // =====================================================
  // START TEST
  // =====================================================

  async function handleStartTest() {
    setStartingTest(true);

    try {
      const langParam =
        language === "Hindi"
          ? "hi"
          : "en";

      const res = await fetch(
        `${API_BASE}/api/tests/${testId}?lang=${langParam}`,
        {
          headers: authHeaders(),
        }
      );

      const data =
        await readTestResponse(res);

      setTest(data);

      setTimeLeft(
        Number(data.duration) || 0
      );

      setCurrentIndex(0);
      setQuestionTime(0);
      setAnswers({});
      questionTimesRef.current = {};
      setPaused(false);

      const initialStatus = {};

      data.questions.forEach(
        (q, index) => {
          initialStatus[q.id] =
            index === 0
              ? "notAnswered"
              : "notVisited";
        }
      );

      setStatus(initialStatus);
      setTestStarted(true);
    } catch (err) {
      console.error(
        "Start test error:",
        err
      );

      if (
        err.code ===
        "NO_ACTIVE_SUBSCRIPTION"
      ) {
        navigate("/pricing");
        return;
      }

      alert(
        "Failed to start test. Please try again."
      );
    } finally {
      setStartingTest(false);
    }
  }

  // =====================================================
  // MAIN TIMER
  // =====================================================

  useEffect(() => {
    if (
      !test ||
      result ||
      !testStarted ||
      paused
    ) {
      return;
    }

    timerRef.current =
      setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(
              timerRef.current
            );

            handleSubmit();

            return 0;
          }

          return prev - 1;
        });
      }, 1000);

    return () =>
      clearInterval(
        timerRef.current
      );
  }, [
    test,
    result,
    testStarted,
    paused,
    handleSubmit,
  ]);

  // =====================================================
  // CURRENT QUESTION TIMER
  // =====================================================

  useEffect(() => {
    if (
      !testStarted ||
      result ||
      paused
    ) {
      return;
    }

    questionTimerRef.current =
      setInterval(() => {
        setQuestionTime(
          (prev) => prev + 1
        );
      }, 1000);

    return () =>
      clearInterval(
        questionTimerRef.current
      );
  }, [
    testStarted,
    result,
    paused,
  ]);

  // =====================================================
  // TIME SPENT ON EACH QUESTION
  // =====================================================
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (!testStarted || result || paused) {
      return undefined;
    }

    const counter = setInterval(() => {
      const question =
        test?.questions?.[currentIndexRef.current];

      if (question) {
        questionTimesRef.current[question.id] =
          (questionTimesRef.current[question.id] || 0) + 1;
      }
    }, 1000);

    return () => clearInterval(counter);
  }, [testStarted, result, paused, test]);

  // =====================================================
  // LANGUAGE SWITCH
  // =====================================================

  async function handleLanguageChange(
    event
  ) {
    const newLanguage =
      event.target.value;

    if (
      newLanguage === language
    ) {
      return;
    }

    setSwitchingLanguage(true);

    try {
      const langParam =
        newLanguage === "Hindi"
          ? "hi"
          : "en";

      const res = await fetch(
        `${API_BASE}/api/tests/${testId}?lang=${langParam}`,
        {
          headers: authHeaders(),
        }
      );

      const data =
        await readTestResponse(res);

      setTest(data);
      setLanguage(newLanguage);
    } catch (err) {
      console.error(
        "Language switch error:",
        err
      );

      alert(
        "Unable to change language."
      );
    } finally {
      setSwitchingLanguage(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="ta-status">
        Loading test...
      </div>
    );
  }

  if (needsSubscription) {
    return (
      <div className="ta-status">
        <h2>
          Subscription required
        </h2>

        <p>
          Mock tests are available
          with an active
          subscription. Plans start
          at just ₹69.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/pricing")
          }
        >
          View Plans
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ta-status ta-error">
        Error: {error}
      </div>
    );
  }

  if (!test) {
    return (
      <div className="ta-status ta-error">
        Test not found.
      </div>
    );
  }

  // =====================================================
  // INSTRUCTIONS
  // =====================================================

  if (
    !testStarted &&
    !result
  ) {
    return (
      <div className="ta-instructions-page">
        <div className="ta-instructions-card">
          <h2>{test.title}</h2>

          <p className="ta-instructions-sub">
            {test.subject} ·{" "}
            {test.questions.length}{" "}
            Questions ·{" "}
            {Math.floor(
              Number(
                test.duration
              ) / 60
            )}{" "}
            minutes
          </p>

          <h3>
            General Instructions
          </h3>

          <ul className="ta-instructions-list">
            <li>
              The test contains{" "}
              {test.questions.length}{" "}
              questions.
            </li>

            <li>
              Correct answer: +
              {test.marksPerCorrect}{" "}
              mark(s).
            </li>

            <li>
              Wrong answer: -
              {test.negativeMarking}{" "}
              mark(s).
            </li>

            <li>
              Unanswered questions
              carry no marks.
            </li>

            <li>
              You can change your
              answer before
              submitting.
            </li>

            <li>
              Use Mark for Review to
              revisit questions.
            </li>

            <li>
              The test automatically
              submits when the timer
              reaches zero.
            </li>
          </ul>

          <div className="ta-language-select">
            <label htmlFor="ta-language">
              Choose language:
            </label>

            <select
              id="ta-language"
              value={language}
              onChange={(e) =>
                setLanguage(
                  e.target.value
                )
              }
            >
              {LANGUAGES.map(
                (lang) => (
                  <option
                    key={lang}
                    value={lang}
                  >
                    {lang}
                  </option>
                )
              )}
            </select>
          </div>

          <label className="ta-agree-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) =>
                setAgreed(
                  e.target.checked
                )
              }
            />

            I have read and
            understood the
            instructions.
          </label>

          <button
            className="ta-btn ta-btn-primary ta-start-wide"
            disabled={
              !agreed ||
              startingTest
            }
            onClick={
              handleStartTest
            }
          >
            {startingTest
              ? "Loading..."
              : "Start Mock Test"}
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RESULT
  // =====================================================

  if (result) {
    return (
      <div className="ta-result-page">
        <div className="ta-result-card">
          <h2>
            Test Submitted!
          </h2>

          <h3>
            {result.testTitle}
          </h3>

          <div className="ta-result-stats">
            <div className="ta-stat ta-stat-score">
              <span>
                {result.score}
              </span>
              <label>
                Score
              </label>
            </div>

            <div className="ta-stat ta-stat-correct">
              <span>
                {
                  result.correctCount
                }
              </span>
              <label>
                Correct
              </label>
            </div>

            <div className="ta-stat ta-stat-wrong">
              <span>
                {
                  result.wrongCount
                }
              </span>
              <label>
                Wrong
              </label>
            </div>

            <div className="ta-stat ta-stat-unanswered">
              <span>
                {
                  result.unansweredCount
                }
              </span>
              <label>
                Unanswered
              </label>
            </div>
          </div>

          <button
            className="ta-btn ta-btn-primary"
           onClick={() =>
  navigate(
    freeMode
      ? "/free-tests"
      : "/take-mock-test"
  )
}
          >
           {freeMode
  ? "Back to Free Tests"
  : "Back to Mock Tests"}
          </button>
        </div>

        <div className="ta-review-list">
          <h3>
            Answer Review
          </h3>

          {Array.isArray(
            result.review
          ) &&
            result.review.map(
              (r, index) => (
                <div
                  key={
                    r.questionId
                  }
                  className={`ta-review-item ta-review-${r.status}`}
                >
                  <p className="ta-review-q">
                    Q{index + 1}.{" "}
                    {r.question}
                  </p>

                  <div className="ta-review-options">
                    {Array.isArray(
                      r.options
                    ) &&
                      r.options.map(
                        (
                          option,
                          i
                        ) => {
                          let className =
                            "ta-review-option";

                          const optionNumber =
                            i + 1;

                          if (
                            optionNumber ===
                            Number(
                              r.correctAnswer
                            )
                          ) {
                            className +=
                              " correct";
                          }

                          if (
                            optionNumber ===
                              Number(
                                r.selected
                              ) &&
                            optionNumber !==
                              Number(
                                r.correctAnswer
                              )
                          ) {
                            className +=
                              " wrong-selected";
                          }

                          return (
                            <div
                              key={
                                i
                              }
                              className={
                                className
                              }
                            >
                              {
                                option
                              }
                            </div>
                          );
                        }
                      )}
                  </div>

                  {r.status ===
                    "unanswered" && (
                    <p className="ta-review-tag">
                      Not attempted
                    </p>
                  )}
                </div>
              )
            )}
        </div>
      </div>
    );
  }

  // =====================================================
  // TEST VIEW
  // =====================================================

  const currentQ =
    test.questions[
      currentIndex
    ];

  if (!currentQ) {
    return (
      <div className="ta-status ta-error">
        No question available.
      </div>
    );
  }

  const selectedOption =
    answers[currentQ.id];

  const counts =
    Object.values(
      status
    ).reduce(
      (acc, currentStatus) => {
        if (
          currentStatus ===
          "answered"
        ) {
          acc.answered++;
        } else if (
          currentStatus ===
          "marked"
        ) {
          acc.marked++;
        } else if (
          currentStatus ===
          "markedAnswered"
        ) {
          acc.markedAnswered++;
        } else if (
          currentStatus ===
          "notAnswered"
        ) {
          acc.notAnswered++;
        } else {
          acc.notVisited++;
        }

        return acc;
      },
      {
        answered: 0,
        marked: 0,
        markedAnswered: 0,
        notAnswered: 0,
        notVisited: 0,
      }
    );

  const timer =
    getTimeParts(timeLeft);

  function selectOption(
    optionIndex
  ) {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]:
        optionIndex,
    }));
  }

  function goToQuestion(index) {
    setCurrentIndex(index);
    setQuestionTime(0);

    const question =
      test.questions[index];

    setStatus((prev) => {
      if (
        prev[question.id] ===
        "notVisited"
      ) {
        return {
          ...prev,
          [question.id]:
            "notAnswered",
        };
      }

      return prev;
    });
  }

  function saveAndNext() {
    const hasAnswer =
      answers[currentQ.id] !==
      undefined;

    setStatus((prev) => ({
      ...prev,

      [currentQ.id]:
        hasAnswer
          ? "answered"
          : "notAnswered",
    }));

    if (
      currentIndex <
      test.questions.length - 1
    ) {
      goToQuestion(
        currentIndex + 1
      );
    }
  }

 function markForReviewAndNext() {
  const hasAnswer =
    answers[currentQ.id] !== undefined;

  const nextIndex = currentIndex + 1;

  setStatus((prev) => {
    const updatedStatus = {
      ...prev,

      [currentQ.id]: hasAnswer
        ? "markedAnswered"
        : "marked",
    };

    // Next question ko visited/not answered mark karo
    if (nextIndex < test.questions.length) {
      const nextQuestion =
        test.questions[nextIndex];

      if (
        updatedStatus[nextQuestion.id] ===
        "notVisited"
      ) {
        updatedStatus[nextQuestion.id] =
          "notAnswered";
      }
    }

    return updatedStatus;
  });

  // Next question open karo
  if (nextIndex < test.questions.length) {
    setCurrentIndex(nextIndex);
    setQuestionTime(0);
  }
}

  function clearResponse() {
    setAnswers((prev) => {
      const next = {
        ...prev,
      };

      delete next[
        currentQ.id
      ];

      return next;
    });

    setStatus((prev) => ({
      ...prev,

      [currentQ.id]:
        "notAnswered",
    }));
  }

  return (
    <div className="ta-page">
      {/* ================= TOP HEADER ================= */}

      <header className="ta-exam-header">
        <div className="ta-header-title">
          {test.title}
        </div>

        <div className="ta-header-timer">
          <span className="ta-clock-icon">
            ◷
          </span>

          <span className="ta-time-label">
            Time Left
          </span>

          <span className="ta-time-box">
            {timer.hours}
          </span>

          <strong>:</strong>

          <span className="ta-time-box">
            {timer.minutes}
          </span>

          <strong>:</strong>

          <span className="ta-time-box">
            {timer.seconds}
          </span>
        </div>

        <div className="ta-header-actions">
          <button
            className="ta-fullscreen-btn"
            onClick={
              toggleFullscreen
            }
          >
            ⛶{" "}
            {isFullscreen
              ? "Exit Full Screen"
              : "Switch Full Screen"}
          </button>

          <button
            className="ta-pause-btn"
            onClick={() =>
              setPaused(
                (prev) => !prev
              )
            }
          >
            {paused
              ? "▶ Resume"
              : "Ⅱ Pause"}
          </button>
        </div>
      </header>

      {/* ================= SECTION BAR ================= */}

      <div className="ta-section-bar">
        <span className="ta-section-heading">
          SECTIONS
        </span>

        <button className="ta-section-tab active">
          Test
        </button>
      </div>

      {/* ================= BODY ================= */}

      <div className="ta-exam-layout">
        {/* LEFT MAIN */}

        <main className="ta-question-panel">
          <div className="ta-question-header">
            <div className="ta-question-number">
              Question No.{" "}
              {currentIndex + 1}
            </div>

            <div className="ta-question-tools">
              <div className="ta-marks-block">
                <span className="ta-meta-label">
                  Marks
                </span>

                <span className="ta-positive-mark">
                  +
                  {
                    test.marksPerCorrect
                  }
                </span>

                <span className="ta-negative-mark">
                  -
                  {
                    test.negativeMarking
                  }
                </span>
              </div>

              <div className="ta-question-time">
                <span>
                  Time
                </span>

                <strong>
                  {formatQuestionTime(
                    questionTime
                  )}
                </strong>
              </div>

              <div className="ta-language-tool">
                <span>
                  View in
                </span>

                <select
                  value={language}
                  onChange={
                    handleLanguageChange
                  }
                  disabled={
                    switchingLanguage
                  }
                >
                  {LANGUAGES.map(
                    (lang) => (
                      <option
                        key={lang}
                        value={lang}
                      >
                        {lang}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {paused && (
            <div className="ta-pause-overlay">
              <div>
                <div className="ta-pause-symbol">
                  Ⅱ
                </div>

                <h2>
                  Test Paused
                </h2>

                <p>
                  Click Resume to
                  continue your test.
                </p>

                <button
                  className="ta-pause-resume"
                  onClick={() =>
                    setPaused(false)
                  }
                >
                  Resume Test
                </button>
              </div>
            </div>
          )}

          <div className="ta-question-content">
            <p className="ta-q-text">
              {
                currentQ.question
              }
            </p>

            <div className="ta-options">
              {currentQ.options.map(
                (option, index) => (
                  <label
                    key={index}
                    className={`ta-option ${
                      selectedOption ===
                      index
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      checked={
                        selectedOption ===
                        index
                      }
                      onChange={() =>
                        selectOption(
                          index
                        )
                      }
                    />

                    <span>
                      {option}
                    </span>
                  </label>
                )
              )}

              <label
                className={`ta-option ta-not-attempted ${
                  selectedOption ===
                  undefined
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  checked={
                    selectedOption ===
                    undefined
                  }
                  onChange={
                    clearResponse
                  }
                />

                <span>
                  Question Not
                  Attempted
                </span>
              </label>
            </div>
          </div>

          <div className="ta-bottom-actions">
            <div className="ta-bottom-left">
             <button
  type="button"
  className="ta-action-outline"
  onClick={markForReviewAndNext}
>
  ♧ Mark for Review &amp; Next
</button>

              <button
                className="ta-action-outline"
                onClick={
                  clearResponse
                }
              >
                ↻ Clear Response
              </button>
            </div>

            <button
              className="ta-save-next"
              onClick={
                saveAndNext
              }
            >
              Save &amp; Next →
            </button>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}

        <aside className="ta-right-sidebar">
          <div className="ta-student-card">
            {currentUser?.picture ? (
              <img
                src={
                  currentUser.picture
                }
                alt=""
                className="ta-student-image"
              />
            ) : (
              <div className="ta-student-avatar">
                {getInitials(
                  currentUser?.fullName
                )}
              </div>
            )}

            <div>
              <strong>
                {currentUser?.fullName ||
                  "Student"}
              </strong>

              <span>
                Student
              </span>
            </div>
          </div>

          <div className="ta-summary-card">
            <div className="ta-summary-item">
              <span className="ta-summary-number answered">
                {counts.answered}
              </span>

              <span>
                Answered
              </span>
            </div>

            <div className="ta-summary-item">
              <span className="ta-summary-number marked">
                {counts.marked}
              </span>

              <span>
                Marked
              </span>
            </div>

            <div className="ta-summary-item">
              <span className="ta-summary-number not-visited">
                {
                  counts.notVisited
                }
              </span>

              <span>
                Not Visited
              </span>
            </div>

            <div className="ta-summary-item">
              <span className="ta-summary-number marked-answered">
                {
                  counts.markedAnswered
                }
              </span>

              <span>
                Marked and answered
              </span>
            </div>

            <div className="ta-summary-item">
              <span className="ta-summary-number not-answered">
                {
                  counts.notAnswered
                }
              </span>

              <span>
                Not Answered
              </span>
            </div>
          </div>

          <div className="ta-palette-card">
            <div className="ta-palette-title">
              SECTION : Test
            </div>

            <div className="ta-q-grid">
              {test.questions.map(
                (question, index) => (
                  <button
                    key={
                      question.id
                    }
                    className={`ta-q-btn ${
                      status[
                        question.id
                      ] ||
                      "notVisited"
                    } ${
                      index ===
                      currentIndex
                        ? "current"
                        : ""
                    }`}
                    onClick={() =>
                      goToQuestion(
                        index
                      )
                    }
                  >
                    {index + 1}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="ta-sidebar-bottom">
            <button
              className="ta-submit-test-btn"
              onClick={() =>
                setShowConfirm(
                  true
                )
              }
            >
              ➤ Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* ================= SUBMIT MODAL ================= */}

      {showConfirm && (
        <div className="ta-modal-overlay">
          <div className="ta-modal">
            <h3>
              Submit Test?
            </h3>

            <p>
              Answered:{" "}
              {counts.answered +
                counts.markedAnswered}{" "}
              /{" "}
              {
                test.questions
                  .length
              }

              <br />

              Not Answered:{" "}
              {counts.notAnswered +
                counts.notVisited}
            </p>

            <div className="ta-modal-actions">
              <button
                className="ta-btn ta-btn-outline"
                onClick={() =>
                  setShowConfirm(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                className="ta-btn ta-btn-primary"
                disabled={
                  submitting
                }
                onClick={
                  handleSubmit
                }
              >
                {submitting
                  ? "Submitting..."
                  : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}