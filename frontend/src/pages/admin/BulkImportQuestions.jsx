import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import {
  MAX_IMPORT_ROWS,
  downloadTemplate,
  parseQuestionFile,
  validateRows,
} from "./bulkQuestionImport";

import "./BulkImportQuestions.css";

/*
  Props
    mode               "test" | "free"
    testId, testTitle
    apiBase
    authHeaders        { Authorization } or { "x-admin-key" }
    existingQuestions  questions already in this test (duplicate check)
    onClose()
    onImported()       called when the admin closes after a successful import
*/
function BulkImportQuestions({
  mode,
  testId,
  testTitle,
  apiBase,
  authHeaders,
  existingQuestions = [],
  onClose,
  onImported,
}) {
  const fileInput = useRef(null);

  const [step, setStep] = useState("choose"); // choose | preview | done
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);

  const [results, setResults] = useState([]);
  const [blankRows, setBlankRows] = useState(0);

  const [lang, setLang] = useState("en");
  const [filter, setFilter] = useState("all");

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [report, setReport] = useState(null);

  // close with Esc (not while importing)
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !importing) handleClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importing, report]);

  const counts = useMemo(() => {
    const c = {
      valid: 0,
      error: 0,
      duplicate: 0,
      warning: 0,
      enOnly: 0,
      hiOnly: 0,
    };

    results.forEach((r) => {
      c[r.status] += 1;
      if (r.warnings.length) c.warning += 1;

      // single-language questions are only a NOTE, they still import
      if (r.status === "valid") {
        if (r.language === "en") c.enOnly += 1;
        if (r.language === "hi") c.hiOnly += 1;
      }
    });

    return c;
  }, [results]);

  const visibleRows = useMemo(() => {
    if (filter === "valid") {
      return results.filter((r) => r.status === "valid");
    }

    if (filter === "issues") {
      return results.filter(
        (r) => r.status !== "valid" || r.warnings.length
      );
    }

    return results;
  }, [results, filter]);

  function handleClose() {
    if (importing) return;
    if (report && report.imported > 0) onImported?.();
    onClose?.();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again

    if (!file) return;

    setFileError("");

    if (!/\.xlsx$/i.test(file.name)) {
      setFileError("Please choose an .xlsx Excel file.");
      return;
    }

    setReading(true);

    try {
      const parsed = await parseQuestionFile(file);

      if (parsed.fileError) {
        setFileError(parsed.fileError);
        return;
      }

      setFileName(file.name);
      setBlankRows(parsed.blankRows);
      setResults(
        validateRows(
          parsed.rows,
          existingQuestions.map((q) => q.questionText)
        )
      );
      setLang("en");
      setFilter("all");
      setStep("preview");
    } catch (err) {
      console.error(err);
      setFileError("Something went wrong while reading the file.");
    } finally {
      setReading(false);
    }
  }

  async function handleTemplate() {
    try {
      await downloadTemplate();
    } catch (err) {
      console.error(err);
      setFileError("Template could not be created.");
    }
  }

  async function handleImport() {
    const toSend = results
      .filter((r) => r.status === "valid")
      .map((r) => r.payload);

    if (!toSend.length || importing) return;

    setImporting(true);
    setImportError("");

    try {
      const path = mode === "free" ? "free-tests" : "tests";

      const response = await fetch(
        `${apiBase}/api/admin/${path}/${encodeURIComponent(
          testId
        )}/questions/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ questions: toSend }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        if (data.imported > 0) {
          // partly saved: the list must refresh when the modal closes
          setReport({
            imported: data.imported,
            skipped: [],
            failed: [],
            clientSkipped: [],
            clientFailed: [],
            partialMessage: data.message,
          });
          setStep("done");
          return;
        }

        throw new Error(data.message || "Import failed.");
      }

      setReport({
        imported: data.imported || 0,
        skipped: data.skipped || [],
        failed: data.failed || [],
        clientSkipped: results
          .filter((r) => r.status === "duplicate")
          .map((r) => ({ row: r.rowNumber, reason: r.errors[0] })),
        clientFailed: results
          .filter((r) => r.status === "error")
          .map((r) => ({
            row: r.rowNumber,
            reason: r.errors.join(", "),
          })),
      });

      setStep("done");
    } catch (err) {
      setImportError(err.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  /* ---------------- small render helpers ---------------- */

  function optionText(v, letter) {
    return lang === "hi"
      ? v[`option${letter}Hi`]
      : v[`option${letter}`];
  }

  // the whole language is left out on purpose (e.g. English-only question)
  function notProvided(r) {
    return (
      (lang === "hi" && r.language === "en") ||
      (lang === "en" && r.language === "hi")
    );
  }

  function emptyText(r) {
    return notProvided(r) ? (
      <em className="bq-muted">
        not provided in {lang === "hi" ? "Hindi" : "English"}
      </em>
    ) : (
      <em>(empty)</em>
    );
  }

  function renderRow(r) {
    const v = r.values;
    const answer = r.payload.correctAnswer;

    return (
      <article
        key={r.rowNumber}
        className={`bq-row bq-row-${r.status}`}
      >
        <header className="bq-row-head">
          <span className="bq-row-no">
            Row {r.rowNumber}
            {r.status !== "error" && r.language === "en" && (
              <span className="bq-tag">English only</span>
            )}
            {r.status !== "error" && r.language === "hi" && (
              <span className="bq-tag">हिन्दी only</span>
            )}
          </span>

          <span className={`bq-badge bq-badge-${r.status}`}>
            {r.status === "valid"
              ? "Ready"
              : r.status === "duplicate"
              ? "Duplicate"
              : "Needs fix"}
          </span>
        </header>

        <p className="bq-q" lang={lang === "hi" ? "hi" : "en"}>
          {(lang === "hi" ? v.questionTextHi : v.questionText) ||
            emptyText(r)}
        </p>

        <ul className="bq-options">
          {["A", "B", "C", "D"].map((L) => (
            <li
              key={L}
              className={answer === L ? "bq-correct" : ""}
              lang={lang === "hi" ? "hi" : "en"}
            >
              <b>{L}</b>
              <span>{optionText(v, L) || emptyText(r)}</span>
            </li>
          ))}
        </ul>

        {(r.status !== "valid" || r.warnings.length > 0) && (
          <ul className="bq-notes">
            {r.errors.map((m) => (
              <li key={m} className="bq-note-error">
                {m}
              </li>
            ))}
            {r.warnings.map((m) => (
              <li key={m} className="bq-note-warn">
                {m}
              </li>
            ))}
          </ul>
        )}
      </article>
    );
  }

  function renderIssueList(title, list, tone) {
    if (!list.length) return null;

    return (
      <div className={`bq-issues bq-issues-${tone}`}>
        <h4>
          {title} ({list.length})
        </h4>

        <ul>
          {list.slice(0, 50).map((x) => (
            <li key={`${x.row}-${x.reason}`}>
              <b>Row {x.row}</b> — {x.reason}
            </li>
          ))}
        </ul>

        {list.length > 50 && (
          <p>…and {list.length - 50} more.</p>
        )}
      </div>
    );
  }

  /* ---------------------- render ---------------------- */

  return (
    <div
      className="bq-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Import questions from Excel"
    >
      <div className="bq-modal">
        <div className="bq-header">
          <div>
            <span className="bq-eyebrow">
              {mode === "free" ? "FREE TEST" : "MOCK TEST"} · BILINGUAL
              IMPORT
            </span>
            <h2>Import questions from Excel</h2>
            <p>{testTitle}</p>
          </div>

          <button
            type="button"
            className="bq-close"
            onClick={handleClose}
            disabled={importing}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ------------- STEP 1: CHOOSE ------------- */}
        {step === "choose" && (
          <div className="bq-body">
            <ol className="bq-steps">
              <li>
                Download the bilingual template.
              </li>
              <li>
                One row = one question. English subject: fill English only.
                Hindi subject: fill Hindi only. GS / Maths / Reasoning:
                fill both in the <b>same row</b>. Answer key: A / B / C / D.
              </li>
              <li>
                Upload the file. You can check everything before saving.
              </li>
            </ol>

            <div className="bq-actions">
              <button
                type="button"
                className="bq-btn bq-btn-light"
                onClick={handleTemplate}
              >
                <Download size={17} />
                Download Template
              </button>

              <button
                type="button"
                className="bq-btn bq-btn-primary"
                onClick={() => fileInput.current?.click()}
                disabled={reading}
              >
                {reading ? (
                  <Loader2 size={17} className="bq-spin" />
                ) : (
                  <Upload size={17} />
                )}
                {reading ? "Reading file…" : "Choose Excel File"}
              </button>

              <input
                ref={fileInput}
                type="file"
                accept=".xlsx"
                hidden
                onChange={handleFile}
              />
            </div>

            <p className="bq-hint">
              Only .xlsx files · maximum {MAX_IMPORT_ROWS} questions per
              file · existing questions are never changed.
            </p>

            {fileError && (
              <div className="bq-alert bq-alert-error">
                <AlertCircle size={18} />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        )}

        {/* ------------- STEP 2: PREVIEW ------------- */}
        {step === "preview" && (
          <>
            <div className="bq-body bq-body-scroll">
              <div className="bq-file">
                <FileSpreadsheet size={18} />
                <span>{fileName}</span>
              </div>

              <div className="bq-summary">
                <div>
                  <strong>{results.length}</strong>
                  <span>Rows found</span>
                </div>
                <div className="bq-sum-ok">
                  <strong>{counts.valid}</strong>
                  <span>Ready to import</span>
                </div>
                <div className="bq-sum-bad">
                  <strong>{counts.error}</strong>
                  <span>Need fixing</span>
                </div>
                <div className="bq-sum-dup">
                  <strong>{counts.duplicate}</strong>
                  <span>Duplicates</span>
                </div>
              </div>

              {blankRows > 0 && (
                <p className="bq-hint">
                  {blankRows} blank row(s) ignored.
                </p>
              )}

              {counts.enOnly + counts.hiOnly > 0 && (
                <div className="bq-alert bq-alert-info">
                  <AlertCircle size={18} />
                  <span>
                    {counts.enOnly > 0 &&
                      `${counts.enOnly} question${
                        counts.enOnly === 1 ? " is" : "s are"
                      } English-only. `}
                    {counts.hiOnly > 0 &&
                      `${counts.hiOnly} question${
                        counts.hiOnly === 1 ? " is" : "s are"
                      } Hindi-only. `}
                    This is fine for English / Hindi subject tests, they
                    will import. If a student picks the other language,
                    they will see the language that is available. If you
                    did not mean this, fix the Excel file and upload
                    again.
                  </span>
                </div>
              )}

              {counts.error + counts.duplicate > 0 && (
                <div className="bq-alert bq-alert-warn">
                  <AlertCircle size={18} />
                  <span>
                    Rows marked “Needs fix” or “Duplicate” will be skipped.
                    Fix them in Excel and upload again, or import the ready
                    rows now.
                  </span>
                </div>
              )}

              <div className="bq-toolbar">
                <div className="bq-seg" role="group" aria-label="Language">
                  <button
                    type="button"
                    className={lang === "en" ? "on" : ""}
                    onClick={() => setLang("en")}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={lang === "hi" ? "on" : ""}
                    onClick={() => setLang("hi")}
                  >
                    हिन्दी
                  </button>
                </div>

                <div className="bq-seg" role="group" aria-label="Filter">
                  <button
                    type="button"
                    className={filter === "all" ? "on" : ""}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={filter === "valid" ? "on" : ""}
                    onClick={() => setFilter("valid")}
                  >
                    Ready
                  </button>
                  <button
                    type="button"
                    className={filter === "issues" ? "on" : ""}
                    onClick={() => setFilter("issues")}
                  >
                    Issues
                    {counts.error + counts.duplicate + counts.warning >
                      0 && (
                      <i>
                        {counts.error + counts.duplicate + counts.warning}
                      </i>
                    )}
                  </button>
                </div>
              </div>

              <div className="bq-list">
                {visibleRows.length === 0 ? (
                  <p className="bq-empty">Nothing to show here.</p>
                ) : (
                  visibleRows.map(renderRow)
                )}
              </div>
            </div>

            <div className="bq-footer">
              {importError && (
                <div className="bq-alert bq-alert-error">
                  <AlertCircle size={18} />
                  <span>{importError}</span>
                </div>
              )}

              <div className="bq-footer-buttons">
                <button
                  type="button"
                  className="bq-btn bq-btn-light"
                  onClick={() => {
                    setStep("choose");
                    setResults([]);
                    setImportError("");
                  }}
                  disabled={importing}
                >
                  Choose another file
                </button>

                <button
                  type="button"
                  className="bq-btn bq-btn-primary"
                  onClick={handleImport}
                  disabled={importing || counts.valid === 0}
                >
                  {importing ? (
                    <Loader2 size={17} className="bq-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {importing
                    ? "Importing…"
                    : `Import ${counts.valid} question${
                        counts.valid === 1 ? "" : "s"
                      }`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ------------- STEP 3: DONE ------------- */}
        {step === "done" && report && (
          <>
            <div className="bq-body bq-body-scroll">
              <div
                className={`bq-alert ${
                  report.partialMessage
                    ? "bq-alert-warn"
                    : "bq-alert-ok"
                }`}
              >
                {report.partialMessage ? (
                  <AlertCircle size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                <span>
                  {report.partialMessage ||
                    "Import finished. English and Hindi are saved together as one question."}
                </span>
              </div>

              <div className="bq-summary">
                <div className="bq-sum-ok">
                  <strong>{report.imported}</strong>
                  <span>Imported</span>
                </div>
                <div className="bq-sum-dup">
                  <strong>
                    {report.skipped.length + report.clientSkipped.length}
                  </strong>
                  <span>Skipped</span>
                </div>
                <div className="bq-sum-bad">
                  <strong>
                    {report.failed.length + report.clientFailed.length}
                  </strong>
                  <span>Failed</span>
                </div>
              </div>

              {renderIssueList(
                "Failed rows",
                [...report.clientFailed, ...report.failed],
                "bad"
              )}

              {renderIssueList(
                "Skipped rows",
                [...report.clientSkipped, ...report.skipped],
                "dup"
              )}
            </div>

            <div className="bq-footer">
              <div className="bq-footer-buttons">
                <button
                  type="button"
                  className="bq-btn bq-btn-primary"
                  onClick={handleClose}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BulkImportQuestions;