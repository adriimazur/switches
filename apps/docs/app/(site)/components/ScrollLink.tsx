"use client";

import { useEffect, type ReactNode } from "react";
import { isCalm } from "./sitePicks";

// A plain link (a full page load, so the pick applies before first paint) that
// asks the next page to glide down to a section. The page loads at the top and
// then scrolls, instead of jumping, so the visitor sees where they are going.
const KEY = "sw:scroll";

export function ScrollLink({ href, to, children }: { href: string; to: string; children: ReactNode }) {
  return (
    <a
      href={href}
      onClick={() => {
        try {
          sessionStorage.setItem(KEY, to);
        } catch {
          // Storage blocked: the link still works, the page just stays at the top.
        }
      }}
    >
      {children}
    </a>
  );
}

export function ScrollOnArrival() {
  useEffect(() => {
    let id: string | null = null;
    try {
      id = sessionStorage.getItem(KEY);
    } catch {
      return;
    }
    if (!id) return;
    const target = id;
    // Removed inside the timer, not here: React StrictMode runs this effect twice
    // in development, and the first run's cleanup cancels its timer.
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(KEY);
      } catch {}
      const el = document.getElementById(target);
      if (!el) return;
      // Reduced motion, or Calm picked in the panel: jump instead of gliding.
      el.scrollIntoView({ behavior: isCalm() ? "auto" : "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
