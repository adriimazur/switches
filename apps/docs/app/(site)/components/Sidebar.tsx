"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { withBase } from "../../base";
import { NAV } from "../nav";

/**
 * The site navigation. On wide screens a sticky sidebar; below 820px a top bar
 * whose Menu button discloses the same list (closes on route change and Esc).
 */
export function Sidebar({ brand, foot }: { brand: ReactNode; foot: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Close the menu whenever the route changes. If it was open (a link in it
  // was followed), move focus to the new page's content so keyboard users
  // don't stay on a link that is now hidden.
  const wasOpen = useRef(false);
  wasOpen.current = open;
  useEffect(() => {
    if (wasOpen.current) document.getElementById("main")?.focus();
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="s-side">
      <div className="s-side-bar">
        {brand}
        <button
          ref={button}
          type="button"
          className="s-menu"
          aria-expanded={open}
          aria-controls="s-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 16 16" aria-hidden focusable="false">
            {open ? <path d="M4 4l8 8M12 4l-8 8" /> : <path d="M2.5 5h11M2.5 11h11" />}
          </svg>
          Menu
        </button>
      </div>
      <nav id="s-nav" className="s-nav" aria-label="Site" data-open={open}>
        {NAV.map((g, i) => (
          <div className="s-nav-group" key={g.label ?? i}>
            {g.label && <p className="s-nav-label">{g.label}</p>}
            <ul>
              {g.items.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a href={withBase(item.href)}>{item.title}</a>
                  ) : (
                    <Link href={item.href} aria-current={path === item.href ? "page" : undefined}>
                      {item.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="s-side-foot">{foot}</div>
      </nav>
    </header>
  );
}
