// Static exam hierarchy for the whole site.
// topSlug/subSlug values here must match what's stored in the
// Tests table's TopCategory / SubExam columns in SQL Server.

export const EXAM_TAXONOMY = [
  {
    slug: "police",
    icon: "👮",
    title: "Police Exams",
    subExams: [
      { slug: "state-police", name: "Himachal Pradesh Police" },
      { slug: "ssc-gd", name: "SSC GD" },
      { slug: "si", name: "SI" },
    ],
  },
  {
    slug: "ssc",
    icon: "📝",
    title: "SSC Exams",
    subExams: [
      { slug: "cgl", name: "CGL" },
      { slug: "chsl", name: "CHSL" },
      { slug: "gd", name: "GD" },
      { slug: "mts", name: "MTS" },
      { slug: "cpo", name: "CPO" },
    ],
  },
  {
    slug: "banking",
    icon: "🏦",
    title: "Banking Exams",
    subExams: [
      { slug: "ibps-po", name: "IBPS PO" },
      { slug: "ibps-clerk", name: "IBPS Clerk" },
      { slug: "sbi-po", name: "SBI PO" },
      { slug: "sbi-clerk", name: "SBI Clerk" },
      { slug: "rbi", name: "RBI" },
    ],
  },
  {
    slug: "railway",
    icon: "🚆",
    title: "Railway Exams",
    subExams: [
      { slug: "rrb-ntpc", name: "RRB NTPC" },
      { slug: "group-d", name: "Group D" },
      { slug: "alp", name: "ALP" },
      { slug: "technician", name: "Technician" },
    ],
  },
  {
    slug: "teaching",
    icon: "🎓",
    title: "Teaching Exams",
    subExams: [
      { slug: "ctet", name: "CTET" },
      { slug: "tet", name: "TET" },
      { slug: "ugc-net", name: "UGC NET" },
    ],
  },
  {
    slug: "civil-services",
    icon: "🏛️",
    title: "Civil Services",
    subExams: [
      { slug: "upsc", name: "UPSC" },
      { slug: "state-psc", name: "State PSC" },
    ],
  },
  {
    slug: "defence",
    icon: "🪖",
    title: "Defence Exams",
    subExams: [
      { slug: "nda", name: "NDA" },
      { slug: "cds", name: "CDS" },
      { slug: "afcat", name: "AFCAT" },
      { slug: "agniveer", name: "Agniveer" },
    ],
  },
  {
    slug: "engineering",
    icon: "⚙️",
    title: "Engineering Exams",
    subExams: [
      { slug: "jee", name: "JEE" },
      { slug: "gate", name: "GATE" },
      { slug: "je-ae", name: "JE/AE Recruitment" },
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