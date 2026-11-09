import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { Panel } from "../src/panel/Panel";

// jsdom has no layout: every wrapper's measured rect comes from `rects`, keyed
// by the wrapper the Range was pointed at (selectNodeContents(wrapper)).
// Viewport 800px tall, 16px margins: with nothing covering it, the usable
// region is 16..784 (768px), so a 300px section centres at 16 + 234 = 250.
const rects = new Map<Node, DOMRect>();
const VIEW = 800;

function rect(top: number, height: number, width = 1000, left = 0): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left,
    right: left + width,
    width,
    x: left,
    y: top,
    toJSON() {},
  } as DOMRect;
}
const ZERO = rect(0, 0, 0);

/** A `<Variant>` wrapper with one element child, measured at `at` (or zero). */
function variant(name: string, option: string, at?: DOMRect, def = false) {
  const el = document.createElement("div");
  el.style.display = "contents";
  el.setAttribute("data-switches-name", name);
  el.setAttribute("data-switches-option", option);
  if (def) el.setAttribute("data-switches-default", "");
  const child = document.createElement("section");
  child.textContent = `${name} ${option}`;
  el.appendChild(child);
  document.body.appendChild(el);
  if (at) rects.set(el, at);
  return { el, child };
}

function footer() {
  variant("footer", "columns", rect(1800, 300), true);
  const cta = variant("footer", "cta", rect(1800, 300));
  variant("footer", "compact", rect(1800, 100));
  return cta;
}

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });
/** Let the scroll's requestAnimationFrame callback run. */
const frame = () =>
  act(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => {
          setTimeout(r, 0);
        }),
      ),
  );

async function openPanel() {
  render(<Panel />);
  await flush();
  fireEvent.click(screen.getByRole("button", { name: "Open Switches" }));
}

/** Stub the open sheet's viewport rect. */
function sheetAt(r: DOMRect) {
  const sheet = document.querySelector(".sw-sheet") as HTMLElement;
  sheet.getBoundingClientRect = () => r;
  return sheet;
}

/** A fixed header at the top, found by the stubbed elementsFromPoint. */
function fixedHeader(height: number) {
  const h = document.createElement("header");
  h.style.position = "fixed";
  h.style.top = "0px";
  document.body.prepend(h);
  h.getBoundingClientRect = () => rect(0, height);
  (document as { elementsFromPoint?: unknown }).elementsFromPoint = () => [h, document.body, document.documentElement];
  return h;
}

let into: ReturnType<typeof vi.fn>;
let to: ReturnType<typeof vi.fn>;
let clock = 0;
const realInner = window.innerHeight;
const realScrollTo = window.scrollTo;
const lastTop = () => (to.mock.calls.at(-1)?.[0] as ScrollToOptions | undefined)?.top;

function setReducedMotion(on: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      matches: on && q === "(prefers-reduced-motion: reduce)",
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
}

beforeEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
  document.documentElement.removeAttribute("data-switches-picks");
  history.replaceState(null, "", "/");
  rects.clear();
  // Far past any earlier test's scroll "in flight".
  clock += 1e6;
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  into = vi.fn();
  to = vi.fn();
  Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, writable: true, value: into });
  Object.defineProperty(window, "scrollTo", { configurable: true, writable: true, value: to });
  Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    writable: true,
    value(this: Range) {
      return rects.get(this.startContainer) ?? ZERO;
    },
  });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: VIEW });
  setReducedMotion(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  delete (Range.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
  delete (window as { matchMedia?: unknown }).matchMedia;
  delete (document as { elementsFromPoint?: unknown }).elementsFromPoint;
  delete (window as { onscrollend?: unknown }).onscrollend;
  Object.defineProperty(window, "visualViewport", { configurable: true, writable: true, value: undefined });
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 1024 });
  Object.defineProperty(window, "scrollTo", { configurable: true, writable: true, value: realScrollTo });
  Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: realInner });
});

describe("Panel scrolls to the section a version was picked for", () => {
  it("segmented: a short section below the fold is centred, smoothly, once", async () => {
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith({ top: 1800 - 250, behavior: "smooth" });
    expect(into).not.toHaveBeenCalled();
  });

  it("switch: a section taller than the region aligns its top below the margin", async () => {
    (window as { scrollY: number }).scrollY = 3000;
    variant("pricing", "tiers", rect(-2000, 300), true);
    variant("pricing", "simple", rect(-2000, 1200));
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Pricing" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith({ top: 3000 - 2000 - 16, behavior: "smooth" });
  });

  it("a section partly off screen is scrolled to", async () => {
    variant("pricing", "tiers", rect(700, 300), true);
    variant("pricing", "simple", rect(700, 300));
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Pricing" }));
    await frame();
    expect(lastTop()).toBe(700 - 250);
  });

  it("a short version with several children is centred as a whole", async () => {
    variant("pricing", "tiers", rect(1800, 300), true);
    const simple = variant("pricing", "simple", rect(1800, 400));
    simple.el.appendChild(document.createElement("p"));
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Pricing" }));
    await frame();
    expect(lastTop()).toBe(1800 - (16 + (768 - 400) / 2));
  });

  it("a section fully on screen is left where it is", async () => {
    variant("hero", "centered", rect(100, 400), true);
    variant("hero", "split", rect(100, 400));
    variant("hero", "minimal", rect(100, 300));
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Split" }));
    await frame();
    fireEvent.click(screen.getByRole("radio", { name: "Minimal" }));
    await frame();
    expect(to).not.toHaveBeenCalled();
    expect(into).not.toHaveBeenCalled();
  });

  it("prefers-reduced-motion: jumps instead of gliding", async () => {
    setReducedMotion(true);
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Compact" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith({ top: 1800 - (16 + (768 - 100) / 2), behavior: "auto" });
  });

  it("inside an inner overflow:auto scroller it falls back to scrollIntoView", async () => {
    const box = document.createElement("div");
    box.style.overflowY = "auto";
    Object.defineProperty(box, "scrollHeight", { value: 3000 });
    Object.defineProperty(box, "clientHeight", { value: 500 });
    document.body.appendChild(box);
    footer();
    const cta = document.querySelector('[data-switches-option="cta"]')!;
    box.appendChild(cta);
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(to).not.toHaveBeenCalled();
    expect(into).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    expect(into.mock.contexts[0]).toBe(cta.firstElementChild);
  });

  it("typing a note on an unpicked section records the pick but never scrolls", async () => {
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Note for Footer" }), {
      target: { value: "darker" },
    });
    await frame();
    expect(document.documentElement.getAttribute("data-switches-picks")).toBe("footer:columns");
    expect(to).not.toHaveBeenCalled();
    expect(into).not.toHaveBeenCalled();
  });

  it("does not scroll on load or for picks from the link", async () => {
    history.replaceState(null, "", "/?switches=footer%3Acta");
    footer();
    await openPanel();
    await frame();
    expect(to).not.toHaveBeenCalled();
    expect(into).not.toHaveBeenCalled();
  });

  it("a zero-size version (nothing measurable) is not scrolled to, and nothing throws", async () => {
    variant("footer", "columns", rect(1800, 300), true);
    variant("footer", "cta"); // measures as all zeros
    variant("footer", "compact", rect(1800, 100));
    await openPanel();
    expect(() => fireEvent.click(screen.getByRole("radio", { name: "Cta" }))).not.toThrow();
    await frame();
    expect(to).not.toHaveBeenCalled();
  });

  it("a version wrapper that disappeared before the frame is ignored", async () => {
    const cta = footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    cta.el.remove();
    await frame();
    expect(to).not.toHaveBeenCalled();
  });

  it("without Range rects, scrollTo, scrollIntoView, matchMedia or elementsFromPoint nothing throws", async () => {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    delete (Range.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
    delete (window as { matchMedia?: unknown }).matchMedia;
    Object.defineProperty(window, "scrollTo", { configurable: true, writable: true, value: undefined });
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(document.documentElement.getAttribute("data-switches-picks")).toBe("footer:cta");
  });
});

describe("rapid clicks: the latest one wins", () => {
  it("A then B before the frame: only B is scrolled to", async () => {
    footer();
    variant("pricing", "tiers", rect(3000, 300), true);
    variant("pricing", "simple", rect(3000, 300));
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    fireEvent.click(screen.getByRole("switch", { name: "Pricing" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(1);
    expect(lastTop()).toBe(3000 - 250);
  });

  it("while A's smooth scroll is moving, B is scrolled to even if it looks on screen now", async () => {
    footer();
    variant("hero", "centered", rect(100, 400), true);
    variant("hero", "split", rect(100, 400));
    variant("hero", "minimal", rect(100, 300));
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    clock += 300;
    fireEvent.click(screen.getByRole("radio", { name: "Split" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(2);
    // hero centred at the top of the page: clamped to 0, never the footer
    expect(lastTop()).toBe(0);
  });

  function heroAndFooter() {
    footer();
    variant("hero", "centered", rect(100, 400), true);
    variant("hero", "split", rect(100, 400));
    variant("hero", "minimal", rect(100, 300));
  }

  it("a long smooth scroll still on its way after 1.5s: the newest click still wins", async () => {
    heroAndFooter();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    clock += 1500;
    (window as { scrollY: number }).scrollY = 800; // not at 1550 yet
    fireEvent.click(screen.getByRole("radio", { name: "Split" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(2);
  });

  it("a scroll that already arrived: an on-screen click is a no-op again at once", async () => {
    heroAndFooter();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    clock += 50;
    (window as { scrollY: number }).scrollY = 1549;
    fireEvent.click(screen.getByRole("radio", { name: "Split" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(1);
  });

  it("a scroll stuck short of its target stops counting after 3s", async () => {
    heroAndFooter();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    clock += 3100;
    (window as { scrollY: number }).scrollY = 800;
    fireEvent.click(screen.getByRole("radio", { name: "Split" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(1);
  });

  it("scrollend (where supported) ends the flight", async () => {
    (window as { onscrollend?: unknown }).onscrollend = null;
    heroAndFooter();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    (window as { scrollY: number }).scrollY = 800; // the user stopped it with the wheel
    window.dispatchEvent(new Event("scrollend"));
    clock += 50;
    fireEvent.click(screen.getByRole("radio", { name: "Split" }));
    await frame();
    expect(to).toHaveBeenCalledTimes(1);
  });

  it("the destination is clamped to the page's scrollable height", async () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2000 });
    try {
      footer();
      await openPanel();
      fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
      await frame();
      expect(lastTop()).toBe(2000 - VIEW);
    } finally {
      delete (document.documentElement as { scrollHeight?: unknown }).scrollHeight;
    }
  });

  it("two clicks on the same section converge on one destination", async () => {
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    clock += 100;
    // mid-scroll: the page has moved 600px, the section with it
    (window as { scrollY: number }).scrollY = 600;
    rects.set(document.querySelector('[data-switches-option="compact"]')!, rect(1200, 100));
    rects.set(document.querySelector('[data-switches-option="cta"]')!, rect(1200, 300));
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(to.mock.calls.map((c) => (c[0] as ScrollToOptions).top)).toEqual([1550, 1550]);
  });
});

describe("same option", () => {
  it("clicking the already picked option scrolls to it without touching the pick or the URL", async () => {
    history.replaceState(null, "", "/?switches=footer%3Acta");
    footer();
    await openPanel();
    await frame();
    const stored = localStorage.getItem(Object.keys(localStorage)[0] ?? "");
    const replace = vi.spyOn(history, "replaceState");
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(lastTop()).toBe(1550);
    expect(replace).not.toHaveBeenCalled();
    expect(localStorage.getItem(Object.keys(localStorage)[0] ?? "")).toBe(stored);
    expect(document.documentElement.getAttribute("data-switches-picks")).toBe("footer:cta");
  });

  it("clicking the shown default (not yet picked) still records it, and scrolls", async () => {
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Columns" }));
    await frame();
    expect(document.documentElement.getAttribute("data-switches-picks")).toBe("footer:columns");
    expect(lastTop()).toBe(1550);
  });
});

describe("the open sheet", () => {
  it("covering the section's column shrinks the region to above the sheet", async () => {
    footer();
    // a phone: the 343px-wide section sits under the 268px sheet
    rects.set(document.querySelector('[data-switches-option="cta"]')!, rect(1800, 300, 343, 16));
    await openPanel();
    sheetAt(rect(400, 280, 268, 16));
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    // centred in the full region it would sit at 250..550, 39% under the
    // sheet: region 16..384 (368px), so it centres at 16 + 34 = 50
    expect(lastTop()).toBe(1800 - 50);
  });

  it("a section on screen but under the sheet is not 'comfortably on screen'", async () => {
    footer();
    rects.set(document.querySelector('[data-switches-option="cta"]')!, rect(400, 300, 343, 16));
    await openPanel();
    sheetAt(rect(400, 280, 268, 16));
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(lastTop()).toBe(400 - 50);
  });

  it("a sheet beside the section (no horizontal overlap) changes nothing", async () => {
    variant("footer", "columns", rect(400, 300, 600, 400), true);
    variant("footer", "cta", rect(400, 300, 600, 400));
    variant("footer", "compact", rect(400, 100, 600, 400));
    await openPanel();
    sheetAt(rect(400, 280, 268, 16));
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(to).not.toHaveBeenCalled();
  });

  it("a sheet clipping only the edge of a wide section changes nothing (desktop)", async () => {
    // the /demo hero at 1280px: section 230..1050, sheet 20..288
    variant("hero", "centered", rect(111, 546, 820, 230), true);
    variant("hero", "split", rect(111, 546, 820, 230));
    variant("hero", "minimal", rect(111, 400, 820, 230));
    await openPanel();
    sheetAt(rect(182, 410, 268, 20));
    fireEvent.click(screen.getByRole("radio", { name: "Minimal" }));
    await frame();
    expect(to).not.toHaveBeenCalled();
  });

  it("tablet (768px): a full-width section the sheet would cover a third of moves above it", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 768 });
    footer();
    rects.set(document.querySelector('[data-switches-option="cta"]')!, rect(1800, 300, 768, 0));
    await openPanel();
    sheetAt(rect(300, 480, 268, 16));
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    // placed at 250..550: 268 x 250 of 768 x 300 covered (29%); region 16..284
    // is shorter than the section, so its top goes to the region's top
    expect(lastTop()).toBe(1800 - 16);
  });

  it("desktop (960px): a left column ending just past the sheet is not moved", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 960 });
    footer();
    rects.set(document.querySelector('[data-switches-option="cta"]')!, rect(1800, 300, 640, 260));
    await openPanel();
    sheetAt(rect(182, 410, 268, 20));
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    // 28px of its 640px width under the sheet: about 4%, ignored
    expect(lastTop()).toBe(1550);
  });

  it("a narrow card wholly under the sheet's width counts even when little is covered", async () => {
    footer();
    rects.set(document.querySelector('[data-switches-option="cta"]')!, rect(1800, 400, 220, 30));
    await openPanel();
    sheetAt(rect(560, 220, 268, 20));
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    // centred at 200..600 only 10% of it is under the sheet, but all of its
    // width is: region 16..544 (528px), so it centres at 16 + 64 = 80
    expect(lastTop()).toBe(1800 - 80);
  });

  it("a short section that, centred, clears the sheet is centred in the full region", async () => {
    footer();
    rects.set(document.querySelector('[data-switches-option="compact"]')!, rect(1800, 100, 600, 16));
    await openPanel();
    sheetAt(rect(600, 180, 268, 16));
    fireEvent.click(screen.getByRole("radio", { name: "Compact" }));
    await frame();
    // 45% of its width is under the sheet, but centred at 350..450 none of it is
    expect(lastTop()).toBe(1800 - 350);
  });

  it("a narrow card beside the sheet is not moved", async () => {
    footer();
    rects.set(document.querySelector('[data-switches-option="cta"]')!, rect(1800, 300, 200, 300));
    await openPanel();
    sheetAt(rect(400, 280, 268, 16));
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(lastTop()).toBe(1550);
  });

  it("a closed sheet has no effect", async () => {
    footer();
    rects.set(document.querySelector('[data-switches-option="cta"]')!, rect(1800, 300, 343, 16));
    await openPanel();
    const sheet = sheetAt(rect(400, 280, 268, 16));
    fireEvent.click(screen.getByRole("button", { name: "Close Switches" }));
    expect(sheet.getAttribute("aria-hidden")).toBe("true");
    const cta = [...document.querySelectorAll('[role="radio"]')].find((b) => b.textContent === "Cta")!;
    fireEvent.click(cta);
    await frame();
    expect(lastTop()).toBe(1550);
  });
});

describe("fixed and sticky headers", () => {
  it("a fixed header's height is kept clear above the section", async () => {
    fixedHeader(64);
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    // region 80..784 (704px): centres at 80 + 202 = 282
    expect(lastTop()).toBe(1800 - 282);
  });

  it("a tall section starts below the header", async () => {
    fixedHeader(64);
    (window as { scrollY: number }).scrollY = 3000;
    variant("pricing", "tiers", rect(-2000, 300), true);
    variant("pricing", "simple", rect(-2000, 1200));
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Pricing" }));
    await frame();
    expect(lastTop()).toBe(3000 - 2000 - 80);
  });

  it("a section hidden under the header is not on screen", async () => {
    fixedHeader(64);
    variant("hero", "centered", rect(40, 400), true);
    variant("hero", "split", rect(40, 400));
    variant("hero", "minimal", rect(40, 300));
    (window as { scrollY: number }).scrollY = 500;
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Split" }));
    await frame();
    expect(lastTop()).toBe(500 + 40 - (80 + (704 - 400) / 2));
  });

  it("a tall sticky column (a sidebar) is not a header", async () => {
    const side = fixedHeader(VIEW);
    side.style.position = "sticky";
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(lastTop()).toBe(1550);
  });

  it("the host's larger scroll-margin-top wins over the header inset", async () => {
    fixedHeader(64);
    (window as { scrollY: number }).scrollY = 3000;
    variant("pricing", "tiers", rect(-2000, 300), true);
    const simple = variant("pricing", "simple", rect(-2000, 1200));
    simple.child.style.scrollMarginTop = "120px";
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Pricing" }));
    await frame();
    expect(lastTop()).toBe(3000 - 2000 - 120);
  });
});

describe("pinned sections (fixed or stuck sticky bars) are never scrolled to", () => {
  /** A two-version bar section with its rect at `at`; the chosen one styled `style`. */
  function bar(at: DOMRect, style: Partial<CSSStyleDeclaration>) {
    variant("bar", "plain", at, true);
    const promo = variant("bar", "promo", at);
    Object.assign(promo.child.style, style);
    promo.child.getBoundingClientRect = () => at;
    return promo;
  }

  it("a fixed bar: no scroll at all", async () => {
    (window as { scrollY: number }).scrollY = 900;
    bar(rect(0, 60), { position: "fixed", top: "0px" });
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Bar" }));
    await frame();
    expect(to).not.toHaveBeenCalled();
    expect(into).not.toHaveBeenCalled();
  });

  it("a sticky bar stuck at its offset: no scroll", async () => {
    (window as { scrollY: number }).scrollY = 900;
    bar(rect(0, 60), { position: "sticky", top: "0px" });
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Bar" }));
    await frame();
    expect(to).not.toHaveBeenCalled();
  });

  it("a sticky bar in normal flow, off screen: still scrolled to", async () => {
    bar(rect(1800, 300), { position: "sticky", top: "0px" });
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Bar" }));
    await frame();
    expect(lastTop()).toBe(1550);
  });

  it("sticky with top:auto is not pinned", async () => {
    (window as { scrollY: number }).scrollY = 900;
    bar(rect(0, 300), { position: "sticky" });
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Bar" }));
    await frame();
    expect(lastTop()).toBe(900 + 0 - 250);
  });

  it("a section inside a fixed container: no scroll", async () => {
    const box = document.createElement("div");
    box.style.position = "fixed";
    document.body.appendChild(box);
    footer();
    box.appendChild(document.querySelector('[data-switches-option="cta"]')!);
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(to).not.toHaveBeenCalled();
  });

  it("a fixed element elsewhere on the page does not block", async () => {
    const other = document.createElement("div");
    other.style.position = "fixed";
    document.body.appendChild(other);
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    expect(lastTop()).toBe(1550);
  });
});

describe("lengths and viewports", () => {
  it("a percent scroll-padding-top counts as 0, not as px", async () => {
    document.documentElement.style.scrollPaddingTop = "40%";
    try {
      footer();
      await openPanel();
      fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
      await frame();
      expect(lastTop()).toBe(1550);
    } finally {
      document.documentElement.style.scrollPaddingTop = "";
    }
  });

  it("a px scroll-padding-top on <html> is honoured", async () => {
    document.documentElement.style.scrollPaddingTop = "300px";
    try {
      (window as { scrollY: number }).scrollY = 3000;
      variant("pricing", "tiers", rect(-2000, 300), true);
      variant("pricing", "simple", rect(-2000, 1200));
      await openPanel();
      fireEvent.click(screen.getByRole("switch", { name: "Pricing" }));
      await frame();
      expect(lastTop()).toBe(3000 - 2000 - 300);
    } finally {
      document.documentElement.style.scrollPaddingTop = "";
    }
  });

  it("uses the visual viewport when there is one (on-screen keyboard, pinch zoom)", async () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      writable: true,
      value: { width: 1024, height: 600, offsetTop: 0, offsetLeft: 0 },
    });
    footer();
    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Cta" }));
    await frame();
    // region 16..584 (568px): centres at 16 + 134 = 150
    expect(lastTop()).toBe(1800 - 150);
  });
});
