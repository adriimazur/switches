import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act } from "react";
import { Variant, switchesCss } from "../src/variant";
import { pickScript, pickToken } from "../src/script";
import { parseUrlPicks, createStore } from "../src/core/store";

/**
 * Mount server HTML into the jsdom document and report which variants are
 * visible, using jsdom's real selector matching and cascade.
 *
 * NOTE (jsdom limitation): jsdom lets a plain inline `style` beat a stylesheet
 * `!important` declaration, which real browsers never do. So before reading
 * computed styles we drop the inline `style="display:contents"` from the
 * wrappers; the stylesheet rules are then evaluated exactly as shipped.
 * Real-browser rendering (inline style + CSS) is covered by Task 8 Playwright.
 */
function mount(html: string, picks?: string) {
  document.body.innerHTML = html;
  if (picks === undefined) delete document.documentElement.dataset.switchesPicks;
  else document.documentElement.dataset.switchesPicks = picks;
  const wrappers = Array.from(
    document.querySelectorAll<HTMLElement>("[data-switches-name]"),
  );
  for (const w of wrappers) {
    expect(w.style.display).toBe("contents");
    w.removeAttribute("style");
  }
  const shown = (el: Element | null): boolean =>
    !el || (getComputedStyle(el).display !== "none" && shown(el.parentElement));
  return wrappers
    .filter((w) => shown(w))
    .map((w) => {
      const c = w.cloneNode(true) as HTMLElement;
      c.querySelectorAll("style").forEach((st) => st.remove());
      return c.textContent;
    })
    .join("|");
}

function ssr(node: ReactNode) {
  return renderToString(<>{node}</>);
}

/** Wrapper elements in server HTML (parsed, so CSS text does not count). */
function wrappersIn(html: string) {
  const t = document.createElement("template");
  t.innerHTML = html;
  return Array.from(t.content.querySelectorAll<HTMLElement>("[data-switches-name]"));
}

const heroAB = (
  <>
    <Variant name="hero" option="a">A</Variant>
    <Variant name="hero" option="b">B</Variant>
  </>
);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  delete document.documentElement.dataset.switchesPicks;
});

describe("Variant SSR", () => {
  it("puts every version in the server HTML", () => {
    const html = ssr(heroAB);
    expect(html).toContain("A");
    expect(html).toContain("B");
    const ws = wrappersIn(html);
    expect(ws.map((w) => w.tagName)).toEqual(["DIV", "DIV"]);
    expect(ws.map((w) => w.getAttribute("data-switches-name"))).toEqual(["hero", "hero"]);
    expect(ws.map((w) => w.getAttribute("data-switches-option"))).toEqual(["a", "b"]);
    expect(ws.map((w) => w.textContent)).toEqual(["A", "B"]);
    expect(ws.every((w) => w.style.display === "contents")).toBe(true);
  });

  it("writes label and default attributes only when given", () => {
    const html = ssr(
      <Variant name="hero" option="b" label="Big B" default>
        B
      </Variant>,
    );
    const [w] = wrappersIn(html);
    expect(w!.getAttribute("data-switches-label")).toBe("Big B");
    expect(w!.hasAttribute("data-switches-default")).toBe(true);
    const [plain] = wrappersIn(ssr(<Variant name="hero" option="a">A</Variant>));
    expect(plain!.hasAttribute("data-switches-label")).toBe(false);
    expect(plain!.hasAttribute("data-switches-default")).toBe(false);
  });

  it("escapes hostile names so the style tag cannot be broken out of", () => {
    const html = ssr(
      <Variant name={'x"</style><b>pwn'} option="a">
        A
      </Variant>,
    );
    expect(html).not.toContain("</style><b>");
  });
  it("hydrates on the client without mismatches", async () => {
    const err = vi.spyOn(console, "error");
    const App = () => <main>{heroAB}</main>;
    const el = document.createElement("div");
    el.innerHTML = renderToString(<App />);
    document.body.appendChild(el);
    const recoverable: unknown[] = [];
    await act(async () => {
      hydrateRoot(el, <App />, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(err).not.toHaveBeenCalled();
  });
});

describe("Variant CSS (no JS beyond the pick script)", () => {
  it("no pick: shows the first version in DOM order", () => {
    expect(mount(ssr(heroAB))).toBe("A");
  });

  it("no pick: an explicit default wins over the first", () => {
    const html = ssr(
      <>
        <Variant name="hero" option="a">A</Variant>
        <Variant name="hero" option="b" default>B</Variant>
        <Variant name="hero" option="c">C</Variant>
      </>,
    );
    expect(mount(html)).toBe("B");
  });

  it("a pick shows the picked version only", () => {
    expect(mount(ssr(heroAB), "hero:b")).toBe("B");
  });

  it("a pick overrides an explicit default", () => {
    const html = ssr(
      <>
        <Variant name="hero" option="a">A</Variant>
        <Variant name="hero" option="b" default>B</Variant>
        <Variant name="hero" option="c">C</Variant>
      </>,
    );
    expect(mount(html, "hero:c")).toBe("C");
    expect(mount(html, "hero:a")).toBe("A");
  });

  it("picks for several sections apply independently", () => {
    const html = ssr(
      <>
        {heroAB}
        <Variant name="pricing" option="simple">S</Variant>
        <Variant name="pricing" option="table">T</Variant>
        <Variant name="footer" option="x">X</Variant>
        <Variant name="footer" option="y">Y</Variant>
      </>,
    );
    expect(mount(html, "hero:b,pricing:table")).toBe("B|T|X");
    expect(mount(html, "pricing:table,hero:b")).toBe("B|T|X");
    expect(mount(html, "footer:y,hero:b,pricing:simple")).toBe("B|S|Y");
  });

  it("stale picks (unknown option or section) leave the default visible", () => {
    const html = ssr(
      <>
        <Variant name="hero" option="a">A</Variant>
        <Variant name="hero" option="b" default>B</Variant>
      </>,
    );
    expect(mount(html, "hero:gone")).toBe("B");
    expect(mount(html, "nosuch:a")).toBe("B");
    expect(mount(ssr(heroAB), "hero:gone,other:x")).toBe("A");
  });

  it("a pick for one section does not leak into a section whose name is a prefix", () => {
    const html = ssr(
      <>
        {heroAB}
        <Variant name="hero2" option="a">2A</Variant>
        <Variant name="hero2" option="b">2B</Variant>
      </>,
    );
    expect(mount(html, "hero2:b")).toBe("A|2B");
    expect(mount(html, "xhero:b")).toBe("A|2A");
  });

  it("names and options with separators round-trip through pickToken", () => {
    const html = ssr(
      <>
        <Variant name="a,b" option="x:y">1</Variant>
        <Variant name="a,b" option="z w">2</Variant>
      </>,
    );
    expect(mount(html, pickToken("a,b", "z w"))).toBe("2");
  });

  it("works with other markup between versions and sections nested in sections", () => {
    const html = ssr(
      <main>
        <h1>t</h1>
        <Variant name="hero" option="a">A</Variant>
        <p>between</p>
        <Variant name="hero" option="b">
          B<Variant name="inner" option="x">X</Variant>
          <Variant name="inner" option="y">Y</Variant>
        </Variant>
      </main>,
    );
    expect(mount(html)).toBe("A");
    expect(mount(html, "hero:b")).toBe("BXY|X");
    expect(mount(html, "hero:b,inner:y")).toBe("BXY|Y");
  });

  it("switchesCss is a string of rules for one version", () => {
    const css = switchesCss("hero", "a");
    expect(typeof css).toBe("string");
    expect(css).toContain('[data-switches-name="hero"]');
  });
});

describe("Variant with NEXT_PUBLIC_SWITCHES=off", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SWITCHES", "off"));

  it("shows only the first version, ignoring picks", () => {
    expect(mount(ssr(heroAB))).toBe("A");
    expect(mount(ssr(heroAB), "hero:b")).toBe("A");
  });

  it("shows only the default version, ignoring picks", () => {
    const html = ssr(
      <>
        <Variant name="hero" option="a">A</Variant>
        <Variant name="hero" option="b" default>B</Variant>
      </>,
    );
    expect(mount(html)).toBe("B");
    expect(mount(html, "hero:a")).toBe("B");
  });
});

describe("pickScript", () => {
  const run = () => new Function(pickScript)();

  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "/");
  });

  it("reads ?switches= into data-switches-picks", () => {
    history.replaceState(null, "", "/?switches=hero:b");
    run();
    expect(document.documentElement.dataset.switchesPicks).toBe("hero:b");
  });

  it("writes the documented format for several picks", () => {
    history.replaceState(null, "", "/?switches=hero:phone,pricing:simple");
    run();
    expect(document.documentElement.dataset.switchesPicks).toBe(
      "hero:phone,pricing:simple",
    );
  });

  it("falls back to localStorage switches:v1, URL wins per section", () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({
        hero: { option: "a", path: "/" },
        pricing: { option: "simple", path: "/", note: "hi" },
        junk: { option: 3 },
      }),
    );
    run();
    expect(document.documentElement.dataset.switchesPicks).toBe(
      "hero:a,pricing:simple",
    );
    history.replaceState(null, "", "/?switches=hero:b");
    run();
    expect(document.documentElement.dataset.switchesPicks).toBe(
      "hero:b,pricing:simple",
    );
  });

  it("does not throw and sets nothing when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(run).not.toThrow();
    expect(document.documentElement.dataset.switchesPicks).toBeUndefined();
  });

  it("does not throw when the localStorage accessor itself throws", () => {
    const desc = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError");
      },
    });
    try {
      history.replaceState(null, "", "/?switches=hero:b");
      expect(run).not.toThrow();
      expect(document.documentElement.dataset.switchesPicks).toBe("hero:b");
    } finally {
      Object.defineProperty(window, "localStorage", desc);
    }
  });

  it("ignores corrupt storage and malformed URL parts", () => {
    localStorage.setItem("switches:v1", "{not json");
    history.replaceState(null, "", "/?switches=,:x,hero,%E0%A4%A:y,ok:1");
    expect(run).not.toThrow();
    expect(document.documentElement.dataset.switchesPicks).toBe("ok:1");
  });

  it("parses the URL the same way as parseUrlPicks", () => {
    const searches = [
      "?switches=hero:phone,pricing:simple",
      "?switches=a%2Cb:x%3Ay,hero:b",
      "?switches=hero:a,hero:b",
      "?switches=:x,y:,z",
      "?other=1",
    ];
    for (const s of searches) {
      localStorage.clear();
      delete document.documentElement.dataset.switchesPicks;
      history.replaceState(null, "", "/" + s);
      run();
      const expected = Object.entries(parseUrlPicks(s))
        .map(([n, o]) => pickToken(n, o))
        .join(",");
      expect(document.documentElement.dataset.switchesPicks ?? "").toBe(expected);
    }
  });

  it("accepts the same stored pick shapes as the store", () => {
    const stored = {
      plain: { option: "a", path: "/" },
      noted: { option: "b", path: "/", note: "n" },
      seen: { option: "c", path: "/", seen: true },
      seenFalse: { option: "d", path: "/", seen: false },
      badSeen: { option: "e", path: "/", seen: "yes" },
      badNote: { option: "f", path: "/", note: 3 },
      noPath: { option: "g" },
    };
    localStorage.setItem("switches:v1", JSON.stringify(stored));
    run();
    const expected = Object.entries(createStore({ storage: localStorage, search: "" }).get())
      .map(([n, p]) => pickToken(n, p.option))
      .join(",");
    expect(expected).toBe("plain:a,noted:b,seen:c,seenFalse:d");
    expect(document.documentElement.dataset.switchesPicks).toBe(expected);
  });

  it("does not let a __proto__ key pollute anything", () => {
    localStorage.setItem(
      "switches:v1",
      '{"__proto__":{"option":"x","path":"/"},"hero":{"option":"a","path":"/"}}',
    );
    expect(run).not.toThrow();
    expect(({} as Record<string, unknown>).option).toBeUndefined();
    expect(document.documentElement.dataset.switchesPicks).toContain("hero:a");
  });
});
