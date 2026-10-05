import { API_BASE } from "../config/api";

// Static exam hierarchy for the whole site.
// topSlug/subSlug values here must match what's stored in the
// Tests table's TopCategory / SubExam columns in SQL Server.
//
// iconUrl = real official logo (hotlinked from Wikimedia Commons,
// public domain / freely licensed government & institution logos).
// icon = emoji fallback, kept in case an image link ever breaks.

const SSC_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/Staff_Selection_Commission_Logo.jpg";
const HP_GOVT_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/Government_of_Himachal_Pradesh_logo.svg";
const IBPS_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/IBPS_LOGO.png";
const SBI_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/SBI_logo_%28with_motto%29.svg";
const RBI_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/Reserve_Bank_of_India_logo.svg";
const RAILWAYS_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/Ministry_of_Railways_India.svg";
const CBSE_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/Logo_of_the_Central_Board_of_Secondary_Education.png";
const UPSC_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/Union_Public_Service_Commission_Logo.png";
const ARMED_FORCES_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/Logo_of_the_Indian_Armed_Forces.svg";
const NTA_LOGO = "https://commons.wikimedia.org/wiki/Special:FilePath/NTA_logo.png";
const INDIA_EMBLEM = "https://commons.wikimedia.org/wiki/Special:FilePath/Emblem_of_India.svg";

const BASE_TAXONOMY = [
  {
    slug: "police",
    icon: "👮",
    title: "Police Exams",
    subExams: [
      { slug: "state-police", name: "Himachal Pradesh Police", iconUrl: HP_GOVT_LOGO },
      { slug: "ssc-gd", name: "SSC GD", iconUrl: SSC_LOGO },
      { slug: "si", name: "SI", iconUrl: SSC_LOGO },
    ],
  },
  {
    slug: "ssc",
    icon: "📝",
    title: "SSC Exams",
    subExams: [
      { slug: "cgl", name: "CGL", iconUrl: SSC_LOGO },
      { slug: "chsl", name: "CHSL", iconUrl: SSC_LOGO },
      { slug: "gd", name: "GD", iconUrl: SSC_LOGO },
      { slug: "mts", name: "MTS", iconUrl: SSC_LOGO },
      { slug: "cpo", name: "CPO", iconUrl: SSC_LOGO },
    ],
  },
  {
    slug: "banking",
    icon: "🏦",
    title: "Banking Exams",
    subExams: [
      { slug: "ibps-po", name: "IBPS PO", iconUrl: IBPS_LOGO },
      { slug: "ibps-clerk", name: "IBPS Clerk", iconUrl: IBPS_LOGO },
      { slug: "sbi-po", name: "SBI PO", iconUrl: SBI_LOGO },
      { slug: "sbi-clerk", name: "SBI Clerk", iconUrl: SBI_LOGO },
      { slug: "rbi", name: "RBI", iconUrl: RBI_LOGO },
    ],
  },
  {
    slug: "railway",
    icon: "🚆",
    title: "Railway Exams",
    subExams: [
      { slug: "rrb-ntpc", name: "RRB NTPC", iconUrl: RAILWAYS_LOGO },
      { slug: "group-d", name: "Group D", iconUrl: RAILWAYS_LOGO },
      { slug: "alp", name: "ALP", iconUrl: RAILWAYS_LOGO },
      { slug: "technician", name: "Technician", iconUrl: RAILWAYS_LOGO },
    ],
  },
  {
    slug: "teaching",
    icon: "🎓",
    title: "Teaching Exams",
    subExams: [
      { slug: "ctet", name: "CTET", iconUrl: CBSE_LOGO },
      { slug: "tet", name: "TET", iconUrl: CBSE_LOGO },
      { slug: "ugc-net", name: "UGC NET", iconUrl: INDIA_EMBLEM },
    ],
  },
  {
    slug: "civil-services",
    icon: "🏛️",
    title: "Civil Services",
    subExams: [
      { slug: "upsc", name: "UPSC", iconUrl: UPSC_LOGO },
      { slug: "state-psc", name: "State PSC", iconUrl: HP_GOVT_LOGO },
    ],
  },
  {
    slug: "defence",
    icon: "🪖",
    title: "Defence Exams",
    subExams: [
      { slug: "nda", name: "NDA", iconUrl: ARMED_FORCES_LOGO },
      { slug: "cds", name: "CDS", iconUrl: ARMED_FORCES_LOGO },
      { slug: "afcat", name: "AFCAT", iconUrl: ARMED_FORCES_LOGO },
      { slug: "agniveer", name: "Agniveer", iconUrl: ARMED_FORCES_LOGO },
    ],
  },
  {
    slug: "engineering",
    icon: "⚙️",
    title: "Engineering Exams",
    subExams: [
      { slug: "jee", name: "JEE", iconUrl: NTA_LOGO },
      { slug: "gate", name: "GATE", iconUrl: INDIA_EMBLEM },
      { slug: "je-ae", name: "JE/AE Recruitment", iconUrl: INDIA_EMBLEM },
    ],
  },

  /* ------------------------------------------------------------
     HIMACHAL PRADESH  (region: "himachal-pradesh")
     These 5 are listed on the Himachal Pradesh page (/himachal-pradesh).
     Each one is a recruiting body, the exams inside it are its sub exams.
  ------------------------------------------------------------ */
  {
    slug: "hppsc",
    icon: "🏛️",
    title: "HPPSC Exams",
    shortName: "HPPSC",
    fullName: "Himachal Pradesh Public Service Commission",
    region: "himachal-pradesh",
    subExams: [
      { slug: "hpas", name: "HPAS / HP Administrative Services", iconUrl: HP_GOVT_LOGO },
      { slug: "allied-services", name: "HP Allied Services", iconUrl: HP_GOVT_LOGO },
      { slug: "judicial-service", name: "HP Judicial Service", iconUrl: HP_GOVT_LOGO },
      { slug: "forest-service", name: "HP Forest Service", iconUrl: HP_GOVT_LOGO },
      { slug: "assistant-professor", name: "Assistant Professor", iconUrl: HP_GOVT_LOGO },
      { slug: "naib-tehsildar", name: "Naib Tehsildar", iconUrl: HP_GOVT_LOGO },
      { slug: "gazetted-officer", name: "Various Gazetted Officer Posts", iconUrl: HP_GOVT_LOGO },
    ],
  },
  {
    slug: "hprca",
    icon: "📝",
    title: "HPRCA Exams",
    shortName: "HPRCA",
    fullName: "Himachal Pradesh Rajya Chayan Aayog",
    region: "himachal-pradesh",
    subExams: [
      { slug: "junior-office-assistant-it", name: "Junior Office Assistant (IT)", iconUrl: HP_GOVT_LOGO },
      { slug: "clerk", name: "Clerk", iconUrl: HP_GOVT_LOGO },
      { slug: "steno-typist", name: "Steno Typist", iconUrl: HP_GOVT_LOGO },
      { slug: "junior-engineer", name: "Junior Engineer", iconUrl: HP_GOVT_LOGO },
      { slug: "staff-nurse", name: "Staff Nurse", iconUrl: HP_GOVT_LOGO },
      { slug: "laboratory-assistant", name: "Laboratory Assistant", iconUrl: HP_GOVT_LOGO },
      { slug: "technical-posts", name: "Various Technical Posts", iconUrl: HP_GOVT_LOGO },
      { slug: "class-3-posts", name: "Various Class-III Posts", iconUrl: HP_GOVT_LOGO },
    ],
  },
  {
    slug: "hpbose",
    icon: "🎓",
    title: "HPBOSE Exams",
    shortName: "HPBOSE",
    fullName: "Himachal Pradesh Board of School Education",
    region: "himachal-pradesh",
    subExams: [
      { slug: "hp-tet", name: "HP TET", iconUrl: HP_GOVT_LOGO },
      { slug: "jbt-tet", name: "JBT TET", iconUrl: HP_GOVT_LOGO },
      { slug: "tgt-tet", name: "TGT TET", iconUrl: HP_GOVT_LOGO },
      { slug: "shastri-tet", name: "Shastri TET", iconUrl: HP_GOVT_LOGO },
      { slug: "language-teacher-tet", name: "Language Teacher TET", iconUrl: HP_GOVT_LOGO },
      { slug: "punjabi-tet", name: "Punjabi TET", iconUrl: HP_GOVT_LOGO },
      { slug: "urdu-tet", name: "Urdu TET", iconUrl: HP_GOVT_LOGO },
    ],
  },
  {
    slug: "hp-high-court",
    icon: "⚖️",
    title: "HP High Court Exams",
    shortName: "HP High Court",
    fullName: "Himachal Pradesh High Court",
    region: "himachal-pradesh",
    subExams: [
      { slug: "high-court-clerk", name: "High Court Clerk", iconUrl: HP_GOVT_LOGO },
      { slug: "process-server", name: "Process Server", iconUrl: HP_GOVT_LOGO },
      { slug: "stenographer", name: "Stenographer", iconUrl: HP_GOVT_LOGO },
      { slug: "judgment-writer", name: "Judgment Writer", iconUrl: HP_GOVT_LOGO },
      { slug: "other-staff", name: "Other High Court Staff", iconUrl: HP_GOVT_LOGO },
    ],
  },
  {
    slug: "hp-police",
    icon: "👮",
    title: "HP Police Exams",
    shortName: "HP Police",
    fullName: "Himachal Pradesh Police",
    region: "himachal-pradesh",
    subExams: [
      { slug: "constable", name: "Police Constable", iconUrl: HP_GOVT_LOGO },
      { slug: "sub-inspector", name: "Sub-Inspector", iconUrl: HP_GOVT_LOGO },
    ],
  },
];

/* ============================================================
   LIVE LIST  (built-in exams above  +  exams added in the admin panel)

   EXAM_TAXONOMY is a normal array that every page reads. It is rebuilt
   in place whenever the admin-added exams change, and pages that call
   useTaxonomy() (see useTaxonomy.js) re-render when that happens.
   Admin-added exams are cached in the browser so they show up instantly
   on the next visit and are refreshed from the server in the background.
============================================================ */

export const EXAM_TAXONOMY = [];

const CACHE_KEY = "dta_custom_exams_v1";

let customGroups = [];
let version = 0;
let started = false;
const listeners = new Set();

function rebuild() {
  const merged = BASE_TAXONOMY.map((g) => ({
    ...g,
    subExams: g.subExams.map((s) => ({ ...s })),
  }));

  customGroups.forEach((c) => {
    const existing = merged.find((g) => g.slug === c.slug);

    if (existing) {
      // extra exams added to a built-in category (e.g. a new SSC exam)
      (c.subExams || []).forEach((s) => {
        if (!existing.subExams.some((x) => x.slug === s.slug)) {
          existing.subExams.push({ ...s, custom: true });
        }
      });
    } else {
      // brand new category / body
      merged.push({
        slug: c.slug,
        icon: c.icon || "📄",
        title: c.title,
        shortName: c.title,
        fullName: c.fullName || "",
        region: c.region || "",
        custom: true,
        subExams: (c.subExams || []).map((s) => ({ ...s, custom: true })),
      });
    }
  });

  EXAM_TAXONOMY.length = 0;
  EXAM_TAXONOMY.push(...merged);
}

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCache(list) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    // private mode / storage full: the site still works, just not cached
  }
}

export function subscribeTaxonomy(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTaxonomyVersion() {
  return version;
}

// downloads the admin-added exams; pages update only if something changed
export async function refreshTaxonomy() {
  try {
    const response = await fetch(`${API_BASE}/api/exam-taxonomy`);

    if (!response.ok) return;

    const data = await response.json();

    if (!Array.isArray(data)) return;

    if (JSON.stringify(data) === JSON.stringify(customGroups)) return;

    customGroups = data;
    writeCache(data);
    rebuild();

    version += 1;
    listeners.forEach((listener) => listener());
  } catch {
    // offline or server asleep: keep showing the exams we already have
  }
}

// first page that needs the list triggers one download per visit
export function ensureTaxonomyLoaded() {
  if (started) return;
  started = true;
  refreshTaxonomy();
}

customGroups = readCache();
rebuild();

export function getExamGroup(topSlug) {
  return EXAM_TAXONOMY.find((g) => g.slug === topSlug);
}

export function getSubExam(topSlug, subSlug) {
  const group = getExamGroup(topSlug);
  if (!group) return null;
  return group.subExams.find((s) => s.slug === subSlug);
}