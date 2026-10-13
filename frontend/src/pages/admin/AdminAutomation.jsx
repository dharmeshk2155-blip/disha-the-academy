import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Rss,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { API_BASE } from "../../config/api";
import "./AdminAutomation.css";

const TABS = [
  { key: "pending", label: "Pending Review", count: "pending_review" },
  { key: "attention", label: "Needs Attention", count: "needs_attention" },
  { key: "scheduled", label: "Approved / Scheduled", count: ["approved", "scheduled"] },
  { key: "published", label: "Published", count: "published" },
  { key: "rejected", label: "Rejected", count: "rejected" },
  { key: "failed", label: "Failed", count: "failed" },
];

const STATUS_LABEL = {
  discovered: "Discovered",
  processing: "Processing",
  pending_review: "Pending review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  rejected: "Rejected",
  needs_attention: "Needs attention",
  failed: "Failed",
  archived: "Archived",
};

const EMPTY_MANUAL = {
  url: "",
  sourceName: "PIB",
  title: "",
  publishedAt: "",
  category: "National",
  language: "en",
  text: "",
};

const EMPTY_SOURCE = {
  name: "",
  url: "",
  category: "National",
  language: "en",
  reliability: "official",
  termsNote: "",
  active: true,
};

// ---------- PNG card (drawn in the browser, so Hindi fonts always work) ----------
const CARD_FONT = '"Noto Sans Devanagari","Nirmala UI","Mangal","Segoe UI",Arial,sans-serif';

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(canvas, { title, category, dateText }) {
  const W = 1200;
  const H = 675;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a1a3f");
  bg.addColorStop(1, "#1a3d94");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath();
  ctx.arc(W - 120, 90, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W - 360, H + 40, 220, 0, Math.PI * 2);
  ctx.fill();

  // category pill
  const label = String(category || "Current Affairs").toUpperCase();
  ctx.font = `800 28px ${CARD_FONT}`;
  const pillW = ctx.measureText(label).width + 56;
  ctx.fillStyle = "#f5b301";
  roundRect(ctx, 70, 64, pillW, 56, 28);
  ctx.fill();
  ctx.fillStyle = "#0a1a3f";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 98, 93);

  // headline: shrink until it fits in 4 lines
  const maxW = W - 140;
  let size = 68;
  let lines = [];
  while (size >= 38) {
    ctx.font = `800 ${size}px ${CARD_FONT}`;
    lines = wrapLines(ctx, title, maxW);
    if (lines.length <= 4) break;
    size -= 4;
  }
  if (lines.length > 4) {
    lines = lines.slice(0, 4);
    lines[3] = `${lines[3].replace(/\s+\S*$/, "")}...`;
  }
  const lineH = Math.round(size * 1.28);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, 70, 170 + i * lineH));

  // footer
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(70, H - 130, W - 140, 2);

  ctx.fillStyle = "#f5b301";
  ctx.beginPath();
  ctx.arc(106, H - 66, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a1a3f";
  ctx.font = `800 38px ${CARD_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("D", 106, H - 65);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 32px ${CARD_FONT}`;
  ctx.fillText("DISHA THE ACADEMY", 160, H - 80);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `600 24px ${CARD_FONT}`;
  ctx.fillText(`Current Affairs  \u2022  ${dateText}`, 160, H - 44);
}

function todayText() {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function cardKey(edit) {
  return `${edit.title}|${edit.category}`;
}

function fmt(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countFor(counts, def) {
  const keys = Array.isArray(def) ? def : [def];
  return keys.reduce((sum, k) => sum + (counts?.[k] || 0), 0);
}

export default function AdminAutomation() {
  const { adminToken } = useOutletContext();

  const [view, setView] = useState("drafts");
  const [tab, setTab] = useState("pending");
  const [overview, setOverview] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [paging, setPaging] = useState({ page: 1, pages: 1, total: 0 });
  const [sources, setSources] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [filters, setFilters] = useState({ q: "", category: "", from: "", to: "" });
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(null); // opened draft detail
  const [manualForm, setManualForm] = useState(null);
  const [sourceForm, setSourceForm] = useState(null);
  const [sourceEditing, setSourceEditing] = useState("");
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }),
    [adminToken]
  );

  const api = useCallback(
    async (path, method = "GET", body) => {
      const response = await fetch(`${API_BASE}/api/admin/automation${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        const err = new Error(data.message || data.error || "Something went wrong.");
        err.details = data.details;
        throw err;
      }
      return data;
    },
    [headers]
  );

  const flash = (type, text) => setMessage({ type, text });

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await api("/overview"));
    } catch (e) {
      flash("error", e.message);
    }
  }, [api]);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ tab, page: String(page) });
      Object.entries(filters).forEach(([k, v]) => v && qs.set(k, v));
      const data = await api(`/drafts?${qs}`);
      setDrafts(data.drafts);
      setPaging({ page: data.page, pages: data.pages, total: data.total });
    } catch (e) {
      flash("error", e.message);
    } finally {
      setLoading(false);
    }
  }, [api, tab, page, filters]);

  const loadSources = useCallback(async () => {
    try {
      setSources((await api("/sources")).sources);
    } catch (e) {
      flash("error", e.message);
    }
  }, [api]);

  const loadJobs = useCallback(async () => {
    try {
      setJobs((await api("/jobs")).jobs);
    } catch (e) {
      flash("error", e.message);
    }
  }, [api]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (view === "drafts") loadDrafts();
  }, [view, loadDrafts]);

  useEffect(() => {
    if (view === "sources") loadSources();
    if (view === "jobs") loadJobs();
  }, [view, loadSources, loadJobs]);

  const refreshAll = () => {
    loadOverview();
    if (view === "drafts") loadDrafts();
  };

  async function openDraft(id) {
    try {
      const data = await api(`/drafts/${id}`);
      setOpen({ ...data, edit: { ...data.draft, keyPointsText: data.draft.keyPoints.join("\n"), tagsText: data.draft.tags.join(", "), sourceText: data.draft.sourceUrls.join("\n") }, rejecting: false, reason: "", scheduleAt: "", problems: [], withImage: true, imgUrl: data.draft.imageUrl || "", imgKey: data.draft.imageUrl ? cardKey(data.draft) : "" });
    } catch (e) {
      flash("error", e.message);
    }
  }

  async function runNow() {
    setBusy(true);
    try {
      const data = await api("/run", "POST");
      flash("success", data.message);
    } catch (e) {
      flash("error", e.message);
    } finally {
      setBusy(false);
    }
  }

  // ---------------- draft actions ----------------
  async function doAction(fn, okText) {
    setBusy(true);
    setOpen((o) => (o ? { ...o, problems: [] } : o));
    try {
      await fn();
      flash("success", okText);
      setOpen(null);
      refreshAll();
    } catch (e) {
      setOpen((o) => (o ? { ...o, problems: e.details || [e.message] } : o));
      if (!open) flash("error", e.message);
    } finally {
      setBusy(false);
    }
  }

  // redraw the PNG card whenever headline / category change
  const cardTitle = open?.edit.title;
  const cardCategory = open?.edit.category;
  const cardOn = Boolean(open?.withImage);
  useEffect(() => {
    if (!cardOn || !cardRef.current) return;
    drawCard(cardRef.current, { title: cardTitle, category: cardCategory, dateText: todayText() });
  }, [cardOn, cardTitle, cardCategory, open?.draft.id]);

  function downloadCard() {
    const link = document.createElement("a");
    link.download = "current-affair-card.png";
    link.href = cardRef.current.toDataURL("image/png");
    link.click();
  }

  // uploads the card once per headline/category; returns the https link ("" = no image)
  async function ensureImage() {
    if (!open.withImage) return "";
    const key = cardKey(open.edit);
    if (open.imgUrl && open.imgKey === key) return open.imgUrl;

    drawCard(cardRef.current, { title: open.edit.title, category: open.edit.category, dateText: todayText() });
    const blob = await new Promise((resolve) => cardRef.current.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not create the image.");

    const form = new FormData();
    form.append("image", blob, "current-affair-card.png");
    const response = await fetch(`${API_BASE}/api/current-affairs/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.imageUrl) {
      throw new Error(data.error || data.message || "Image upload failed. Check your Cloudinary settings, or switch off \"Add PNG image\".");
    }
    setOpen((o) => (o ? { ...o, imgUrl: data.imageUrl, imgKey: key } : o));
    return data.imageUrl;
  }

  function editBody(imageUrl) {
    const e = open.edit;
    return {
      title: e.title,
      summary: e.summary,
      body: e.body,
      category: e.category,
      language: e.language,
      targetType: e.targetType,
      keyPoints: e.keyPointsText,
      tags: e.tagsText,
      sourceUrls: e.sourceText,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    };
  }

  async function saveEdits() {
    setBusy(true);
    try {
      const img = await ensureImage();
      const data = await api(`/drafts/${open.draft.id}`, "PUT", editBody(img));
      const d = data.draft;
      setOpen((o) => ({ ...o, draft: d, edit: { ...d, keyPointsText: d.keyPoints.join("\n"), tagsText: d.tags.join(", "), sourceText: d.sourceUrls.join("\n") }, problems: d.validationErrors }));
      flash("success", "Draft saved.");
      loadDrafts();
      loadOverview();
    } catch (e) {
      setOpen((o) => ({ ...o, problems: e.details || [e.message] }));
    } finally {
      setBusy(false);
    }
  }

  const approve = () =>
    doAction(async () => {
      const img = await ensureImage();
      await api(`/drafts/${open.draft.id}`, "PUT", editBody(img)); // always publish what is on screen
      await api(`/drafts/${open.draft.id}/approve`, "POST", { targetType: open.edit.targetType });
    }, "Published successfully.");

  const schedule = () =>
    doAction(async () => {
      if (!open.scheduleAt) throw new Error("Choose a date and time first.");
      const img = await ensureImage();
      await api(`/drafts/${open.draft.id}`, "PUT", editBody(img));
      await api(`/drafts/${open.draft.id}/schedule`, "POST", {
        publishAt: new Date(open.scheduleAt).toISOString(),
        targetType: open.edit.targetType,
      });
    }, "Scheduled.");

  const reject = () =>
    doAction(() => api(`/drafts/${open.draft.id}/reject`, "POST", { reason: open.reason }), "Draft rejected.");

  const regenerate = () =>
    doAction(() => api(`/drafts/${open.draft.id}/regenerate`, "POST"), "Draft regenerated. Open it again to review.");

  const restore = () =>
    doAction(() => api(`/drafts/${open.draft.id}/restore`, "POST"), "Draft moved back to review.");

  const archive = () =>
    doAction(() => api(`/drafts/${open.draft.id}/archive`, "POST"), "Draft archived.");

  async function createManual(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api("/drafts/manual", "POST", manualForm);
      setManualForm(null);
      flash("success", "Draft created. Review it below.");
      setView("drafts");
      setTab(data.draft.status === "needs_attention" ? "attention" : "pending");
      setPage(1);
      refreshAll();
    } catch (e) {
      flash("error", e.message);
      setManualForm((f) => f);
    } finally {
      setBusy(false);
    }
  }

  // ---------------- sources ----------------
  async function saveSource(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(sourceEditing ? `/sources/${sourceEditing}` : "/sources", sourceEditing ? "PUT" : "POST", sourceForm);
      setSourceForm(null);
      setSourceEditing("");
      flash("success", "Source saved.");
      loadSources();
    } catch (e) {
      flash("error", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function testSource(id) {
    try {
      const data = await api(`/sources/${id}/test`, "POST");
      flash("success", `Feed OK - ${data.count} items. Latest: "${data.sample[0]?.title || "-"}"`);
      loadSources();
    } catch (e) {
      flash("error", e.message);
    }
  }

  async function removeSource(id) {
    if (!window.confirm("Delete this source? Existing drafts are kept.")) return;
    try {
      await api(`/sources/${id}`, "DELETE");
      loadSources();
    } catch (e) {
      flash("error", e.message);
    }
  }

  async function toggleSource(s) {
    try {
      await api(`/sources/${s.id}`, "PUT", { ...s, active: !s.active });
      loadSources();
    } catch (e) {
      flash("error", e.message);
    }
  }

  const categories = overview?.categories || [];
  const cfg = overview?.settings;
  const counts = overview?.counts;
  const editable = open && ["pending_review", "needs_attention", "failed", "rejected", "approved", "scheduled"].includes(open.draft.status);
  const reviewable = open && ["pending_review", "needs_attention", "approved", "scheduled"].includes(open.draft.status);

  return (
    <div className="aa-page">
      <div className="aa-head">
        <div>
          <h2>Automated Content</h2>
          <p>
            Trusted sources are checked automatically and AI writes draft articles. Nothing is shown on the website
            until you review and approve it here.
          </p>
        </div>
        <div className="aa-head-actions">
          <button type="button" className="aa-btn ghost" onClick={refreshAll}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button type="button" className="aa-btn ghost" onClick={() => setManualForm({ ...EMPTY_MANUAL })}>
            <Plus size={16} /> Add from text
          </button>
          <button type="button" className="aa-btn primary" onClick={runNow} disabled={busy || (cfg && !cfg.aiConfigured)}>
            <Play size={16} /> Check sources now
          </button>
        </div>
      </div>

      {cfg && (
        <div className="aa-status">
          <span className={cfg.aiConfigured ? "ok" : "bad"}>AI: {cfg.aiConfigured ? `ready (${cfg.model})` : "API key missing"}</span>
          <span className={cfg.enabled ? "ok" : "warn"}>Auto-check: {cfg.enabled ? `every ${cfg.intervalMinutes} min` : "off"}</span>
          <span className={cfg.cronConfigured ? "ok" : "warn"}>External cron: {cfg.cronConfigured ? "secret set" : "not set"}</span>
          <span className={cfg.retentionDays ? "ok" : "warn"}>Auto-delete: {cfg.retentionDays ? `after ${cfg.retentionDays} days` : "off"}</span>
          <span>Limit: {cfg.maxDraftsPerDay} drafts/day</span>
          <span>AI today: {overview.usage24h.aiCalls} calls</span>
        </div>
      )}

      {message.text && (
        <div className={`aa-msg ${message.type}`} role="status">
          <span>{message.text}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setMessage({ type: "", text: "" })}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="aa-views">
        {[["drafts", "Review queue"], ["sources", "Sources"], ["jobs", "Job log"]].map(([k, l]) => (
          <button key={k} type="button" className={view === k ? "on" : ""} onClick={() => setView(k)}>
            {l}
          </button>
        ))}
      </div>

      {/* ================= DRAFTS ================= */}
      {view === "drafts" && (
        <>
          <div className="aa-chips">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={tab === t.key ? "on" : ""}
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
              >
                {t.label} <b>{countFor(counts, t.count)}</b>
              </button>
            ))}
          </div>

          <div className="aa-filters">
            <label className="aa-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search title"
                value={filters.q}
                onChange={(e) => {
                  setFilters({ ...filters, q: e.target.value });
                  setPage(1);
                }}
              />
            </label>
            <select value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input type="date" aria-label="From date" value={filters.from} onChange={(e) => { setFilters({ ...filters, from: e.target.value }); setPage(1); }} />
            <input type="date" aria-label="To date" value={filters.to} onChange={(e) => { setFilters({ ...filters, to: e.target.value }); setPage(1); }} />
          </div>

          {loading ? (
            <div className="aa-empty"><Loader2 className="aa-spin" size={20} /> Loading...</div>
          ) : drafts.length === 0 ? (
            <div className="aa-empty">No drafts here.</div>
          ) : (
            <div className="aa-list">
              {drafts.map((d) => (
                <article key={d.id} className="aa-card">
                  <h3>{d.title || "(untitled)"}</h3>
                  <p className="aa-meta">
                    {d.category} • {d.language === "hi" ? "Hindi" : "English"} • {d.sourceName || "Unknown source"} • Source date: {fmt(d.sourcePublishedAt)}
                  </p>
                  <p className="aa-meta">AI draft generated: {fmt(d.generatedAt || d.createdAt)}{d.publishAt ? ` • Scheduled: ${fmt(d.publishAt)}` : ""}</p>
                  {d.summary && <p className="aa-sum">{d.summary}</p>}
                  <div className="aa-tags">
                    <span className={`aa-st ${d.status}`}>{STATUS_LABEL[d.status]}</span>
                    {d.needsHumanVerification && <span className="aa-warn"><AlertTriangle size={13} /> Verify facts</span>}
                    {d.warnings.slice(0, 2).map((w) => (
                      <span key={w} className="aa-warn">{w}</span>
                    ))}
                    {d.validationErrors.length > 0 && <span className="aa-err">{d.validationErrors.length} problem(s)</span>}
                    {d.lastError && <span className="aa-err">{d.lastError}</span>}
                  </div>
                  <div className="aa-card-actions">
                    {d.sourceUrls.slice(0, 2).map((u, i) => (
                      <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow">
                        Open source {i + 1} <ExternalLink size={13} />
                      </a>
                    ))}
                    <button type="button" className="aa-btn primary small" onClick={() => openDraft(d.id)}>
                      Review
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {paging.pages > 1 && (
            <div className="aa-pager">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {paging.page} of {paging.pages}</span>
              <button type="button" disabled={page >= paging.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* ================= SOURCES ================= */}
      {view === "sources" && (
        <>
          <div className="aa-bar">
            <p>Only add official or reputable RSS/Atom feeds, and respect each site&apos;s terms. Paywalled or login pages must not be used.</p>
            <button type="button" className="aa-btn primary" onClick={() => { setSourceForm({ ...EMPTY_SOURCE }); setSourceEditing(""); }}>
              <Plus size={16} /> Add source
            </button>
          </div>
          {sources.length === 0 ? (
            <div className="aa-empty">No sources yet. Add a feed to start collecting.</div>
          ) : (
            <div className="aa-list">
              {sources.map((s) => (
                <article key={s.id} className="aa-card">
                  <h3><Rss size={15} /> {s.name}</h3>
                  <p className="aa-meta aa-url">{s.url}</p>
                  <p className="aa-meta">{s.category} • {s.language === "hi" ? "Hindi" : "English"} • {s.reliability} • Last checked: {fmt(s.lastCheckedAt)}</p>
                  <div className="aa-tags">
                    <span className={`aa-st ${s.active ? "published" : "rejected"}`}>{s.active ? "Active" : "Paused"}</span>
                    {s.lastError && <span className="aa-err">{s.lastError}</span>}
                    {s.consecutiveFailures >= 3 && <span className="aa-err">{s.consecutiveFailures} failures in a row</span>}
                  </div>
                  <div className="aa-card-actions">
                    <button type="button" className="aa-btn ghost small" onClick={() => testSource(s.id)}>Test feed</button>
                    <button type="button" className="aa-btn ghost small" onClick={() => { setSourceForm({ ...EMPTY_SOURCE, ...s }); setSourceEditing(s.id); }}>Edit</button>
                    <button type="button" className="aa-btn ghost small" onClick={() => toggleSource(s)}>{s.active ? "Pause" : "Resume"}</button>
                    <button type="button" className="aa-btn danger small" onClick={() => removeSource(s.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= JOBS ================= */}
      {view === "jobs" && (
        <div className="aa-list">
          {jobs.length === 0 && <div className="aa-empty">No runs yet.</div>}
          {jobs.map((j) => (
            <article key={j.id} className="aa-card">
              <h3>
                {fmt(j.startedAt)} <span className={`aa-st ${j.status === "success" ? "published" : j.status === "running" ? "pending_review" : "needs_attention"}`}>{j.status}</span>
              </h3>
              <p className="aa-meta">
                Trigger: {j.trigger} • Sources: {j.sourcesChecked} • Items: {j.itemsFound} • Duplicates: {j.duplicates} • Too old: {j.skippedOld} • Drafts: {j.draftsCreated} • Needs attention: {j.needsAttention}
              </p>
              <p className="aa-meta">AI calls: {j.aiCalls} • Tokens in/out: {j.inputTokens}/{j.outputTokens}</p>
              {j.notes?.length > 0 && (
                <ul className="aa-notes">
                  {j.notes.map((n, i) => (<li key={i}>{n}</li>))}
                </ul>
              )}
              {j.errorLog?.length > 0 && (
                <ul className="aa-errors">
                  {j.errorLog.slice(0, 6).map((e, i) => (<li key={i}>{e}</li>))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ================= DRAFT DETAIL ================= */}
      {open && (
        <div className="aa-modal" role="dialog" aria-modal="true">
          <div className="aa-sheet">
            <div className="aa-sheet-head">
              <div>
                <span className={`aa-st ${open.draft.status}`}>{STATUS_LABEL[open.draft.status]}</span>
                <h3>Review draft</h3>
              </div>
              <button type="button" className="aa-x" aria-label="Close" onClick={() => setOpen(null)}><X size={20} /></button>
            </div>

            <div className="aa-sheet-body">
              {open.problems.length > 0 && (
                <div className="aa-box bad">
                  <b>Fix these first:</b>
                  <ul>{open.problems.map((p, i) => (<li key={i}>{p}</li>))}</ul>
                </div>
              )}
              {open.draft.warnings.length > 0 && (
                <div className="aa-box warn">
                  <b>Warnings</b>
                  <ul>{open.draft.warnings.map((p, i) => (<li key={i}>{p}</li>))}</ul>
                </div>
              )}
              {open.draft.factCheckNotes.length > 0 && (
                <div className="aa-box warn">
                  <b>Fact-check notes from AI</b>
                  <ul>{open.draft.factCheckNotes.map((p, i) => (<li key={i}>{p}</li>))}</ul>
                </div>
              )}
              {open.draft.lastError && <div className="aa-box bad">{open.draft.lastError}</div>}
              {open.draft.rejectionReason && <div className="aa-box">Rejected: {open.draft.rejectionReason}</div>}

              <div className="aa-links">
                <b>Source ({open.draft.sourceName || "unknown"}), published {fmt(open.draft.sourcePublishedAt)}:</b>
                {open.draft.sourceUrls.map((u, i) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow">Open source {i + 1} <ExternalLink size={13} /></a>
                ))}
              </div>
              {open.draft.sourceSnippet && (
                <details className="aa-snippet">
                  <summary>Original source text used by AI</summary>
                  <p>{open.draft.sourceSnippet}</p>
                </details>
              )}

              <fieldset disabled={!editable || busy} className="aa-form">
                <label>Title<input value={open.edit.title} maxLength={200} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, title: e.target.value } })} /></label>
                <div className="aa-row">
                  <label>Category
                    <select value={open.edit.category} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, category: e.target.value } })}>
                      {categories.map((c) => (<option key={c}>{c}</option>))}
                    </select>
                  </label>
                  <label>Language
                    <select value={open.edit.language} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, language: e.target.value } })}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </label>
                  <label>Publish as
                    <select value={open.edit.targetType} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, targetType: e.target.value } })}>
                      <option value="currentAffair">Current Affair</option>
                      <option value="blog">Blog post</option>
                    </select>
                  </label>
                </div>
                <label>Summary<textarea rows={3} value={open.edit.summary} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, summary: e.target.value } })} /></label>
                <label>Article<textarea rows={10} value={open.edit.body} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, body: e.target.value } })} /></label>
                <label>Key points (one per line)<textarea rows={5} value={open.edit.keyPointsText} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, keyPointsText: e.target.value } })} /></label>
                <label>Tags (comma separated)<input value={open.edit.tagsText} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, tagsText: e.target.value } })} /></label>
                <label>Source links (one per line)<textarea rows={2} value={open.edit.sourceText} onChange={(e) => setOpen({ ...open, edit: { ...open.edit, sourceText: e.target.value } })} /></label>
              </fieldset>

              {reviewable && (
                <div className="aa-box aa-img">
                  <label className="aa-check">
                    <input type="checkbox" checked={open.withImage} onChange={(e) => setOpen({ ...open, withImage: e.target.checked })} />
                    <b>Add PNG image to this post</b>
                  </label>
                  {open.withImage && (
                    <>
                      <canvas ref={cardRef} className="aa-canvas" aria-label="Preview of the PNG card" />
                      <p className="aa-note">Made from the headline and category above. It is uploaded when you save, schedule or publish.</p>
                      <button type="button" className="aa-btn ghost small" onClick={downloadCard}><Download size={14} /> Download PNG</button>
                    </>
                  )}
                </div>
              )}

              {open.draft.mcqs.length > 0 && (
                <div className="aa-box">
                  <b>AI-suggested MCQs ({open.draft.mcqs.length}) - for your reference</b>
                  <p className="aa-note">These are kept with the draft but are not published to the website automatically.</p>
                  {open.draft.mcqs.map((q, i) => (
                    <div key={i} className="aa-mcq">
                      <p>{i + 1}. {q.question}</p>
                      <ul>{q.options.map((o, j) => (<li key={j} className={j === q.answerIndex ? "right" : ""}>{o}</li>))}</ul>
                      <small>{q.explanation}</small>
                    </div>
                  ))}
                </div>
              )}

              {open.history.length > 0 && (
                <details className="aa-snippet">
                  <summary>History</summary>
                  <ul className="aa-history">
                    {open.history.map((h, i) => (<li key={i}>{fmt(h.at)} - {h.action.replace(/_/g, " ")} {h.by ? `by ${h.by}` : ""}{h.summary ? ` (${h.summary})` : ""}</li>))}
                  </ul>
                </details>
              )}

              {open.rejecting && (
                <label className="aa-form-single">Reason for rejecting
                  <textarea rows={2} value={open.reason} onChange={(e) => setOpen({ ...open, reason: e.target.value })} placeholder="e.g. Not relevant for exams / facts unverified" />
                </label>
              )}
            </div>

            <div className="aa-sheet-foot">
              {reviewable && !open.rejecting && (
                <>
                  <label className="aa-when">
                    <CalendarClock size={15} />
                    <input type="datetime-local" value={open.scheduleAt} onChange={(e) => setOpen({ ...open, scheduleAt: e.target.value })} />
                  </label>
                  <button type="button" className="aa-btn ghost" onClick={schedule} disabled={busy || !open.scheduleAt}>Schedule</button>
                  <button type="button" className="aa-btn ghost" onClick={saveEdits} disabled={busy}>Save draft</button>
                  <button type="button" className="aa-btn ghost" onClick={regenerate} disabled={busy}>Regenerate</button>
                  <button type="button" className="aa-btn danger" onClick={() => setOpen({ ...open, rejecting: true })} disabled={busy}>Reject</button>
                  <button type="button" className="aa-btn primary" onClick={approve} disabled={busy}>
                    {busy ? <Loader2 className="aa-spin" size={16} /> : <CheckCircle2 size={16} />} Approve &amp; Publish
                  </button>
                </>
              )}
              {open.rejecting && (
                <>
                  <button type="button" className="aa-btn ghost" onClick={() => setOpen({ ...open, rejecting: false })}>Back</button>
                  <button type="button" className="aa-btn danger" onClick={reject} disabled={busy || !open.reason.trim()}>Confirm reject</button>
                </>
              )}
              {["failed", "rejected"].includes(open.draft.status) && (
                <>
                  <button type="button" className="aa-btn ghost" onClick={regenerate} disabled={busy}>Regenerate</button>
                  {open.draft.body && <button type="button" className="aa-btn ghost" onClick={restore} disabled={busy}>Move back to review</button>}
                  <button type="button" className="aa-btn ghost" onClick={archive} disabled={busy}>Archive</button>
                </>
              )}
              {open.draft.status === "published" && (
                <span className="aa-done"><ShieldCheck size={16} /> Published on {fmt(open.draft.publishedAt)} as {open.draft.publishedType === "blog" ? "a blog post" : "a current affair"}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MANUAL FORM ================= */}
      {manualForm && (
        <div className="aa-modal" role="dialog" aria-modal="true">
          <form className="aa-sheet small" onSubmit={createManual}>
            <div className="aa-sheet-head">
              <h3>Add from text</h3>
              <button type="button" className="aa-x" aria-label="Close" onClick={() => setManualForm(null)}><X size={20} /></button>
            </div>
            <div className="aa-sheet-body">
              <p className="aa-note">Use this for sites that do not allow automatic reading (for example PIB). Open the press release, copy its text, and paste it here. The AI will write an original draft from it, and you review it before anything is published.</p>
              {message.type === "error" && message.text && <div className="aa-box bad">{message.text}</div>}
              <div className="aa-form">
                <label>Source link (the page you copied from)<input required type="url" value={manualForm.url} onChange={(e) => setManualForm({ ...manualForm, url: e.target.value })} placeholder="https://pib.gov.in/PressReleasePage.aspx?PRID=..." /></label>
                <div className="aa-row">
                  <label>Source name<input value={manualForm.sourceName} onChange={(e) => setManualForm({ ...manualForm, sourceName: e.target.value })} /></label>
                  <label>Published date<input type="date" value={manualForm.publishedAt} onChange={(e) => setManualForm({ ...manualForm, publishedAt: e.target.value })} /></label>
                  <label>Language of text
                    <select value={manualForm.language} onChange={(e) => setManualForm({ ...manualForm, language: e.target.value })}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </label>
                </div>
                <label>Headline (optional)<input value={manualForm.title} onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })} placeholder="Copy the press release headline" /></label>
                <label>Category
                  <select value={manualForm.category} onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}>
                    {categories.map((c) => (<option key={c}>{c}</option>))}
                  </select>
                </label>
                <label>Press release text<textarea required rows={10} value={manualForm.text} onChange={(e) => setManualForm({ ...manualForm, text: e.target.value })} placeholder="Paste the full text here" /></label>
              </div>
            </div>
            <div className="aa-sheet-foot">
              <button type="button" className="aa-btn ghost" onClick={() => setManualForm(null)}>Cancel</button>
              <button type="submit" className="aa-btn primary" disabled={busy}>
                {busy ? <><Loader2 className="aa-spin" size={16} /> Writing draft...</> : "Create draft"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= SOURCE FORM ================= */}
      {sourceForm && (
        <div className="aa-modal" role="dialog" aria-modal="true">
          <form className="aa-sheet small" onSubmit={saveSource}>
            <div className="aa-sheet-head">
              <h3>{sourceEditing ? "Edit source" : "Add source"}</h3>
              <button type="button" className="aa-x" aria-label="Close" onClick={() => setSourceForm(null)}><X size={20} /></button>
            </div>
            <div className="aa-sheet-body">
              <div className="aa-form">
                <label>Name<input required value={sourceForm.name} onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })} placeholder="e.g. PIB - Press Releases" /></label>
                <label>RSS / Atom feed URL<input required type="url" value={sourceForm.url} onChange={(e) => setSourceForm({ ...sourceForm, url: e.target.value })} placeholder="https://..." /></label>
                <div className="aa-row">
                  <label>Default category
                    <select value={sourceForm.category} onChange={(e) => setSourceForm({ ...sourceForm, category: e.target.value })}>
                      {categories.map((c) => (<option key={c}>{c}</option>))}
                    </select>
                  </label>
                  <label>Language
                    <select value={sourceForm.language} onChange={(e) => setSourceForm({ ...sourceForm, language: e.target.value })}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </label>
                  <label>Reliability
                    <select value={sourceForm.reliability} onChange={(e) => setSourceForm({ ...sourceForm, reliability: e.target.value })}>
                      <option value="official">Official</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                    </select>
                  </label>
                </div>
                <label>Terms / usage note<input value={sourceForm.termsNote} onChange={(e) => setSourceForm({ ...sourceForm, termsNote: e.target.value })} placeholder="Licence or terms reminder (optional)" /></label>
                <label className="aa-check"><input type="checkbox" checked={sourceForm.active} onChange={(e) => setSourceForm({ ...sourceForm, active: e.target.checked })} /> Active</label>
              </div>
            </div>
            <div className="aa-sheet-foot">
              <button type="button" className="aa-btn ghost" onClick={() => setSourceForm(null)}>Cancel</button>
              <button type="submit" className="aa-btn primary" disabled={busy}>Save source</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
