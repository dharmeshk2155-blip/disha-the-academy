import { useEffect, useState } from "react";

import { API_BASE } from "../config/api";

/*
  Loads every active test once (GET /api/tests).
  Used by the Exam page, the Test list and the All tests page.
*/
export default function useTests() {
  const [state, setState] = useState({
    tests: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`${API_BASE}/api/tests`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tests.");
        }

        const data = await response.json();

        const tests = Array.isArray(data)
          ? data
          : Array.isArray(data.tests)
            ? data.tests
            : [];

        setState({ tests, loading: false, error: "" });
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Tests loading error:", err);

        setState({
          tests: [],
          loading: false,
          error: err.message || "Unable to load tests.",
        });
      }
    }

    load();

    return () => controller.abort();
  }, []);

  return state;
}