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

export const EXAM_TAXONOMY = [
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
];

export function getExamGroup(topSlug) {
  return EXAM_TAXONOMY.find((g) => g.slug === topSlug);
}

export function getSubExam(topSlug, subSlug) {
  const group = getExamGroup(topSlug);
  if (!group) return null;
  return group.subExams.find((s) => s.slug === subSlug);
}