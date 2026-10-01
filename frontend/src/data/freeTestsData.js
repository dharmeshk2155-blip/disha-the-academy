export const FREE_TEST_CATEGORIES = [
  {
    id: "hp-state-exams",
    title: "HP State Exams",
    description: "Himachal Pradesh state competitive exams",
    exams: [
      {
        id: "hp-police",
        name: "HP Police Constable",
      },
      {
        id: "hppsc-hpas",
        name: "HPPSC / HPAS",
      },
      {
        id: "hp-patwari",
        name: "HP Patwari",
      },
      {
        id: "hp-tet",
        name: "HP TET",
      },
      {
        id: "joa-it",
        name: "JOA IT",
      },
    ],
  },

  {
    id: "upsc-exams",
    title: "UPSC Exams",
    description: "Union Public Service Commission exams",
    exams: [
      {
        id: "upsc-cse",
        name: "UPSC Civil Services",
      },
      {
        id: "upsc-cds",
        name: "UPSC CDS",
      },
      {
        id: "upsc-nda",
        name: "UPSC NDA",
      },
      {
        id: "upsc-capf",
        name: "UPSC CAPF",
      },
    ],
  },

  {
    id: "ssc-exams",
    title: "SSC Exams",
    description: "Staff Selection Commission exams",
    exams: [
      {
        id: "ssc-cgl",
        name: "SSC CGL",
      },
      {
        id: "ssc-chsl",
        name: "SSC CHSL",
      },
      {
        id: "ssc-cpo",
        name: "SSC CPO",
      },
      {
        id: "ssc-mts",
        name: "SSC MTS",
      },
      {
        id: "ssc-gd",
        name: "SSC GD Constable",
      },
    ],
  },

  {
    id: "banking-exams",
    title: "Banking Exams",
    description: "Banking recruitment examinations",
    exams: [
      {
        id: "ibps-po",
        name: "IBPS PO",
      },
      {
        id: "ibps-clerk",
        name: "IBPS Clerk",
      },
      {
        id: "sbi-po",
        name: "SBI PO",
      },
      {
        id: "sbi-clerk",
        name: "SBI Clerk",
      },
    ],
  },

  {
    id: "railway-exams",
    title: "Railway Exams",
    description: "Railway recruitment examinations",
    exams: [
      {
        id: "rrb-ntpc",
        name: "RRB NTPC",
      },
      {
        id: "rrb-group-d",
        name: "RRB Group D",
      },
      {
        id: "rrb-alp",
        name: "RRB ALP",
      },
    ],
  },

  {
    id: "teaching-exams",
    title: "Teaching Exams",
    description: "Teaching eligibility and recruitment exams",
    exams: [
      {
        id: "ctet",
        name: "CTET",
      },
      {
        id: "ugc-net",
        name: "UGC NET",
      },
    ],
  },
];

/*
  IMPORTANT

  durationSeconds = total test time in seconds

  correctAnswer:
  1 = first option
  2 = second option
  3 = third option
  4 = fourth option
*/

export const FREE_TESTS = [
  {
    id: "hp-police-free-1",

    categoryId: "hp-state-exams",

    examId: "hp-police",

    title: "HP Police Constable Free Mock Test 01",

    subject: "HP Police Constable",

    durationSeconds: 20 * 60,

    marksPerCorrect: 1,

    negativeMarking: 0.25,

    questions: [
      {
        id: "hp-police-q1",

        question:
          "Which is the largest district of Himachal Pradesh by area?",

        options: [
          "Kangra",
          "Chamba",
          "Lahaul and Spiti",
          "Kinnaur",
        ],

        correctAnswer: 3,
      },

      {
        id: "hp-police-q2",

        question:
          "What is the capital of Himachal Pradesh?",

        options: [
          "Shimla",
          "Mandi",
          "Solan",
          "Kullu",
        ],

        correctAnswer: 1,
      },

      {
        id: "hp-police-q3",

        question:
          "The Beas River originates from which place?",

        options: [
          "Rohtang Pass",
          "Beas Kund",
          "Kinnaur",
          "Chamba",
        ],

        correctAnswer: 2,
      },

      {
        id: "hp-police-q4",

        question:
          "Himachal Pradesh became a full-fledged state in which year?",

        options: [
          "1966",
          "1971",
          "1975",
          "1980",
        ],

        correctAnswer: 2,
      },

      {
        id: "hp-police-q5",

        question:
          "Minjar Fair is associated with which district of Himachal Pradesh?",

        options: [
          "Kangra",
          "Mandi",
          "Chamba",
          "Shimla",
        ],

        correctAnswer: 3,
      },
    ],
  },

  {
    id: "ssc-cgl-free-1",

    categoryId: "ssc-exams",

    examId: "ssc-cgl",

    title: "SSC CGL Free Mock Test 01",

    subject: "SSC CGL",

    durationSeconds: 15 * 60,

    marksPerCorrect: 2,

    negativeMarking: 0.5,

    questions: [
      {
        id: "ssc-cgl-q1",

        question: "25% of 200 is:",

        options: [
          "25",
          "40",
          "50",
          "75",
        ],

        correctAnswer: 3,
      },

      {
        id: "ssc-cgl-q2",

        question:
          "Which planet is known as the Red Planet?",

        options: [
          "Venus",
          "Mars",
          "Jupiter",
          "Mercury",
        ],

        correctAnswer: 2,
      },

      {
        id: "ssc-cgl-q3",

        question:
          "The Constitution of India came into force on:",

        options: [
          "15 August 1947",
          "26 January 1950",
          "26 November 1949",
          "2 October 1950",
        ],

        correctAnswer: 2,
      },

      {
        id: "ssc-cgl-q4",

        question:
          "What is the LCM of 8 and 12?",

        options: [
          "16",
          "20",
          "24",
          "32",
        ],

        correctAnswer: 3,
      },

      {
        id: "ssc-cgl-q5",

        question:
          "Which is the largest planet in the Solar System?",

        options: [
          "Earth",
          "Mars",
          "Saturn",
          "Jupiter",
        ],

        correctAnswer: 4,
      },
    ],
  },

  {
    id: "upsc-cse-free-1",

    categoryId: "upsc-exams",

    examId: "upsc-cse",

    title: "UPSC Civil Services Free GS Test 01",

    subject: "UPSC Civil Services",

    durationSeconds: 20 * 60,

    marksPerCorrect: 2,

    negativeMarking: 0.66,

    questions: [
      {
        id: "upsc-q1",

        question:
          "Which part of the Indian Constitution contains Fundamental Rights?",

        options: [
          "Part I",
          "Part II",
          "Part III",
          "Part IV",
        ],

        correctAnswer: 3,
      },

      {
        id: "upsc-q2",

        question:
          "Article 21 of the Constitution of India deals with:",

        options: [
          "Equality before law",
          "Freedom of religion",
          "Protection of life and personal liberty",
          "Right against exploitation",
        ],

        correctAnswer: 3,
      },

      {
        id: "upsc-q3",

        question:
          "The Parliament of India consists of:",

        options: [
          "Lok Sabha only",
          "Rajya Sabha only",
          "Lok Sabha and Rajya Sabha",
          "President, Lok Sabha and Rajya Sabha",
        ],

        correctAnswer: 4,
      },
    ],
  },
];

export function getCategory(categoryId) {
  return FREE_TEST_CATEGORIES.find(
    (category) =>
      category.id === categoryId
  );
}

export function getExam(
  categoryId,
  examId
) {
  const category =
    getCategory(categoryId);

  if (!category) {
    return null;
  }

  return category.exams.find(
    (exam) =>
      exam.id === examId
  );
}

export function getTestsByExam(
  categoryId,
  examId
) {
  return FREE_TESTS.filter(
    (test) =>
      test.categoryId === categoryId &&
      test.examId === examId
  );
}

export function getFreeTest(testId) {
  return FREE_TESTS.find(
    (test) =>
      test.id === testId
  );
}

export function getFreeTestCount(
  categoryId,
  examId
) {
  return getTestsByExam(
    categoryId,
    examId
  ).length;
}