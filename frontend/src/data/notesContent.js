// Notes catalog: Category -> Subcategory -> Topics (each Topic has its own price + PDF).
// Each topic has a globally unique numeric `id` (used in /note/:id, /checkout/:id,
// /payment/:id, and the Orders table's NoteId column, unchanged from before).
//
// `pdf: null` means the file hasn't been uploaded yet — the site will show a
// "Coming soon" state and disable purchase for that topic until you fill it in.
// To add a real topic: drop the PDF into backend/pdfs/ and set pdf to that filename.

export const NOTE_CATEGORIES = [
  {
    slug: "hp-general-knowledge",
    title: "HP General Knowledge",
    subject: "Himachal Pradesh GK",
    description: "Complete Himachal Pradesh General Knowledge notes for competitive exam preparation.",
    subcategories: [
      { slug: "history", title: "Himachal Pradesh History", topics: [
        { id: 1, title: "HP History Notes", price: 49, pdf: "HP High Court Process Server Syllabus.pdf" },
      ]},
      { slug: "geography", title: "Himachal Pradesh Geography", topics: [
        { id: 2, title: "HP Geography Notes", price: 49, pdf: null },
      ]},
      { slug: "polity", title: "HP Polity", topics: [
        { id: 3, title: "HP Polity Notes", price: 49, pdf: null },
      ]},
      { slug: "current-affairs", title: "HP Current Affairs", topics: [
        { id: 4, title: "HP Current Affairs Notes", price: 49, pdf: null },
      ]},
      { slug: "important-mcqs", title: "Important MCQs", topics: [
        { id: 5, title: "HP GK Important MCQs", price: 49, pdf: null },
      ]},
    ],
  },
  {
    slug: "hp-police-constable",
    title: "HP Police Constable",
    subject: "Complete Exam Preparation",
    description: "Complete study material for HP Police Constable examination preparation.",
    subcategories: [
      { slug: "general-knowledge", title: "General Knowledge", topics: [
        { id: 6, title: "GK for HP Police Constable", price: 99, pdf: "All One Word Substitution asked in SSC Exam 2025(P).pdf" },
      ]},
      { slug: "general-science", title: "General Science", topics: [
        { id: 7, title: "Science for HP Police Constable", price: 99, pdf: null },
      ]},
      { slug: "mathematics", title: "Mathematics", topics: [
        { id: 8, title: "Maths for HP Police Constable", price: 99, pdf: null },
      ]},
      { slug: "reasoning", title: "Reasoning", topics: [
        { id: 9, title: "Reasoning for HP Police Constable", price: 99, pdf: null },
      ]},
      { slug: "current-affairs", title: "Current Affairs", topics: [
        { id: 10, title: "Current Affairs for HP Police Constable", price: 99, pdf: null },
      ]},
    ],
  },
  {
    slug: "mathematics-notes",
    title: "Mathematics Notes",
    subject: "Quantitative Aptitude",
    description: "Important mathematics concepts, formulas and practice questions.",
    subcategories: [
      { slug: "percentage", title: "Percentage", topics: [
        { id: 11, title: "Percentage Notes", price: 49, pdf: "Formula Cheat-Sheet(P).pdf" },
      ]},
      { slug: "profit-loss", title: "Profit & Loss", topics: [
        { id: 12, title: "Profit & Loss Notes", price: 49, pdf: null },
      ]},
      { slug: "ratio-proportion", title: "Ratio & Proportion", topics: [
        { id: 13, title: "Ratio & Proportion Notes", price: 49, pdf: null },
      ]},
      { slug: "average", title: "Average", topics: [
        { id: 14, title: "Average Notes", price: 49, pdf: null },
      ]},
      { slug: "time-work", title: "Time & Work", topics: [
        { id: 15, title: "Time & Work Notes", price: 49, pdf: null },
      ]},
    ],
  },
  {
    slug: "reasoning-notes",
    title: "Reasoning Notes",
    subject: "Verbal & Non-Verbal Reasoning",
    description: "Important reasoning concepts and practice questions for competitive exams.",
    subcategories: [
      { slug: "analogy", title: "Analogy", topics: [
        { id: 16, title: "Analogy Notes", price: 49, pdf: "Adverbs & Adjectives Revision Notes.pdf" },
      ]},
      { slug: "series", title: "Series", topics: [
        { id: 17, title: "Series Notes", price: 49, pdf: null },
      ]},
      { slug: "coding-decoding", title: "Coding-Decoding", topics: [
        { id: 18, title: "Coding-Decoding Notes", price: 49, pdf: null },
      ]},
      { slug: "blood-relations", title: "Blood Relations", topics: [
        { id: 19, title: "Blood Relations Notes", price: 49, pdf: null },
      ]},
      { slug: "direction-test", title: "Direction Test", topics: [
        { id: 20, title: "Direction Test Notes", price: 49, pdf: null },
      ]},
    ],
  },
  {
    slug: "general-science",
    title: "General Science",
    subject: "Physics, Chemistry & Biology",
    description: "Important science notes covering Physics, Chemistry and Biology.",
    subcategories: [
      { slug: "physics", title: "Physics", topics: [
        { id: 21, title: "Physics Notes", price: 59, pdf: "May 2026 current affairs_compressed.pdf" },
      ]},
      { slug: "chemistry", title: "Chemistry", topics: [
        { id: 22, title: "Chemistry Notes", price: 59, pdf: null },
      ]},
      { slug: "biology", title: "Biology", topics: [
        { id: 23, title: "Biology Notes", price: 59, pdf: null },
      ]},
      { slug: "human-body", title: "Human Body", topics: [
        { id: 24, title: "Human Body Notes", price: 59, pdf: null },
      ]},
      { slug: "important-science-mcqs", title: "Important Science MCQs", topics: [
        { id: 25, title: "Science Important MCQs", price: 59, pdf: null },
      ]},
    ],
  },
  {
    slug: "english-notes",
    title: "English Notes",
    subject: "Grammar & Vocabulary",
    description: "Useful English grammar and vocabulary notes for competitive exams.",
    subcategories: [
      { slug: "parts-of-speech", title: "Parts of Speech", topics: [
        { id: 26, title: "Parts of Speech Notes", price: 49, pdf: "1000+ Idioms and Phrases Notes(P).pdf" },
      ]},
      { slug: "tenses", title: "Tenses", topics: [
        { id: 27, title: "Tenses Notes", price: 49, pdf: null },
      ]},
      { slug: "articles", title: "Articles", topics: [
        { id: 28, title: "Articles Notes", price: 49, pdf: null },
      ]},
      { slug: "prepositions", title: "Prepositions", topics: [
        { id: 29, title: "Prepositions Notes", price: 49, pdf: null },
      ]},
      { slug: "vocabulary", title: "Vocabulary", topics: [
        { id: 30, title: "Vocabulary Notes", price: 49, pdf: null },
      ]},
    ],
  },
  {
    slug: "indian-polity",
    title: "Indian Polity",
    subject: "Constitution & Government",
    description: "Important Indian Polity concepts for competitive examination preparation.",
    subcategories: [
      { slug: "indian-constitution", title: "Indian Constitution", topics: [
        { id: 31, title: "Indian Constitution Notes", price: 59, pdf: "January CA class-compressed.pdf" },
      ]},
      { slug: "fundamental-rights", title: "Fundamental Rights", topics: [
        { id: 32, title: "Fundamental Rights Notes", price: 59, pdf: null },
      ]},
      { slug: "parliament", title: "Parliament", topics: [
        { id: 33, title: "Parliament Notes", price: 59, pdf: null },
      ]},
      { slug: "president", title: "President", topics: [
        { id: 34, title: "President Notes", price: 59, pdf: null },
      ]},
      { slug: "supreme-court", title: "Supreme Court", topics: [
        { id: 35, title: "Supreme Court Notes", price: 59, pdf: null },
      ]},
    ],
  },
  {
    slug: "current-affairs-notes",
    title: "Current Affairs",
    subject: "Important Current Affairs",
    description: "Important current affairs and general awareness topics.",
    subcategories: [
      { slug: "national-affairs", title: "National Affairs", topics: [
        { id: 36, title: "National Affairs Notes", price: 39, pdf: "March+April CA_compressed.pdf" },
      ]},
      { slug: "international-affairs", title: "International Affairs", topics: [
        { id: 37, title: "International Affairs Notes", price: 39, pdf: null },
      ]},
      { slug: "sports", title: "Sports", topics: [
        { id: 38, title: "Sports Notes", price: 39, pdf: null },
      ]},
      { slug: "awards", title: "Awards", topics: [
        { id: 39, title: "Awards Notes", price: 39, pdf: null },
      ]},
      { slug: "important-events", title: "Important Events", topics: [
        { id: 40, title: "Important Events Notes", price: 39, pdf: null },
      ]},
    ],
  },
  {
    slug: "general-hindi",
    title: "General Hindi",
    subject: "Hindi Grammar & Vocabulary",
    description: "Important Hindi grammar and vocabulary notes for competitive exams.",
    subcategories: [
      { slug: "sandhi", title: "संधि", topics: [
        { id: 41, title: "संधि Notes", price: 49, pdf: "Hindi_TESTBOOK NEWS BULLETIN_08 Jul testbook_pass.pdf" },
      ]},
      { slug: "samas", title: "समास", topics: [
        { id: 42, title: "समास Notes", price: 49, pdf: null },
      ]},
      { slug: "paryayvachi", title: "पर्यायवाची शब्द", topics: [
        { id: 43, title: "पर्यायवाची शब्द Notes", price: 49, pdf: null },
      ]},
      { slug: "vilom", title: "विलोम शब्द", topics: [
        { id: 44, title: "विलोम शब्द Notes", price: 49, pdf: null },
      ]},
      { slug: "muhavare", title: "मुहावरे", topics: [
        { id: 45, title: "मुहावरे Notes", price: 49, pdf: null },
      ]},
    ],
  },
];

// ---- Helpers ----

export function getCategory(categorySlug) {
  return NOTE_CATEGORIES.find((c) => c.slug === categorySlug);
}

export function getSubcategory(categorySlug, subSlug) {
  const category = getCategory(categorySlug);
  if (!category) return null;
  return category.subcategories.find((s) => s.slug === subSlug);
}

// Flattens everything and finds a single topic by its numeric id,
// returning the topic along with its parent subcategory/category for breadcrumbs.
export function getTopicById(id) {
  const numId = Number(id);
  for (const category of NOTE_CATEGORIES) {
    for (const sub of category.subcategories) {
      const topic = sub.topics.find((t) => t.id === numId);
      if (topic) {
        return { topic, subcategory: sub, category };
      }
    }
  }
  return null;
}