import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";

import { EXAM_TAXONOMY } from "../data/examTaxonomy";
import { TEST_TYPES, typeBySlug, typeKeyOf } from "../data/testTypes";
import useTests from "../hooks/useTests";
import TestCard from "../components/TestCard";

import "./AllTests.css";

const RECENT_LIMIT = 12;

const EMPTY_FILTERS = {
  category: "", // exam group, e.g. "ssc"
  exam: "", // "ssc/cgl"
  type: "", // previous_year | sectional | full | other
  language: "", // en | hi
  access: "", // free | paid
};

const createdTime = (test) => {
  const time = new Date(test.createdAt).getTime();
  return Number.isFinite(time) ? time : 0;
};

/*
  QUICK ACCESS: All / Recently added tests  (/mock-tests)
    Take a Mock Test -> All / Recently Added -> Search + Filter -> Test cards
  Filters: Exam, Category, Type, Language  (+ Free / Paid)

  The address can pre-select filters, so older links keep working:
    /mock-tests?type=free        -> only free tests
    /mock-tests?type=sectional   -> only sectional tests
    /mock-tests?q=cgl            -> search text
*/
export default function AllTests() {
  const [params] = useSearchParams();

  const { tests, loading, error } = useTests();

  const [tab, setTab] = useState("recent"); // recent | all
  const [search, setSearch] = useState(params.get("q") || "");

  const [filters, setFilters] = useState(() => {
    const urlType = params.get("type") || "";

    return {
      ...EMPTY_FILTERS,
      access: urlType === "free" ? "free" : "",
      type: typeBySlug(urlType)?.value || "",
    };
  });

  // add exam name + group to every test once
  const rows = useMemo(
    () =>
      tests.map((t) => {
        const group = EXAM_TAXONOMY.find((g) => g.slug === t.topCategory);
        const exam = group?.subExams.find((s) => s.slug === t.subExam);

        return {
          ...t,
          _group: group,
          _examName: exam?.name || t.subExam || "",
        };
      }),
    [tests]
  );

  // only offer categories / exams that really have tests
  const categoryOptions = useMemo(
    () =>
      EXAM_TAXONOMY.filter((g) =>
        rows.some((t) => t.topCategory === g.slug)
      ),
    [rows]
  );

  const examOptions = useMemo(() => {
    const groups = filters.category
      ? EXAM_TAXONOMY.filter((g) => g.slug === filters.category)
      : EXAM_TAXONOMY;

    return groups.flatMap((g) =>
      g.subExams
        .filter((s) =>
          rows.some(
            (t) => t.topCategory === g.slug && t.subExam === s.slug
          )
        )
        .map((s) => ({
          value: `${g.slug}/${s.slug}`,
          label: filters.category ? s.name : `${s.name} (${g.title})`,
        }))
    );
  }, [rows, filters.category]);

  function setFilter(name, value) {
    setFilters((current) => {
      const next = { ...current, [name]: value };

      // changing the category clears an exam that no longer fits
      if (name === "category" && next.exam) {
        if (!next.exam.startsWith(`${value}/`) && value) next.exam = "";
      }

      return next;
    });
  }

  const query = search.trim().toLowerCase();

  const isFiltering =
    query !== "" || Object.values(filters).some((v) => v !== "");

  const matches = useMemo(() => {
    return rows
      .filter((t) => {
        if (filters.category && t.topCategory !== filters.category) {
          return false;
        }

        if (
          filters.exam &&
          `${t.topCategory}/${t.subExam}` !== filters.exam
        ) {
          return false;
        }

        if (filters.type && typeKeyOf(t) !== filters.type) return false;

        if (
          filters.language &&
          !(t.languages || []).includes(filters.language)
        ) {
          return false;
        }

        if (filters.access === "free" && t.isFree !== true) return false;
        if (filters.access === "paid" && t.isFree === true) return false;

        if (query) {
          const text = `${t.title} ${t.subject || ""} ${t._examName}`
            .toLowerCase();

          if (!text.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => createdTime(b) - createdTime(a)); // newest first
  }, [rows, filters, query]);

  // "Recently added" shows only the newest tests, but while the student is
  // searching / filtering we always show every match (nothing gets hidden)
  const showAll = tab === "all" || isFiltering;
  const list = showAll ? matches : matches.slice(0, RECENT_LIMIT);

  function clearAll() {
    setSearch("");
    setFilters(EMPTY_FILTERS);
  }

  if (loading) {
    return (
      <div className="at-page">
        <div className="at-status">Loading tests…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="at-page">
        <div className="at-status at-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="at-page">
      <header className="at-header">
        <div>
          <h1>Mock Tests</h1>
          <p>Jump straight to the latest tests, or search and filter.</p>
        </div>

        <Link to="/take-mock-test" className="at-browse">
          Browse by exam
          <ArrowRight size={16} />
        </Link>
      </header>

      {/* ---------- search ---------- */}
      <div className="at-search">
        <Search size={18} aria-hidden="true" />

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by test name, subject or exam"
          aria-label="Search tests"
        />

        {search && (
          <button
            type="button"
            className="at-search-clear"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ---------- filters ---------- */}
      <div className="at-filters">
        <label>
          <span>Category</span>
          <select
            value={filters.category}
            onChange={(e) => setFilter("category", e.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Exam</span>
          <select
            value={filters.exam}
            onChange={(e) => setFilter("exam", e.target.value)}
          >
            <option value="">All exams</option>
            {examOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Type</span>
          <select
            value={filters.type}
            onChange={(e) => setFilter("type", e.target.value)}
          >
            <option value="">All types</option>
            {TEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.singular}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Language</span>
          <select
            value={filters.language}
            onChange={(e) => setFilter("language", e.target.value)}
          >
            <option value="">Any language</option>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </label>

        <label>
          <span>Access</span>
          <select
            value={filters.access}
            onChange={(e) => setFilter("access", e.target.value)}
          >
            <option value="">Free + Paid</option>
            <option value="free">Free only</option>
            <option value="paid">Paid only</option>
          </select>
        </label>
      </div>

      {/* ---------- recent / all ---------- */}
      <div className="at-bar">
        <div className="at-tabs" role="tablist" aria-label="Which tests">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "recent"}
            className={tab === "recent" ? "on" : ""}
            onClick={() => setTab("recent")}
          >
            Recently Added
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            className={tab === "all" ? "on" : ""}
            onClick={() => setTab("all")}
          >
            All Tests
          </button>
        </div>

        <p className="at-count">
          {isFiltering
            ? `${matches.length} matching ${
                matches.length === 1 ? "test" : "tests"
              }`
            : tab === "recent"
              ? `Newest ${list.length} of ${matches.length}`
              : `${matches.length} ${matches.length === 1 ? "test" : "tests"}`}
        </p>

        {isFiltering && (
          <button type="button" className="at-clear" onClick={clearAll}>
            Clear filters
          </button>
        )}
      </div>

      {/* ---------- results ---------- */}
      {list.length === 0 ? (
        <div className="at-status">
          {isFiltering
            ? "No tests match your search or filters."
            : "No tests are available yet."}

          {isFiltering && (
            <button type="button" className="at-clear" onClick={clearAll}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="tc-grid">
          {list.map((test) => (
            <TestCard
              key={test.id || test.testId}
              test={test}
              showExam
            />
          ))}
        </div>
      )}

      {!showAll && matches.length > list.length && (
        <div className="at-more">
          <button type="button" onClick={() => setTab("all")}>
            Show all {matches.length} tests
          </button>
        </div>
      )}
    </div>
  );
}