"use client";

import { useEffect } from "react";

export function ScrollToTop() {
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
