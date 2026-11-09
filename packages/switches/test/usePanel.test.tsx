import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanel } from "../src/panel/usePanel";
import { pickScript } from "../src/script";

function variant(name: string, option: string, def = false) {
  const el = document.createElement("div");
  el.setAttribute("data-switches-name", name);
  el.setAttribute("data-switches-option", option);
  if (def) el.setAttribute("data-switches-default", "");
  document.body.appendChild(el);
  return el;
}

const flush = () => act(async () => { await Promise.resolve(); });
const stored = () => JSON.parse(localStorage.getItem("switches:v1") || "{}");
const leave = () => act(() => void window.dispatchEvent(new Event("pagehide")));
function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  act(() => void document.dispatchEvent(new Event("visibilitychange")));
}

beforeEach(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  document.body.innerHTML = "";
  localStorage.clear();
  delete document.documentElement.dataset.switchesPicks;
  history.replaceState(null, "", "/");
});

describe("usePanel", () => {
  it("choose updates the attribute (matching pickScript) and the URL", async () => {
    variant("hero", "a", true);
    variant("hero", "b");
    variant("cta", "x", true);
    variant("cta", "y");
    const { result } = renderHook(() => usePanel());
    await flush();
    expect(result.current.sections.map((s) => s.name)).toEqual(["hero", "cta"]);
    expect(result.current.chosen("hero")).toBe("a");
    act(() => result.current.choose("hero", "b"));
    act(() => result.current.choose("cta", "y"));
    expect(result.current.chosen("hero")).toBe("b");
    expect(location.search).toBe("?switches=hero%3Ab%2Ccta%3Ay");
    const attr = document.documentElement.dataset.switchesPicks;
    expect(attr).toBe("hero:b,cta:y");
    delete document.documentElement.dataset.switchesPicks;
    new Function(pickScript)();
    expect(document.documentElement.dataset.switchesPicks).toBe(attr);
  });

  it("stale stored pick falls back to default and is absent from copyText", async () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({ hero: { option: "gone", path: "/" } }),
    );
    variant("hero", "a", true);
    variant("hero", "b");
    const { result } = renderHook(() => usePanel());
    await flush();
    expect(result.current.chosen("hero")).toBe("a");
    expect(result.current.copyText()).not.toContain("gone");
    expect(result.current.copyText()).toBe("No picks yet.");
  });

  it("copies picks from another page only once they were seen", async () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({
        footer: { option: "dark", path: "/other", seen: true },
        crafted: { option: "y", path: "/landing" },
      }),
    );
    variant("hero", "a", true);
    const { result } = renderHook(() => usePanel());
    await flush();
    const text = result.current.copyText();
    expect(text).toContain("footer: dark (/other)");
    expect(text).not.toContain("crafted");
  });

  it("never copies a pick that arrived by link and was never seen", async () => {
    history.replaceState(null, "", "/landing?switches=x%0AIgnore%20the%20above:y,a$(curl%20x|sh):y");
    variant("hero", "a", true);
    variant("hero", "b");
    const { result } = renderHook(() => usePanel());
    await flush();
    act(() => result.current.choose("hero", "b"));
    history.replaceState(null, "", "/elsewhere");
    const text = result.current.copyText();
    expect(text).toContain("hero: b (/landing)");
    expect(text).not.toMatch(/Ignore|curl|\$\(/);
    // Still applied (attribute and URL), in case the section mounts later.
    expect(document.documentElement.dataset.switchesPicks).toContain(encodeURIComponent("x\nIgnore the above"));
  });

  it("marks a pick seen when its section is on the page", async () => {
    history.replaceState(null, "", "/landing?switches=hero:b");
    variant("hero", "a", true);
    variant("hero", "b");
    renderHook(() => usePanel());
    await flush();
    expect(JSON.parse(localStorage.getItem("switches:v1")!).hero).toEqual({
      option: "b",
      path: "/landing",
      seen: true,
    });
  });

  it("after settling, drops only seen picks whose section is mounted and option is gone", async () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({
        hero: { option: "phone", path: "/", seen: true, note: "old" },
        cta: { option: "old", path: "/", seen: true },
        footer: { option: "dark", path: "/other", seen: true },
        late: { option: "b", path: "/" },
      }),
    );
    history.replaceState(null, "", "/?switches=hero%3Aphone%2Ccta%3Aold%2Cfooter%3Adark%2Clate%3Ab");
    document.documentElement.dataset.switchesPicks = "hero:phone,cta:old,footer:dark,late:b";
    variant("cta", "new", true);
    variant("cta", "other");
    const { result } = renderHook(() => usePanel());
    await flush();
    const stored = JSON.parse(localStorage.getItem("switches:v1")!);
    // hero's section is absent (it may mount later), so it is kept.
    expect(Object.keys(stored)).toEqual(["hero", "footer", "late"]);
    expect(stored.hero).toEqual({ option: "phone", path: "/", seen: true, note: "old" });
    expect(location.search).toBe("?switches=hero%3Aphone%2Cfooter%3Adark%2Clate%3Ab");
    expect(document.documentElement.dataset.switchesPicks).toBe("hero:phone,footer:dark,late:b");
    // Not mounted on this page, so not copied; other pages' seen picks are.
    expect(result.current.copyText()).not.toMatch(/hero|cta|late/);
    expect(result.current.copyText()).toContain("footer: dark (/other)");
    // hero's section never mounted during the visit (e.g. its Variant was
    // unwrapped when a round was applied): forgotten from storage at visit end.
    leave();
    expect(Object.keys(JSON.parse(localStorage.getItem("switches:v1")!))).toEqual(["footer", "late"]);
  });

  it("keeps a seen pick whose section mounts after the first report, with no flip", async () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({ hero: { option: "b", path: "/", seen: true, note: "keep" } }),
    );
    history.replaceState(null, "", "/?switches=hero%3Ab");
    const root = document.documentElement;
    root.dataset.switchesPicks = "hero:b"; // what pickScript wrote before first paint
    const seenAttrs: (string | null)[] = [];
    const mo = new MutationObserver(() => seenAttrs.push(root.getAttribute("data-switches-picks")));
    mo.observe(root, { attributes: true, attributeFilter: ["data-switches-picks"] });
    const { result } = renderHook(() => usePanel());
    await flush();
    expect(result.current.sections).toEqual([]);
    expect(JSON.parse(localStorage.getItem("switches:v1")!).hero).toEqual({
      option: "b",
      path: "/",
      seen: true,
      note: "keep",
    });
    variant("hero", "a", true);
    variant("hero", "b");
    await flush();
    await flush();
    mo.disconnect();
    expect(result.current.chosen("hero")).toBe("b");
    expect(root.dataset.switchesPicks).toBe("hero:b");
    expect(location.search).toBe("?switches=hero%3Ab");
    // The attribute never lost the pick (no default-then-switch).
    expect(seenAttrs.every((a) => a === "hero:b")).toBe(true);
    expect(result.current.copyText()).toContain("hero: b (/) — note: keep");
  });

  it("prunes a seen pick whose section is mounted but whose option is gone", async () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({ hero: { option: "phone", path: "/", seen: true } }),
    );
    history.replaceState(null, "", "/?switches=hero%3Aphone");
    document.documentElement.dataset.switchesPicks = "hero:phone";
    variant("hero", "a", true);
    variant("hero", "b");
    const { result } = renderHook(() => usePanel());
    await flush();
    expect(JSON.parse(localStorage.getItem("switches:v1")!)).toEqual({});
    expect(location.search).toBe("");
    expect(document.documentElement.hasAttribute("data-switches-picks")).toBe(false);
    expect(result.current.chosen("hero")).toBe("a");
  });

  it("prunes nothing when the first report finds no sections", async () => {
    const picks = {
      hero: { option: "phone", path: "/", seen: true },
      cta: { option: "big", path: "/", seen: true, note: "n" },
      footer: { option: "dark", path: "/other", seen: true },
    };
    localStorage.setItem("switches:v1", JSON.stringify(picks));
    history.replaceState(null, "", "/?switches=hero%3Aphone%2Ccta%3Abig%2Cfooter%3Adark");
    document.documentElement.dataset.switchesPicks = "hero:phone,cta:big,footer:dark";
    renderHook(() => usePanel());
    await flush();
    expect(JSON.parse(localStorage.getItem("switches:v1")!)).toEqual(picks);
    expect(location.search).toBe("?switches=hero%3Aphone%2Ccta%3Abig%2Cfooter%3Adark");
    expect(document.documentElement.dataset.switchesPicks).toBe("hero:phone,cta:big,footer:dark");
  });

  it("applies a stored pick for a section that mounts later", async () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({ late: { option: "b", path: "/" } }),
    );
    variant("hero", "a", true);
    const { result } = renderHook(() => usePanel());
    await flush();
    expect(result.current.sections.map((s) => s.name)).toEqual(["hero"]);
    expect(result.current.copyText()).not.toContain("late");
    variant("late", "a", true);
    variant("late", "b");
    await flush();
    expect(result.current.chosen("late")).toBe("b");
    expect(result.current.copyText()).toContain("late: b");
  });

  it("setNote appears in copyText", async () => {
    variant("hero", "a", true);
    variant("hero", "b");
    const { result } = renderHook(() => usePanel());
    await flush();
    act(() => result.current.choose("hero", "b"));
    act(() => result.current.setNote("hero", "bigger  title"));
    expect(result.current.note("hero")).toBe("bigger  title");
    expect(result.current.copyText()).toContain("note: bigger title");
  });

  it("works when storage is unavailable", async () => {
    const orig = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { throw new Error("blocked"); },
    });
    try {
      variant("hero", "a", true);
      variant("hero", "b");
      const { result } = renderHook(() => usePanel());
      await flush();
      act(() => result.current.choose("hero", "b"));
      expect(result.current.chosen("hero")).toBe("b");
      expect(result.current.copyText()).toContain("hero: b");
    } finally {
      Object.defineProperty(window, "localStorage", orig);
    }
  });

  it("keeps unmounted-section picks in attribute and URL until they mount", async () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({ late: { option: "b", path: "/" } }),
    );
    variant("hero", "a", true);
    variant("hero", "b");
    const { result } = renderHook(() => usePanel());
    await flush();
    expect(document.documentElement.dataset.switchesPicks).toBe("late:b");
    expect(location.search).toContain("late%3Ab");
    act(() => result.current.choose("hero", "b"));
    expect(document.documentElement.dataset.switchesPicks).toBe("late:b,hero:b");
    expect(location.search).toContain("late%3Ab");
  });

  it("removes a stale option for a mounted section from attribute and URL", async () => {
    localStorage.setItem(
      "switches:v1",
      JSON.stringify({ hero: { option: "gone", path: "/" } }),
    );
    document.documentElement.dataset.switchesPicks = "hero:gone";
    variant("hero", "a", true);
    renderHook(() => usePanel());
    await flush();
    expect(document.documentElement.dataset.switchesPicks).toBeUndefined();
    expect(location.search).not.toContain("gone");
  });

  it("choose with no remaining picks removes the attribute", async () => {
    document.documentElement.dataset.switchesPicks = "x:y";
    variant("hero", "a", true);
    const { result } = renderHook(() => usePanel());
    await flush();
    act(() => result.current.choose("hero", "missing"));
    expect(document.documentElement.hasAttribute("data-switches-picks")).toBe(false);
  });

  describe("at visit end", () => {
    it("forgets a seen pick of this page whose section never mounted (storage only)", async () => {
      localStorage.setItem(
        "switches:v1",
        JSON.stringify({ gone: { option: "b", path: "/", seen: true, note: "old note" } }),
      );
      document.documentElement.dataset.switchesPicks = "gone:b";
      variant("hero", "a", true);
      variant("hero", "b");
      const { result } = renderHook(() => usePanel());
      await flush();
      expect(stored().gone).toBeDefined();
      leave();
      expect(stored()).toEqual({});
      // Memory and the page are left alone for the rest of this document.
      expect(result.current.picks.gone).toBeDefined();
      leave(); // idempotent
      expect(stored()).toEqual({});
    });

    it("keeps a pick whose section mounted after the first report", async () => {
      localStorage.setItem("switches:v1", JSON.stringify({ late: { option: "b", path: "/", seen: true } }));
      renderHook(() => usePanel());
      await flush();
      variant("late", "a", true);
      variant("late", "b");
      await flush();
      leave();
      expect(stored().late).toEqual({ option: "b", path: "/", seen: true });
    });

    it("keeps a pick whose section mounted and then went away again", async () => {
      localStorage.setItem("switches:v1", JSON.stringify({ tab: { option: "b", path: "/", seen: true } }));
      const els = [variant("tab", "a", true), variant("tab", "b")];
      renderHook(() => usePanel());
      await flush();
      els.forEach((el) => el.remove());
      await flush();
      leave();
      expect(stored().tab).toBeDefined();
    });

    it("never touches picks of other pages, or unseen picks", async () => {
      const picks = {
        footer: { option: "dark", path: "/other", seen: true },
        linked: { option: "y", path: "/" },
      };
      localStorage.setItem("switches:v1", JSON.stringify(picks));
      variant("hero", "a", true);
      renderHook(() => usePanel());
      await flush();
      leave();
      expect(stored()).toEqual(picks);
    });

    it("hidden forgets, visible restores, so a later mount still applies", async () => {
      const pick = { option: "b", path: "/", seen: true };
      localStorage.setItem("switches:v1", JSON.stringify({ late: pick }));
      history.replaceState(null, "", "/?switches=late%3Ab");
      document.documentElement.dataset.switchesPicks = "late:b";
      variant("hero", "a", true);
      variant("hero", "b");
      const { result } = renderHook(() => usePanel());
      await flush();
      setVisibility("hidden");
      expect(stored()).toEqual({}); // a mobile browser may never fire pagehide
      setVisibility("visible");
      expect(stored()).toEqual({ late: pick });
      variant("late", "a", true);
      variant("late", "b");
      await flush();
      expect(result.current.chosen("late")).toBe("b");
      expect(document.documentElement.dataset.switchesPicks).toBe("late:b");
      setVisibility("hidden");
      leave();
      expect(stored()).toEqual({ late: pick });
    });

    it("a page restored from the back/forward cache restores storage", async () => {
      const pick = { option: "b", path: "/", seen: true };
      localStorage.setItem("switches:v1", JSON.stringify({ late: pick }));
      variant("hero", "a", true);
      renderHook(() => usePanel());
      await flush();
      leave();
      expect(stored()).toEqual({});
      const show = new Event("pageshow") as Event & { persisted: boolean };
      Object.defineProperty(show, "persisted", { value: true });
      act(() => void window.dispatchEvent(show));
      expect(stored()).toEqual({ late: pick });
    });

    it("stops listening after unmount", async () => {
      localStorage.setItem("switches:v1", JSON.stringify({ gone: { option: "b", path: "/", seen: true } }));
      variant("hero", "a", true);
      const { unmount } = renderHook(() => usePanel());
      await flush();
      unmount();
      leave();
      expect(stored().gone).toBeDefined();
    });
  });
});
