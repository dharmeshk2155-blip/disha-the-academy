import { useEffect } from "react";

/**
 * Puts the page into full screen while it is mounted.
 *
 * Browsers only allow full screen after a user gesture, so we:
 *   1. try immediately (works when the user just clicked a link/button),
 *   2. otherwise wait for the first tap / click / key press.
 * If the student leaves full screen on purpose (Esc / exit button) we
 * do NOT force them back in. When the page closes we leave full screen
 * again, but only if this hook was the one that entered it.
 * Browsers without the API (iPhone Safari) are silently ignored.
 */
export default function useAutoFullscreen(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const el = document.documentElement;
    if (!el.requestFullscreen || document.fullscreenElement) {
      return undefined;
    }

    let entered = false;
    let optedOut = false;
    let disposed = false;

    const events = ["pointerdown", "touchend", "click", "keydown"];

    const removeListeners = () =>
      events.forEach((e) =>
        document.removeEventListener(e, tryEnter, true)
      );

    function tryEnter() {
      if (disposed || optedOut || document.fullscreenElement) return;

      el.requestFullscreen()
        .then(() => {
          entered = true;
          removeListeners();
        })
        .catch(() => {
          /* no user gesture yet - the listeners will retry */
        });
    }

    function onChange() {
      // user left full screen by themselves -> respect it
      if (entered && !document.fullscreenElement) {
        optedOut = true;
        removeListeners();
      }
    }

    document.addEventListener("fullscreenchange", onChange);
    events.forEach((e) =>
      document.addEventListener(e, tryEnter, true)
    );
    tryEnter();

    return () => {
      disposed = true;
      removeListeners();
      document.removeEventListener("fullscreenchange", onChange);

      if (entered && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enabled]);
}
