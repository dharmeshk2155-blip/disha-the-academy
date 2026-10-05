import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/*
  Back button = go to the page the student really came from.

  Example: Home -> HP Police exam page. Back must return to Home, not to a
  fixed "Police" list. If the page was opened directly (new tab, shared
  link) there is no previous page, so the fallback address is used.
*/
export default function useGoBack(fallback = "/") {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    // "default" = first page of this visit, nothing to go back to
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, location.key, fallback]);
}