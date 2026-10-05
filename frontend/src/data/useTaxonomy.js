import { useEffect, useSyncExternalStore } from "react";

import {
  ensureTaxonomyLoaded,
  getTaxonomyVersion,
  subscribeTaxonomy,
} from "./examTaxonomy";

/*
  Call this at the top of any PAGE that shows exams (lists, filters, forms).
  It loads the admin-added exams once and re-renders the page when they
  change, so a new exam appears without refreshing.
*/
export default function useTaxonomy() {
  useEffect(() => {
    ensureTaxonomyLoaded();
  }, []);

  return useSyncExternalStore(
    subscribeTaxonomy,
    getTaxonomyVersion,
    getTaxonomyVersion
  );
}