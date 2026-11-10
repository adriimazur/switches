"use client";

import { useSyncExternalStore } from "react";

// The site's global switches (mode, animation, accent; see SiteSwitches.tsx
// and the comment at the top of site.css) as JS sees them. The CSS does the
// work; JS only needs the Animation pick (Calm stills the illustration and
// the scroll glide, the same path as prefers-reduced-motion; Full lets the
// illustration play even under it). The source is the
// attribute the package writes on <html> before first paint and rewrites on
// every pick, so it is live without a reload.

const ATTR = "data-switches-picks";
const REDUCE = "(prefers-reduced-motion: reduce)";

/** The option picked for a section, from <html data-switches-picks>, or null. */
export function sitePick(name: string): string | null {
  if (typeof document === "undefined") return null;
  const attr = document.documentElement.getAttribute(ATTR);
  if (!attr) return null;
  for (const entry of attr.split(",")) {
    const i = entry.indexOf(":");
    if (i <= 0) continue;
    try {
      if (decodeURIComponent(entry.slice(0, i)) === name) return decodeURIComponent(entry.slice(i + 1));
    } catch {
      // A malformed entry: not ours.
    }
  }
  return null;
}

/**
 * For motion that isn't decorative (the scroll glide): Calm picked in the
 * panel, or reduced motion asked for by the OS. Full never overrides the OS
 * here.
 */
export function isCalm(): boolean {
  if (typeof window === "undefined") return false;
  return sitePick("animation") === "calm" || window.matchMedia(REDUCE).matches;
}

/** Only the Calm pick, for parts that already follow prefers-reduced-motion themselves. */
export function isCalmPicked(): boolean {
  return sitePick("animation") === "calm";
}

/** Only the Full pick: decorative motion may play even under prefers-reduced-motion. */
export function isFullPicked(): boolean {
  return sitePick("animation") === "full";
}

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] });
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", onChange);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", onChange);
  };
}

/** Live isCalm(). False on the server and during hydration, then the real value. */
export function useCalm(): boolean {
  return useSyncExternalStore(subscribe, isCalm, () => false);
}

/** Live isCalmPicked(). */
export function useCalmPicked(): boolean {
  return useSyncExternalStore(subscribe, isCalmPicked, () => false);
}

/** Live isFullPicked(). */
export function useFullPicked(): boolean {
  return useSyncExternalStore(subscribe, isFullPicked, () => false);
}

/** Live pick for a section (null when there is none), without a reload. */
export function useSitePick(name: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => sitePick(name),
    () => null,
  );
}
