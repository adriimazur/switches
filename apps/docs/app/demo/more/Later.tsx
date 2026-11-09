"use client";
import { useEffect, useState, type ReactNode } from "react";

// Renders its children only a moment after hydration, like a section that
// appears after a client fetch, a lazy chunk or a Suspense boundary. The
// e2e suite uses it to check that picks for late sections survive a reload.
export function Later({ children, ms = 400 }: { children: ReactNode; ms?: number }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return shown ? <>{children}</> : null;
}
