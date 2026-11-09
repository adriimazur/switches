/** Room kept above and below a section for it to count as on screen. */
const MARGIN = 16;
/** Longest a smooth scroll started by a reveal can count as still moving. */
const FLIGHT_CAP_MS = 3000;
/** Below this, the space left above the open sheet is too small to aim for. */
const MIN_REGION = 64;
/** The open sheet counts once it covers this share of the section's visible area. */
const SHEET_SHARE = 0.18;

// Module state: one page, one scroll. The newest request wins.
let token = 0;
let frame = 0;
/** The smooth scroll a reveal started, until it arrives, ends or times out. */
let flight: { top: number; start: number } | null = null;

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
/** A computed length in px, or null for anything else ("auto", "10%"). */
const cssPx = (v: string | undefined): number | null => {
  const m = /^(-?[\d.]+)px$/.exec((v ?? "").trim());
  return m ? parseFloat(m[1]!) : null;
};
const px = (v: string | undefined) => cssPx(v) ?? 0;

type Box = { left: number; top: number; right: number; bottom: number };

/** The visible viewport, in the same coordinates as getBoundingClientRect. */
function viewport(): Box & { height: number } {
  const vv = window.visualViewport;
  const left = vv?.offsetLeft ?? 0;
  const top = vv?.offsetTop ?? 0;
  const width = vv?.width || window.innerWidth || document.documentElement.clientWidth;
  const height = vv?.height || window.innerHeight;
  return { left, top, right: left + width, bottom: top + height, height };
}

/** Is an earlier reveal's smooth scroll still on its way? */
function flying(): boolean {
  if (!flight) return false;
  if (now() >= flight.start + FLIGHT_CAP_MS || Math.abs(window.scrollY - flight.top) <= 2) flight = null;
  return !!flight;
}

/**
 * Does the open sheet hide a real part of `b` (clipped to the viewport)? Yes
 * when it covers SHEET_SHARE of that area, or when `b` lies within the
 * sheet's width (a narrow card under it).
 */
function covers(s: Box, b: Box, vp: Box): boolean {
  const l = Math.max(b.left, vp.left);
  const r = Math.min(b.right, vp.right);
  const t = Math.max(b.top, vp.top);
  const btm = Math.min(b.bottom, vp.bottom);
  if (r <= l || btm <= t) return false;
  const w = Math.min(r, s.right) - Math.max(l, s.left);
  const h = Math.min(btm, s.bottom) - Math.max(t, s.top);
  if (w <= 0 || h <= 0) return false;
  if (l >= s.left && r <= s.right) return true;
  return (w * h) / ((r - l) * (btm - t)) >= SHEET_SHARE;
}

/**
 * Is the section pinned to the viewport: one of its top elements, or an
 * ancestor, is `position: fixed`, or `sticky` and stuck at its offset now?
 * Scrolling the page would never move it into view.
 */
function pinned(wrapper: Element): boolean {
  const stuck = (el: Element) => {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed") return true;
    if (cs.position !== "sticky") return false;
    const t = cssPx(cs.top);
    return t !== null && Math.abs(el.getBoundingClientRect().top - t) <= 1;
  };
  for (const c of Array.from(wrapper.children)) if (stuck(c)) return true;
  for (let el = wrapper.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement)
    if (stuck(el)) return true;
  return false;
}

/** The `<Variant name option>` wrapper on the page, if any. */
function wrapperOf(name: string, option: string): Element | null {
  for (const el of document.querySelectorAll("[data-switches-name]")) {
    if (el.getAttribute("data-switches-name") === name && el.getAttribute("data-switches-option") === option)
      return el;
  }
  return null;
}

/**
 * The box a wrapper's content takes. The wrapper is `display:contents`, so its
 * own rect is all zeros: measure its children instead.
 */
function measure(wrapper: Element): DOMRect | null {
  let r: DOMRect | null = null;
  if (typeof Range !== "undefined" && typeof Range.prototype.getBoundingClientRect === "function") {
    const range = document.createRange();
    range.selectNodeContents(wrapper);
    r = range.getBoundingClientRect();
  }
  if ((!r || (!r.width && !r.height)) && wrapper.firstElementChild)
    r = wrapper.firstElementChild.getBoundingClientRect();
  return r && (r.width || r.height) ? r : null;
}

/**
 * Bottom edge of a fixed or sticky bar covering the top of the viewport (0 if
 * none), probed at three points along the top edge. Tall columns (a sticky
 * sidebar) are not headers; the panel's own elements and the section itself
 * are skipped. Capped at half the viewport.
 */
function topInset(view: number, wrapper: Element): number {
  if (typeof document.elementsFromPoint !== "function") return 0;
  const width = window.innerWidth || document.documentElement.clientWidth;
  const checked = new Set<Element>();
  let inset = 0;
  for (const f of [0.25, 0.5, 0.75]) {
    for (const hit of document.elementsFromPoint(width * f, 1)) {
      for (let el: Element | null = hit; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        if (checked.has(el)) break;
        checked.add(el);
        if (el.closest(".sw-root")) break;
        if (el.contains(wrapper) || wrapper.contains(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        if (cs.position === "sticky" && !((cssPx(cs.top) ?? 2) <= 1)) continue;
        const r = el.getBoundingClientRect();
        if (r.height <= 0 || r.top > 1 || r.bottom <= 0 || r.height > view / 2) continue;
        inset = Math.max(inset, r.bottom);
      }
    }
  }
  return Math.min(inset, view / 2);
}

/** A scrollable ancestor between the section and the page, if any. */
function innerScroller(wrapper: Element): Element | null {
  const page = document.scrollingElement;
  for (let el = wrapper.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    if (el === page) return null;
    const o = getComputedStyle(el).overflowY;
    if ((o === "auto" || o === "scroll" || o === "overlay") && el.scrollHeight > el.clientHeight) return el;
  }
  return null;
}

function reveal(name: string, option: string, sheetEl: Element | null) {
  const wrapper = wrapperOf(name, option);
  const target = wrapper?.firstElementChild;
  if (!wrapper || !target) return;
  if (pinned(wrapper)) return;
  const r = measure(wrapper);
  if (!r) return;
  const vp = viewport();
  // The visible region: below a fixed or sticky header (or the host's
  // scroll-margin-top/scroll-padding-top, if larger) and above the bottom margin.
  const host = px(getComputedStyle(target).scrollMarginTop) + px(getComputedStyle(document.documentElement).scrollPaddingTop);
  const top = Math.max(vp.top + MARGIN, topInset(vp.height, wrapper) + MARGIN, host);
  const full = vp.bottom - MARGIN;
  // While open, the panel's sheet may hide part of the section: then only the
  // space above it counts (if there is enough of it).
  let s: DOMRect | null = null;
  let above: number | null = null;
  if (sheetEl && sheetEl.getAttribute("aria-hidden") === "false") {
    s = sheetEl.getBoundingClientRect();
    const a = Math.min(vp.bottom, s.top) - MARGIN;
    if (s.width > 0 && s.height > 0 && a - top >= MIN_REGION) above = a;
  }
  const hidden = (b: Box) => s !== null && above !== null && covers(s, b, vp);
  // While an earlier reveal's smooth scroll is still on its way, "on screen
  // now" says nothing about where the page will stop: always aim for the newest.
  if (!flying() && r.top >= top && r.bottom <= full && !hidden(r)) return;
  const place = (bottom: number) => (r.height > bottom - top ? top : top + (bottom - top - r.height) / 2);
  let bottom = full;
  let at = place(bottom);
  if (above !== null && hidden({ left: r.left, right: r.right, top: at, bottom: at + r.height })) {
    bottom = above;
    at = place(bottom);
  }
  const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
  if (innerScroller(wrapper)) {
    // Inside an inner scroller our offsets would be wrong: let the browser do it.
    if (typeof target.scrollIntoView !== "function") return;
    const tall = r.height > bottom - top;
    target.scrollIntoView({ behavior, block: tall || wrapper.childElementCount > 1 ? "start" : "center" });
    flight = null;
    return;
  }
  if (typeof window.scrollTo !== "function") return;
  // Short: centred in the visible region. Tall: its top at the region's top.
  const page = document.scrollingElement ?? document.documentElement;
  const max = page.scrollHeight - window.innerHeight;
  let dest = Math.max(0, Math.round(window.scrollY + r.top - at));
  if (max > 0) dest = Math.min(dest, max);
  window.scrollTo({ top: dest, behavior });
  if (reduce) {
    flight = null;
    return;
  }
  const f = { top: dest, start: now() };
  flight = f;
  if ("onscrollend" in window)
    window.addEventListener("scrollend", () => flight === f && (flight = null), { once: true });
}

/**
 * After the user picked `option` for section `name` in the panel, scroll the
 * page so that section is in view, unless it already is. `sheet` is the
 * panel's sheet: while open, the part of the screen it covers does not count.
 * Runs on the next frame, once the new version shows; a newer call replaces a
 * pending one. Never throws.
 */
export function revealSection(name: string, option: string, sheet: Element | null = null): void {
  if (typeof window === "undefined" || typeof requestAnimationFrame !== "function") return;
  const id = ++token;
  if (frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (id !== token) return;
    try {
      reveal(name, option, sheet);
    } catch {
      // measuring or scrolling failed: the pick itself is already applied
    }
  });
}
