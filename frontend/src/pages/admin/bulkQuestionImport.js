/* =====================================================
   Excel (.xlsx) <-> bilingual questions helpers

   One Excel row = one question that stores BOTH languages.
   Columns (header names are not case / space sensitive):

   questionEn  questionHi
   optionAEn   optionAHi   optionBEn  optionBHi
   optionCEn   optionCHi   optionDEn  optionDHi
   correctAnswer (A/B/C/D)
   explanationEn explanationHi   (optional)
===================================================== */

export const MAX_IMPORT_ROWS = 500;

// header in Excel  ->  field name used by the backend
const COLUMNS = [
  { header: "questionEn", field: "questionText", required: true },
  { header: "questionHi", field: "questionTextHi", required: true },

  { header: "optionAEn", field: "optionA", required: true },
  { header: "optionAHi", field: "optionAHi", required: true },
  { header: "optionBEn", field: "optionB", required: true },
  { header: "optionBHi", field: "optionBHi", required: true },
  { header: "optionCEn", field: "optionC", required: true },
  { header: "optionCHi", field: "optionCHi", required: true },
  { header: "optionDEn", field: "optionD", required: true },
  { header: "optionDHi", field: "optionDHi", required: true },

  { header: "correctAnswer", field: "correctAnswer", required: true },

  { header: "explanationEn", field: "explanationEn", required: false },
  { header: "explanationHi", field: "explanationHi", required: false },
];

export const TEMPLATE_HEADERS = COLUMNS.map((c) => c.header);

const normHeader = (h) =>
  String(h ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const HEADER_LOOKUP = new Map(
  COLUMNS.map((c) => [normHeader(c.header), c])
);

const clean = (v) => String(v ?? "").trim();

const dupKey = (v) =>
  clean(v).replace(/\s+/g, " ").toLowerCase();

const HAS_DEVANAGARI = /[\u0900-\u097F]/;

/* -----------------------------------------------------
   TEMPLATE DOWNLOAD
----------------------------------------------------- */
export async function downloadTemplate() {
  const XLSX = await import("xlsx");

  const sample = [
    [
      "What is the capital of India?",
      "भारत की राजधानी क्या है?",
      "Mumbai", "मुंबई",
      "Delhi", "दिल्ली",
      "Kolkata", "कोलकाता",
      "Chennai", "चेन्नई",
      "B",
      "New Delhi is the capital of India.",
      "नई दिल्ली भारत की राजधानी है।",
    ],
    [
      "Which planet is known as the Red Planet?",
      "किस ग्रह को लाल ग्रह कहा जाता है?",
      "Venus", "शुक्र",
      "Mars", "मंगल",
      "Jupiter", "बृहस्पति",
      "Saturn", "शनि",
      "B",
      "",
      "",
    ],
  ];

  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...sample]);

  sheet["!cols"] = TEMPLATE_HEADERS.map((h) => ({
    wch: h.startsWith("question") || h.startsWith("explanation") ? 38 : 16,
  }));

  const help = XLSX.utils.aoa_to_sheet([
    ["HOW TO FILL THIS FILE"],
    [""],
    ["1. One row = one question. Keep the header row (row 1) unchanged."],
    ["2. Fill BOTH English (…En) and Hindi (…Hi) columns in the same row."],
    ["3. correctAnswer must be A, B, C or D (same answer for both languages)."],
    ["4. explanationEn / explanationHi are optional."],
    ["5. Blank rows are ignored. Rows with problems are shown before import."],
    [`6. Maximum ${MAX_IMPORT_ROWS} questions per file.`],
    ["7. Delete the two sample rows before you upload."],
  ]);

  help["!cols"] = [{ wch: 80 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Questions");
  XLSX.utils.book_append_sheet(book, help, "Instructions");

  XLSX.writeFile(book, "bilingual-questions-template.xlsx");
}

/* -----------------------------------------------------
   PARSE FILE  ->  { rows, blankRows, fileError }
   rows: [{ rowNumber (Excel row), values: {field: text} }]
----------------------------------------------------- */
export async function parseQuestionFile(file) {
  const XLSX = await import("xlsx");

  let book;

  try {
    const buffer = await file.arrayBuffer();
    book = XLSX.read(buffer, { type: "array" });
  } catch {
    return {
      rows: [],
      blankRows: 0,
      fileError:
        "This file could not be read. Please upload a valid .xlsx file.",
    };
  }

  // prefer the sheet called "Questions", otherwise the first one
  const sheetName =
    book.SheetNames.find((n) => n.toLowerCase() === "questions") ||
    book.SheetNames[0];

  const ws = sheetName ? book.Sheets[sheetName] : null;

  if (!ws || !ws["!ref"]) {
    return {
      rows: [],
      blankRows: 0,
      fileError: "The Excel file is empty.",
    };
  }

  const firstRowIndex = XLSX.utils.decode_range(ws["!ref"]).s.r;

  const grid = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });

  // header row = first row that contains at least one known header
  const headerIdx = grid.findIndex((r) =>
    r.some((cell) => HEADER_LOOKUP.has(normHeader(cell)))
  );

  if (headerIdx === -1) {
    return {
      rows: [],
      blankRows: 0,
      fileError:
        "Header row not found. Please download the template and keep its headers unchanged.",
    };
  }

  const colField = grid[headerIdx].map((cell) => {
    const col = HEADER_LOOKUP.get(normHeader(cell));
    return col ? col.field : null;
  });

  const presentFields = new Set(colField.filter(Boolean));

  const missingHeaders = COLUMNS.filter(
    (c) => c.required && !presentFields.has(c.field)
  ).map((c) => c.header);

  if (missingHeaders.length) {
    return {
      rows: [],
      blankRows: 0,
      fileError: `Missing column(s): ${missingHeaders.join(", ")}. Please use the template headers.`,
    };
  }

  const rows = [];
  let blankRows = 0;

  for (let i = headerIdx + 1; i < grid.length; i += 1) {
    const cells = grid[i];

    if (cells.every((c) => clean(c) === "")) {
      blankRows += 1;
      continue;
    }

    const values = {};

    colField.forEach((field, c) => {
      if (field) values[field] = clean(cells[c]);
    });

    rows.push({
      rowNumber: firstRowIndex + i + 1,
      values,
    });
  }

  if (rows.length === 0) {
    return {
      rows,
      blankRows,
      fileError: "No question rows found below the header.",
    };
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      rows: [],
      blankRows,
      fileError: `This file has ${rows.length} questions. Maximum ${MAX_IMPORT_ROWS} per import, please split the file.`,
    };
  }

  return { rows, blankRows, fileError: "" };
}

/* -----------------------------------------------------
   VALIDATE  ->  one result per row
   status: "valid" | "error" | "duplicate"
----------------------------------------------------- */
export function validateRows(rows, existingQuestionTexts = []) {
  const seenInDb = new Set(existingQuestionTexts.map(dupKey));
  const seenInFile = new Map(); // key -> first row number

  return rows.map(({ rowNumber, values }) => {
    const errors = [];
    const warnings = [];

    // 1) every required text column (EN + HI) must be filled
    COLUMNS.filter(
      (c) => c.required && c.field !== "correctAnswer"
    ).forEach((c) => {
      if (!values[c.field]) errors.push(`${c.header} missing`);
    });

    // 2) answer key
    const answer = clean(values.correctAnswer).toUpperCase();

    if (!["A", "B", "C", "D"].includes(answer)) {
      errors.push(
        answer
          ? `correctAnswer must be A, B, C or D (found "${values.correctAnswer}")`
          : "correctAnswer missing"
      );
    }

    // 3) soft checks (never block the import)
    if (
      values.questionTextHi &&
      !HAS_DEVANAGARI.test(values.questionTextHi)
    ) {
      warnings.push("questionHi has no Hindi (Devanagari) text");
    }

    const hasEn = !!values.explanationEn;
    const hasHi = !!values.explanationHi;

    if (hasEn !== hasHi) {
      warnings.push(
        hasEn
          ? "explanationHi is empty"
          : "explanationEn is empty"
      );
    }

    // 4) duplicates (inside this file, and already saved in this test)
    let duplicateOf = "";

    if (values.questionText) {
      const key = dupKey(values.questionText);

      if (seenInDb.has(key)) {
        duplicateOf = "Already exists in this test";
      } else if (seenInFile.has(key)) {
        duplicateOf = `Duplicate of row ${seenInFile.get(key)}`;
      } else {
        seenInFile.set(key, rowNumber);
      }
    }

    let status = "valid";

    if (errors.length) status = "error";
    else if (duplicateOf) status = "duplicate";

    return {
      rowNumber,
      status,
      errors: duplicateOf && !errors.length ? [duplicateOf] : errors,
      warnings,
      values,
      payload: {
        rowNumber,
        ...values,
        correctAnswer: answer,
      },
    };
  });
}