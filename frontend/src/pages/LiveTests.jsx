// Student page: /live
// - upcoming live tests: Register (a reminder mail + bell notice come before the start)
// - live now: anyone who is logged in can start, registered or not
// - ended: result link once the result has opened

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import "./LiveTests.css";

function token() {
  try {
    return localStorage.getItem("dishaToken") || "";
  } catch {
    return "";
  }
}

function when(value) {
  return new Date(value).toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function countdown(ms) {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

export default function LiveTests() {
  const navigate = useNavigate();
  const location = useLocation();

  const [lives, setLives] = useState([]);
  const [mine, setMine] = useState({ registered: [], attempts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState(() => {
    const until = location.state?.submittedUntil;
    if (!until) return "";
    return `Thank you for giving the live test! Your result and rank will open on ${new Date(until).toLocaleString("en-IN", {
      day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
    })}.`;
  });

  // server clock vs. phone clock, so the countdown is right even if the phone is wrong
  const offset = useRef(0);
  const [now, setNow] = useState(Date.now());

  const loggedIn = Boolean(token());

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/live`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load live tests.");

      if (data.serverNow) offset.current = new Date(data.serverNow).getTime() - Date.now();
      setLives(data.lives || []);
      setError("");

      if (token()) {
        const r = await fetch(`${API_BASE}/api/live/mine`, { headers: { Authorization: `Bearer ${token()}` } });
        if (r.ok) setMine(await r.json());
      }
    } catch (e) {
      setError(e.message || "Could not load live tests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const reload = setInterval(load, 60 * 1000); // pick up changes made by the admin
    return () => clearInterval(reload);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => clearInterval(tick);
  }, []);

  const registered = useMemo(() => new Set(mine.registered || []), [mine]);
  const attemptOf = useMemo(() => new Map((mine.attempts || []).map((a) => [String(a.liveId), a])), [mine]);

  async function toggleRegister(live, on) {
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    setBusyId(live.id);
    setNotice("");
    try {
      const res = await fetch(`${API_BASE}/api/live/${live.id}/register`, {
        method: on ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update. Please try again.");
      setMine((m) => ({
        ...m,
        registered: on ? [...new Set([...(m.registered || []), live.id])] : (m.registered || []).filter((x) => x !== live.id),
      }));
      setNotice(on ? "You are registered. We will remind you before it starts." : "Registration cancelled.");
      load();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusyId("");
    }
  }

  // phase from the (server-corrected) clock, so a card flips to LIVE without a reload
  const phaseOf = (l) => {
    if (now < new Date(l.startsAt).getTime()) return "upcoming";
    if (now < new Date(l.endsAt).getTime()) return "live";
    return "ended";
  };

  const live = lives.filter((l) => phaseOf(l) === "live");
  const upcoming = lives.filter((l) => phaseOf(l) === "upcoming");
  const ended = lives.filter((l) => phaseOf(l) === "ended").reverse();

  function card(l) {
    const phase = phaseOf(l);
    const isReg = registered.has(l.id);
    const attempt = attemptOf.get(l.id);
    const resultOpen = attempt && now >= new Date(attempt.releaseAt || l.releaseAt).getTime();

    return (
      <article key={l.id} className={`lt-card ${phase}`}>
        <div className="lt-top">
          <h3>{l.title}</h3>
          {phase === "live" && <span className="lt-badge now">&#9679; LIVE</span>}
          {phase === "upcoming" && isReg && <span className="lt-badge reg">Registered</span>}
        </div>

        <p className="lt-sub">
          {[l.exam, l.subject].filter(Boolean).join(" • ")}
        </p>

        <ul className="lt-facts">
          <li><b>{when(l.startsAt)}</b><span>Start</span></li>
          <li><b>{l.durationMinutes} min</b><span>Duration</span></li>
          <li><b>{l.totalQuestions}</b><span>Questions</span></li>
          <li><b>+{l.marksPerCorrect} / -{l.negativeMarking}</b><span>Marks</span></li>
        </ul>

        {l.note && <p className="lt-note">{l.note}</p>}

        {phase === "upcoming" && (
          <>
            <p className="lt-clock">Starts in <b>{countdown(new Date(l.startsAt).getTime() - now)}</b></p>
            <div className="lt-actions">
              {isReg ? (
                <button type="button" className="lt-btn ghost" disabled={busyId === l.id} onClick={() => toggleRegister(l, false)}>
                  Cancel registration
                </button>
              ) : (
                <button type="button" className="lt-btn primary" disabled={busyId === l.id} onClick={() => toggleRegister(l, true)}>
                  {busyId === l.id ? "Please wait..." : "Register for reminder"}
                </button>
              )}
            </div>
            <p className="lt-help">
              {isReg
                ? "You will get an email 1 hour and 10 minutes before the start, and a notice in the bell."
                : "Registering is optional. Even if you do not register, you can join when the test is live."}
            </p>
          </>
        )}

        {phase === "live" && (
          <>
            <p className="lt-clock red">Ends in <b>{countdown(new Date(l.endsAt).getTime() - now)}</b></p>
            <div className="lt-actions">
              {attempt ? (
                <button type="button" className="lt-btn ghost" disabled>You have submitted this test</button>
              ) : (
                <button type="button" className="lt-btn live" onClick={() => navigate(`/mock-test/${l.testId}`)}>
                  Start test now
                </button>
              )}
            </div>
            {!loggedIn && <p className="lt-help">You will be asked to log in first. The test is free for everyone while it is live.</p>}
            {!attempt && loggedIn && (
              <p className="lt-help">
                The test closes for everybody at the same time, so joining late means less time.
              </p>
            )}
            {attempt && !resultOpen && (
              <p className="lt-help">Your result and rank open on {when(attempt.releaseAt || l.releaseAt)}.</p>
            )}
          </>
        )}

        {phase === "ended" && (
          <div className="lt-actions">
            {attempt && resultOpen ? (
              <Link className="lt-btn primary" to={`/test-result/${attempt.resultId}`}>View result &amp; rank</Link>
            ) : attempt ? (
              <p className="lt-help">Your result and rank open on {when(attempt.releaseAt || l.releaseAt)}.</p>
            ) : (
              <p className="lt-help">This live test has ended.</p>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <main className="lt-page">
      <h1 className="lt-title">Live Tests</h1>

      <div className="lt-wrap">
        {notice && <div className="lt-flash" role="status">{notice}</div>}
        {error && <div className="lt-flash bad">{error}</div>}
        {loading && <div className="lt-empty">Loading live tests...</div>}

        {!loading && !error && !lives.length && (
          <div className="lt-empty">No live test is scheduled right now. Check again soon.</div>
        )}

        {live.length > 0 && (
          <>
            <h2 className="lt-h">Live now</h2>
            {live.map(card)}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <h2 className="lt-h">Upcoming</h2>
            {upcoming.map(card)}
          </>
        )}

        {ended.length > 0 && (
          <>
            <h2 className="lt-h">Recently ended</h2>
            {ended.map(card)}
          </>
        )}
      </div>
    </main>
  );
}