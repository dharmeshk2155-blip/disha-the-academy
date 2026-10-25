// Admin > Live Tests: schedule a live test, see who registered, edit / cancel.
// The questions, marks and duration still come from the normal Tests pages.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarClock, Loader2, Pencil, Plus, Radio, RefreshCw, Trash2, Users, X } from "lucide-react";
import { API_BASE } from "../../config/api";
import "./AdminLive.css";

const PHASE = {
  upcoming: { label: "Upcoming", cls: "up" },
  live: { label: "LIVE NOW", cls: "now" },
  ended: { label: "Ended", cls: "end" },
  cancelled: { label: "Cancelled", cls: "off" },
};

function fmt(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time
function toLocalInput(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function delayText(minutes) {
  const m = Number(minutes) || 0;
  if (!m) return "right after the test ends";
  if (m % 1440 === 0) return `${m / 1440} day(s) after the test ends`;
  if (m % 60 === 0) return `${m / 60} hour(s) after the test ends`;
  return `${m} min after the test ends`;
}

const EMPTY = { id: "", testId: "", testTitle: "", durationMinutes: 0, startsAt: "", endsAt: "", resultDelayMinutes: 120, note: "", phase: "upcoming" };

export default function AdminLive() {
  const { adminToken } = useOutletContext();

  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const [pickQuery, setPickQuery] = useState("");
  const [picks, setPicks] = useState([]);
  const [picking, setPicking] = useState(false);

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }),
    [adminToken]
  );

  const api = useCallback(
    async (path, method = "GET", body) => {
      const response = await fetch(`${API_BASE}/api/admin/live${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.message || data.error || "Something went wrong.");
      return data;
    },
    [headers]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/");
      setLives(data.lives || []);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  // test picker (only while adding a new live test)
  useEffect(() => {
    if (!form || form.id) return undefined;
    let alive = true;
    const timer = setTimeout(async () => {
      setPicking(true);
      try {
        const data = await api(`/tests?q=${encodeURIComponent(pickQuery)}`);
        if (alive) setPicks(data.tests || []);
      } catch {
        if (alive) setPicks([]);
      } finally {
        if (alive) setPicking(false);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [api, form, pickQuery]);

  const flash = (type, text) => setMessage({ type, text });

  function openNew() {
    setPickQuery("");
    setPicks([]);
    setForm({ ...EMPTY });
  }

  function openEdit(live) {
    setForm({
      id: live.id,
      testId: live.testId,
      testTitle: live.title,
      durationMinutes: live.durationMinutes,
      startsAt: toLocalInput(live.startsAt),
      endsAt: toLocalInput(live.endsAt),
      resultDelayMinutes: live.resultDelayMinutes,
      note: live.note || "",
      phase: live.phase,
    });
  }

  // when the start time is chosen, suggest: end = start + test time + 30 min
  function setStart(value) {
    setForm((f) => {
      const next = { ...f, startsAt: value };
      const start = new Date(value);
      if (!Number.isNaN(start.getTime()) && f.durationMinutes) {
        const end = new Date(start.getTime() + (f.durationMinutes + 30) * 60000);
        const current = new Date(f.endsAt);
        if (!f.endsAt || Number.isNaN(current.getTime()) || current <= start) next.endsAt = toLocalInput(end);
      }
      return next;
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!form.testId) return flash("error", "Choose a test first.");
    if (!form.startsAt || !form.endsAt) return flash("error", "Choose the start and end time.");

    setBusy(true);
    try {
      const body = {
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        resultDelayMinutes: Number(form.resultDelayMinutes) || 0,
        note: form.note,
      };
      if (form.id) {
        await api(`/${form.id}`, "PUT", body);
        flash("success", "Live test updated.");
      } else {
        await api("/", "POST", { ...body, testId: form.testId });
        flash("success", "Live test scheduled. Students can register now.");
      }
      setForm(null);
      await load();
    } catch (error) {
      flash("error", error.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(live) {
    if (!window.confirm(`Cancel "${live.title}"? Students will no longer see it.`)) return;
    try {
      await api(`/${live.id}/cancel`, "POST");
      flash("success", "Live test cancelled.");
      await load();
    } catch (error) {
      flash("error", error.message);
    }
  }

  async function remove(live) {
    if (!window.confirm(`Delete "${live.title}" permanently?`)) return;
    try {
      await api(`/${live.id}`, "DELETE");
      flash("success", "Live test deleted.");
      await load();
    } catch (error) {
      flash("error", error.message);
    }
  }

  const active = lives.filter((l) => l.phase === "live" || l.phase === "upcoming");
  const past = lives.filter((l) => l.phase === "ended" || l.phase === "cancelled");

  const card = (l) => {
    const ph = PHASE[l.phase] || PHASE.upcoming;
    return (
      <article key={l.id} className="al-card">
        <div className="al-card-top">
          <h3>{l.title}</h3>
          <span className={`al-ph ${ph.cls}`}>{ph.label}</span>
        </div>
        <p className="al-meta"><CalendarClock size={14} /> {fmt(l.startsAt)} &rarr; {fmt(l.endsAt)}</p>
        <p className="al-meta">Test time: {l.durationMinutes} min &bull; Result opens {fmt(l.releaseAt)} ({delayText(l.resultDelayMinutes)})</p>
        {l.note && <p className="al-note">{l.note}</p>}
        <div className="al-stats">
          <span><Users size={14} /> {l.registrations} registered</span>
          <span>{l.attempts} gave the test</span>
        </div>
        {(l.phase === "upcoming" || l.phase === "live") && (
          <div className="al-actions">
            <button type="button" className="al-btn ghost small" onClick={() => openEdit(l)}><Pencil size={14} /> Edit</button>
            <button type="button" className="al-btn danger small" onClick={() => cancel(l)}><X size={14} /> Cancel</button>
          </div>
        )}
        {l.phase === "cancelled" && (
          <div className="al-actions">
            <button type="button" className="al-btn danger small" onClick={() => remove(l)}><Trash2 size={14} /> Delete</button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="al-page">
      <div className="al-head">
        <div>
          <h2><Radio size={22} /> Live Tests</h2>
          <p>
            Schedule a test for a fixed time. Students register in advance and get a reminder; anyone who did not register can
            still join while the test is live. Everybody's test ends at the same moment, and the result opens later.
          </p>
        </div>
        <div className="al-head-actions">
          <button type="button" className="al-btn ghost" onClick={load}><RefreshCw size={16} /> Refresh</button>
          <button type="button" className="al-btn primary" onClick={openNew}><Plus size={16} /> Schedule live test</button>
        </div>
      </div>

      {message.text && (
        <div className={`al-msg ${message.type}`} role="status">
          <span>{message.text}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setMessage({ type: "", text: "" })}><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <div className="al-empty"><Loader2 className="al-spin" size={20} /> Loading...</div>
      ) : (
        <>
          <h4 className="al-sub">Upcoming &amp; live</h4>
          {active.length ? active.map(card) : <div className="al-empty">No live test is scheduled. Use "Schedule live test".</div>}

          {past.length > 0 && (
            <>
              <h4 className="al-sub">Past</h4>
              {past.map(card)}
            </>
          )}
        </>
      )}

      {form && (
        <div className="al-overlay" role="dialog" aria-modal="true">
          <form className="al-modal" onSubmit={save}>
            <div className="al-modal-head">
              <h3>{form.id ? "Edit live test" : "Schedule live test"}</h3>
              <button type="button" aria-label="Close" onClick={() => setForm(null)}><X size={18} /></button>
            </div>

            {form.id ? (
              <p className="al-picked">{form.testTitle} <small>({form.durationMinutes} min)</small></p>
            ) : (
              <div className="al-field">
                <label>Test</label>
                {form.testId ? (
                  <p className="al-picked">
                    {form.testTitle} <small>({form.durationMinutes} min)</small>
                    <button type="button" className="al-link" onClick={() => setForm({ ...form, testId: "", testTitle: "", durationMinutes: 0 })}>change</button>
                  </p>
                ) : (
                  <>
                    <input type="search" value={pickQuery} onChange={(e) => setPickQuery(e.target.value)} placeholder="Search your tests by name..." />
                    <div className="al-picks">
                      {picking && <div className="al-pick-note">Searching...</div>}
                      {!picking && !picks.length && <div className="al-pick-note">No tests found.</div>}
                      {picks.map((t) => (
                        <button
                          type="button"
                          key={t.testId}
                          className="al-pick"
                          disabled={!t.questions}
                          onClick={() => setForm({ ...form, testId: t.testId, testTitle: t.title, durationMinutes: t.durationMinutes })}
                        >
                          <strong>{t.title}</strong>
                          <span>{t.exam} &bull; {t.durationMinutes} min &bull; {t.questions} questions{t.questions ? "" : " (no questions yet)"}</span>
                        </button>
                      ))}
                    </div>
                    <small className="al-hint">Tip: a test that is scheduled live is hidden from the normal test lists until the live window is over.</small>
                  </>
                )}
              </div>
            )}

            <div className="al-grid">
              <div className="al-field">
                <label>Starts at</label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  disabled={form.id && form.phase !== "upcoming"}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>
              <div className="al-field">
                <label>Ends at</label>
                <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
              </div>
            </div>
            <small className="al-hint">
              Students can join between these two times. Someone who joins late gets less time, because the test closes for everybody at the end time.
            </small>

            <div className="al-field">
              <label>Result and rank open after</label>
              <select value={form.resultDelayMinutes} onChange={(e) => setForm({ ...form, resultDelayMinutes: Number(e.target.value) })}>
                <option value={0}>Right after the test ends</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={360}>6 hours</option>
                <option value={720}>12 hours</option>
                <option value={1440}>1 day</option>
              </select>
            </div>

            <div className="al-field">
              <label>Note for students (optional)</label>
              <input type="text" maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Syllabus: Polity chapters 1-5" />
            </div>

            <div className="al-modal-foot">
              <button type="button" className="al-btn ghost" onClick={() => setForm(null)}>Close</button>
              <button type="submit" className="al-btn primary" disabled={busy}>
                {busy ? <Loader2 className="al-spin" size={16} /> : <CalendarClock size={16} />} {form.id ? "Save changes" : "Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
