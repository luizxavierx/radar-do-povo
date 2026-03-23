import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const { history } = window;
    const previousScrollRestoration = history.scrollRestoration;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default ScrollToTop;
