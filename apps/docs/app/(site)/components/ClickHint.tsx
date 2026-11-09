"use client";

import { useEffect, useState } from "react";

// A hand-drawn "click here" pointing at the real Switches round button (fixed
// bottom left, drawn by the package's panel once it has found sections). Only
// on the Overview. Decorative: aria-hidden and pointer-events: none, so it
// never takes a click or focus; the button has its own accessible name.
// It goes for good once the panel is opened (remembered for the session).
// On phones it only shows while the illustration is in view and only where it
// covers no text and none of the illustration's drawn panel, button or page;
// elsewhere it fades out rather than overlap anything.
// Motion (the arrow drawing in, the word's idle wiggle) lives in site.css and
// stops under prefers-reduced-motion or the Calm pick, leaving it static.

const KEY = "sw:hint-dismissed";
type Shape = "above" | "side" | "below";

// Three drawings. Wide screens: the word above-right of the button, the arrow
// curving down to it, in the empty margin left of the sidebar. Phones (the
// sidebar is a top bar there) try the word beside the button with a short
// arrow pointing left, then the wide-screen drawing, then the word below-right
// with the arrow curving up to the button, and take the nearest clean one
// (keeping the one showing while it stays clean).
const DRAWINGS = {
  above: {
    w: 150,
    h: 96,
    // Where the arrow's tip is in the drawing, and where it lands relative to
    // the button's top-right corner (just off its edge).
    tip: { x: 8, y: 90 },
    at: { x: 0, y: 0 },
    word: { x: 50, y: 25, rotate: "rotate(-5 96 18)", origin: "96px 20px" },
    // Where the handwritten word's text box lands in the drawing (measured)
    wordBox: { x: 48, y: -4, w: 88, h: 42 },
    shaft:
      "M60 37c-6.5 2.4-13.6 6.8-19.4 12.9-5.3 5.6-8.9 11.6-12.6 18.2-3.4 6-7.1 12.6-11.8 17.5-2.3 2.4-5.1 3.6-8.2 3.4",
    pass: "M57.6 38.6c-5.8 2.6-11.7 6.6-16.4 11.8-4.7 5.2-8 10.9-11.2 16.7",
    heads: ["M10.2 78.6c-.4 3.6-.9 7.2-1.9 11", "M19.4 85.6c-3.6 1.6-7.3 3-11.2 4.2"],
  },
  side: {
    w: 156,
    h: 60,
    tip: { x: 7, y: 44 },
    at: { x: 6, y: 17 },
    word: { x: 46, y: 24, rotate: "rotate(-4 96 16)", origin: "96px 16px" },
    wordBox: { x: 44, y: -4, w: 88, h: 41 },
    shaft: "M47 32.5c-3.6 5.4-9.4 9.2-16.4 11.1-7.6 2-15.3 2.1-23.6 .9",
    pass: "M44.6 35.4c-3.6 3.8-8.4 6.1-13.9 7.4",
    heads: ["M15.6 40.4c-2.9 1.3-5.8 2.5-8.7 3.7", "M14.2 50.2c-2.4-1.9-4.7-3.8-7.1-5.7"],
  },
  below: {
    w: 156,
    h: 70,
    tip: { x: 7, y: 10 },
    at: { x: 6, y: 30 },
    word: { x: 46, y: 56, rotate: "rotate(-3 96 48)", origin: "96px 48px" },
    wordBox: { x: 44, y: 27, w: 88, h: 41 },
    shaft: "M45 46c-10.2-1.6-21.6-9.4-29.6-21.8-3.2-5-5.6-9.6-8.2-14.4",
    pass: "M42.4 47.2c-9.6-2.2-18.8-8.8-25.4-18.2",
    heads: ["M7.2 18.6c-.1-2.9-.1-5.8 0-8.8", "M14.8 14.6c-2.6-1.4-5.1-3-7.6-4.6"],
  },
} as const;

type Spot = { left: number; top: number; shape: Shape; visible: boolean };
type Box = { left: number; top: number; right: number; bottom: number };

const PHONE = 820;

function dismissed(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

const overlaps = (a: DOMRect, b: Box) =>
  a.width > 0 && a.height > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const touchesAny = (selector: string, box: Box) =>
  Array.from(document.querySelectorAll(selector)).some((el) => overlaps(el.getBoundingClientRect(), box));

/** The drawing's box for this button, nudged down by dy (up when negative). */
function boxFor(r: DOMRect, shape: Shape, dy = 0): Box {
  const d = DRAWINGS[shape];
  const left = r.right + d.at.x - d.tip.x;
  const top = r.top + d.at.y - d.tip.y + dy;
  return { left, top, right: left + d.w, bottom: top + d.h };
}

// What the hint must never cover on a phone: what has to stay readable (the
// top bar, the page's text blocks, the Try it mock, the code blocks: every
// prose child but the illustration) and the illustration's drawn round
// button, so it never reads as a second button. The rest of the drawing
// (phone, panel, page bars) is decoration and may sit under it.
const PHONE_AVOID = [".s-side", ".s-prose > :not(.il):not(.s-hint)", ".il .so-button"].join(", ");

// The words drawn in the illustration's panel (its title, row labels, segment
// labels, Copy my picks): avoided when there is a spot that allows it.
const DRAWN_TEXT = ".il .so-live .so-sheet :is(.so-title, .so-label, .ss-seg__option, .so-copy span)";

/** Vertical nudges tried for each drawing on a phone, nearest first. */
const NUDGES = [0, -6, 6, -12, 12, -18, 18, -24, 24, -30, 30, -36, 36];

/** Where the drawing goes for this button, or null when there is no room. */
function spotFor(button: Element, illustrationInView: boolean, prefer?: Shape): Omit<Spot, "visible"> | null {
  const r = button.getBoundingClientRect();
  if (!r.width) return null;
  const inside = (b: Box) => b.top >= 64 && b.right <= window.innerWidth - 8;
  if (window.innerWidth > PHONE) {
    const box = boxFor(r, "above");
    // Never over the sidebar's navigation or its foot (version, GitHub).
    if (!inside(box) || touchesAny(".s-nav, .s-side-foot", box)) return null;
    return { left: box.left, top: box.top, shape: "above" };
  }
  if (!illustrationInView) return null;
  // Wait for the live illustration (its final layout), so the hint doesn't
  // appear in one place and then hop to another.
  if (document.querySelector(".il .so-round:not([data-ready])")) return null;
  // Candidates, nearest first: each drawing as designed, then nudged up or
  // down, so it moves a little instead of blinking out while the page
  // scrolls. The drawing showing now goes first at each distance, so it
  // doesn't swap shape needlessly. The drawn panel's words are a soft
  // constraint (avoided when a spot allows it), the rest are hard.
  const shapes: Shape[] = ["side", "above", "below"];
  const order: Shape[] = prefer ? [prefer, ...shapes.filter((x) => x !== prefer)] : shapes;
  const candidates: { shape: Shape; box: Box }[] = [];
  for (const dy of NUDGES) for (const shape of order) candidates.push({ shape, box: boxFor(r, shape, dy) });
  const clean = candidates.filter(({ box }) => inside(box) && box.bottom <= window.innerHeight && !touchesAny(PHONE_AVOID, box));
  // Ranked: the arrow's tip still lands beside the button and the handwritten
  // word is clear of the drawn panel's words; then the tip beside the button.
  const tipBeside = ({ shape, box }: { shape: Shape; box: Box }) => {
    const y = box.top + DRAWINGS[shape].tip.y;
    return y >= r.top - 12 && y <= r.bottom - 4;
  };
  const wordClear = ({ shape, box }: { shape: Shape; box: Box }) => {
    const w = DRAWINGS[shape].wordBox;
    return !touchesAny(DRAWN_TEXT, { left: box.left + w.x, top: box.top + w.y, right: box.left + w.x + w.w, bottom: box.top + w.y + w.h });
  };
  // A spot whose arrow points past the button (next to the illustration's
  // drawn button, or at nothing) is worse than none: those are never taken.
  const best = clean.find((c) => tipBeside(c) && wordClear(c)) ?? clean.find(tipBeside);
  return best ? { left: best.box.left, top: best.box.top, shape: best.shape } : null;
}

export function ClickHint({ fontClass }: { fontClass: string }) {
  const [spot, setSpot] = useState<Spot | null>(null);

  useEffect(() => {
    if (dismissed()) return;
    let button: Element | null = null;
    let done = false;
    let inView = false;
    let frame = 0;
    let shown: Shape | undefined;

    // Keep the last place while hidden, so it fades out where it was.
    const place = () => {
      cancelAnimationFrame(frame);
      if (done) return;
      if (button && !button.isConnected) {
        // The panel re-mounted: look for the new button.
        button = null;
        sized.disconnect();
        appear.observe(document.body, { childList: true, subtree: true });
      }
      const next = button ? spotFor(button, inView, shown) : null;
      shown = next?.shape;
      setSpot((prev) => {
        const want = next ? { ...next, visible: true } : prev ? { ...prev, visible: false } : null;
        // Unchanged (most scroll frames, and every one on desktop): keep the
        // same object so React skips the re-render.
        const same =
          prev && want && prev.left === want.left && prev.top === want.top && prev.shape === want.shape && prev.visible === want.visible;
        return same || (!prev && !want) ? prev : want;
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    const dismiss = () => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        // Storage blocked: it stays gone for this page view only.
      }
      stop();
    };
    const expanded = new MutationObserver(() => {
      if (button?.getAttribute("aria-expanded") === "true") dismiss();
    });
    // The button's own box (it can move or resize without a window resize).
    const sized = new ResizeObserver(schedule);
    const find = () => {
      const b = document.querySelector(".sw-button");
      if (!b || b === button) return;
      appear.disconnect();
      button?.removeEventListener("click", dismiss);
      button = b;
      if (b.getAttribute("aria-expanded") === "true") return dismiss();
      b.addEventListener("click", dismiss);
      expanded.disconnect();
      expanded.observe(b, { attributes: true, attributeFilter: ["aria-expanded"] });
      sized.observe(b);
      place();
    };
    // The panel mounts after hydration, once it has found sections.
    const appear = new MutationObserver(find);
    appear.observe(document.body, { childList: true, subtree: true });
    // Phones: shown only while the illustration is on screen.
    const seen = new IntersectionObserver(([entry]) => {
      inView = !!entry?.isIntersecting;
      schedule();
    });
    const il = document.querySelector(".il");
    if (il) seen.observe(il);
    // The illustration settles after hydration (the first-paint still gives
    // way to the live stage, which picks its layout and scale): re-place then,
    // since on a phone the hint sits over it.
    const settles = new MutationObserver(schedule);
    if (il) settles.observe(il, { attributes: true, subtree: true, attributeFilter: ["data-ready", "data-layout"] });
    document.fonts?.ready.then(schedule).catch(() => {});
    window.addEventListener("resize", schedule);
    // Only phones care about scrolling (the illustration in view, text under it).
    const onScroll = () => {
      if (window.innerWidth <= PHONE) schedule();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const stop = () => {
      done = true;
      cancelAnimationFrame(frame);
      appear.disconnect();
      expanded.disconnect();
      sized.disconnect();
      seen.disconnect();
      settles.disconnect();
      button?.removeEventListener("click", dismiss);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", onScroll);
      setSpot(null);
    };
    find();
    return stop;
  }, []);

  if (!spot) return null;
  const d = DRAWINGS[spot.shape];
  return (
    <div
      className={`s-hint ${fontClass}`}
      style={{ left: spot.left, top: spot.top }}
      data-shape={spot.shape}
      data-visible={spot.visible}
      aria-hidden
      data-testid="click-hint"
    >
      <svg viewBox={`0 0 ${d.w} ${d.h}`} width={d.w} height={d.h} focusable="false">
        <g className="s-hint-word" style={{ transformOrigin: d.word.origin }}>
          <text x={d.word.x} y={d.word.y} className="s-hint-text" transform={d.word.rotate}>
            click here
          </text>
        </g>
        <g className="s-hint-ink">
          {/* The shaft: one stroke, then a lighter second pass over part of it */}
          <path className="s-hint-shaft" pathLength={1} d={d.shaft} />
          <path className="s-hint-pass" pathLength={1} d={d.pass} />
          {/* The head: two quick strokes */}
          <path className="s-hint-head" pathLength={1} d={d.heads[0]} />
          <path className="s-hint-head s-hint-head-2" pathLength={1} d={d.heads[1]} />
        </g>
      </svg>
    </div>
  );
}
