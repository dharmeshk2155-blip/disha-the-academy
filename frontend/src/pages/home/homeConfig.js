import {
  FaFileAlt,
  FaUniversity,
  FaTrain,
  FaChalkboardTeacher,
  FaMountain,
  FaUserShield,
  FaLandmark,
  FaThLarge,
} from "react-icons/fa";

import { BookOpen, ClipboardList, Newspaper, BarChart3 } from "lucide-react";

import { getSubExam } from "../../data/examTaxonomy";

// ======================================================
// Static content of the home page.
// Every "to" below is a route that already exists in App.jsx.
// BOTH rows (categories + popular exams) open the SAME flow:
//   /take-mock-test/:category -> exam -> exam page -> test type -> test list
// ======================================================

/* Section 2 - "What are you preparing for?" */
export const CATEGORY_TILES = [
  { key: "ssc", label: "SSC", Icon: FaFileAlt, color: "#d62839", to: "/take-mock-test/ssc" },
  { key: "banking", label: "Banking", Icon: FaUniversity, color: "#1d6fdc", to: "/take-mock-test/banking" },
  { key: "railway", label: "Railway", Icon: FaTrain, color: "#e8590c", to: "/take-mock-test/railway" },
  { key: "teaching", label: "Teaching", Icon: FaChalkboardTeacher, color: "#2b9348", to: "/take-mock-test/teaching" },
  { key: "hp", label: "HP", Icon: FaMountain, color: "#6b46c1", to: "/himachal-pradesh" },
  { key: "police", label: "Police", Icon: FaUserShield, color: "#a8761a", to: "/take-mock-test/police" },
  { key: "civil-services", label: "Civil Services", Icon: FaLandmark, color: "#0b1f4d", to: "/take-mock-test/civil-services" },
  { key: "other", label: "Other", Icon: FaThLarge, color: "#0b1f4d", to: "/take-mock-test" },
];

// Fallback icon (by exam category slug) when a logo image cannot load
export const CATEGORY_ICONS = {
  ssc: { Icon: FaFileAlt, color: "#d62839" },
  banking: { Icon: FaUniversity, color: "#1d6fdc" },
  railway: { Icon: FaTrain, color: "#e8590c" },
  teaching: { Icon: FaChalkboardTeacher, color: "#2b9348" },
  police: { Icon: FaUserShield, color: "#a8761a" },
  "civil-services": { Icon: FaLandmark, color: "#0b1f4d" },
};

export const DEFAULT_ICON = { Icon: FaFileAlt, color: "#0b1f4d" };

/* Section 3 - Popular exams (logos come from the exam taxonomy) */
export const POPULAR_EXAMS = [
  {
    key: "ssc",
    title: "SSC Exams",
    tags: ["Notes", "Tests", "Current Affairs"],
    to: "/take-mock-test/ssc",
    logo: getSubExam("ssc", "cgl")?.iconUrl,
    fallback: CATEGORY_ICONS.ssc,
  },
  {
    key: "hp",
    title: "HP Government Exams",
    tags: ["Notes", "Tests", "Study Material"],
    to: "/himachal-pradesh",
    logo: getSubExam("police", "state-police")?.iconUrl,
    fallback: { Icon: FaMountain, color: "#6b46c1" },
  },
  {
    key: "banking",
    title: "Banking Exams",
    tags: ["Mock Tests", "Notes", "Study Material"],
    to: "/take-mock-test/banking",
    logo: getSubExam("banking", "sbi-po")?.iconUrl,
    fallback: CATEGORY_ICONS.banking,
  },
  {
    key: "railway",
    title: "Railway Exams",
    tags: ["Tests", "Notes", "Study Material"],
    to: "/take-mock-test/railway",
    logo: getSubExam("railway", "rrb-ntpc")?.iconUrl,
    fallback: CATEGORY_ICONS.railway,
  },
  {
    key: "teaching",
    title: "Teaching Exams",
    tags: ["Notes", "Tests", "Study Material"],
    to: "/take-mock-test/teaching",
    logo: getSubExam("teaching", "ctet")?.iconUrl,
    fallback: CATEGORY_ICONS.teaching,
  },
];

/* Section 7 - Explore more resources
   (pointed at the closest pages that exist today) */
export const RESOURCES = [
  {
    key: "pyq",
    title: "Previous Year Papers",
    text: "Practice with past exam questions",
    to: "/notes",
    color: "#d62839",
    bg: "#fdecee",
    iconKey: "file",
  },
  {
    key: "pdf",
    title: "Free Study PDFs",
    text: "Browse study material and PDFs",
    to: "/notes",
    color: "#1d6fdc",
    bg: "#e6f0fd",
    iconKey: "book",
  },
  {
    key: "practice",
    title: "Daily Practice Questions",
    text: "Practice questions exam by exam",
    to: "/take-mock-test",
    color: "#e8590c",
    bg: "#fff0e4",
    iconKey: "clipboard",
  },
];

/* Section 10 - Why Disha */
export const WHY_POINTS = [
  { key: "content", title: "Exam-Focused Content", text: "Relevant and updated study material.", Icon: BookOpen, color: "#16805f", bg: "#e3f6ef" },
  { key: "tests", title: "Practice Tests", text: "Exam-pattern based test series.", Icon: ClipboardList, color: "#c2570c", bg: "#fff0e1" },
  { key: "affairs", title: "Daily Current Affairs", text: "Important updates for competitive exams.", Icon: Newspaper, color: "#5b3fc4", bg: "#eeeaff" },
  { key: "progress", title: "Track Your Progress", text: "Detailed performance analysis and insights.", Icon: BarChart3, color: "#b4530a", bg: "#fff0dc" },
];