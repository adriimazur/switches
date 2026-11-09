import { describe, it, expect, vi } from "vitest";
import {
  parseUrlPicks,
  serializeUrlPicks,
  buildShareUrl,
  createStore,
} from "../src/core/store";

function memStorage(initial: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(initial));
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

describe("url picks", () => {
  it("parses switches param", () => {
    expect(parseUrlPicks("?switches=hero:phone,pricing:simple")).toEqual({
      hero: "phone",
      pricing: "simple",
    });
  });
  it("returns {} for empty and malformed input", () => {
    expect(parseUrlPicks("")).toEqual({});
    expect(parseUrlPicks("?switches=hero")).toEqual({});
    expect(parseUrlPicks("?switches=:x")).toEqual({});
  });
  it("round-trips encoded parts", () => {
    const s = serializeUrlPicks({ "a b": "c,d:e" });
    expect(parseUrlPicks("?switches=" + encodeURIComponent(s))).toEqual({ "a b": "c,d:e" });
  });
});

describe("buildShareUrl", () => {
  it("sets only the switches param", () => {
    const url = new URL(
      buildShareUrl("https://a.com/p?x=1", { hero: { option: "phone", path: "/" } }),
    );
    expect(url.searchParams.get("x")).toBe("1");
    expect(parseUrlPicks(url.search)).toEqual({ hero: "phone" });
  });
  it("removes switches when picks are empty", () => {
    const url = new URL(buildShareUrl("https://a.com/p?x=1&switches=hero%3Aphone", {}));
    expect(url.searchParams.has("switches")).toBe(false);
    expect(url.searchParams.get("x")).toBe("1");
  });
});

describe("createStore", () => {
  it("URL picks override stored picks", () => {
    const storage = memStorage({
      "switches:v1": JSON.stringify({
        hero: { option: "old", path: "/" },
        other: { option: "keep", path: "/" },
      }),
    });
    const store = createStore({ storage, search: "?switches=hero:phone", path: "/p" });
    expect(store.get().hero).toEqual({ option: "phone", path: "/p" });
    expect(store.get().other?.option).toBe("keep");
  });
  it("setPick persists, records path and notifies once", () => {
    const storage = memStorage();
    const store = createStore({ storage, path: "/home" });
    const fn = vi.fn();
    store.subscribe(fn);
    store.setPick("hero", "phone");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.get().hero).toEqual({ option: "phone", path: "/home" });
    expect(JSON.parse(storage.getItem("switches:v1")!).hero.option).toBe("phone");
  });
  it("setPick records the current path after client-side navigation", () => {
    history.pushState(null, "", "/first");
    const store = createStore({ storage: null, search: "" });
    history.pushState(null, "", "/second");
    store.setPick("testimonials", "wall");
    expect(store.get().testimonials).toEqual({ option: "wall", path: "/second" });
    history.pushState(null, "", "/");
  });
  it("unsubscribe stops notifications", () => {
    const store = createStore({ storage: null });
    const fn = vi.fn();
    const off = store.subscribe(fn);
    off();
    store.setPick("a", "b");
    expect(fn).not.toHaveBeenCalled();
  });
  it("setNote keeps the option", () => {
    const store = createStore({ storage: memStorage() });
    store.setPick("hero", "phone");
    store.setNote("hero", "bigger");
    expect(store.get().hero?.option).toBe("phone");
    expect(store.get().hero?.note).toBe("bigger");
  });
  it("clearPick removes the pick", () => {
    const store = createStore({ storage: memStorage() });
    store.setPick("hero", "phone");
    store.clearPick("hero");
    expect(store.get()).toEqual({});
  });
  it("garbage JSON in storage yields {}", () => {
    expect(createStore({ storage: memStorage({ "switches:v1": "{nope" }) }).get()).toEqual({});
    expect(createStore({ storage: memStorage({ "switches:v1": "[1,2]" }) }).get()).toEqual({});
    expect(
      createStore({ storage: memStorage({ "switches:v1": '{"a":{"option":3}}' }) }).get(),
    ).toEqual({});
  });
  it("throwing storage degrades to memory", () => {
    const bad = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    const store = createStore({ storage: bad });
    store.setPick("hero", "phone");
    expect(store.get().hero?.option).toBe("phone");
  });
  it("null storage works in memory", () => {
    const store = createStore({ storage: null });
    store.setPick("hero", "phone");
    expect(store.get().hero?.option).toBe("phone");
  });
});

describe("seen flag", () => {
  it("accepts stored picks with or without seen, rejects a non-boolean seen", () => {
    const storage = memStorage({
      "switches:v1": JSON.stringify({
        a: { option: "x", path: "/" },
        b: { option: "y", path: "/", seen: true },
        c: { option: "z", path: "/", seen: "yes" },
      }),
    });
    const p = createStore({ storage, search: "" }).get();
    expect(Object.keys(p)).toEqual(["a", "b"]);
    expect(p.b?.seen).toBe(true);
  });
  it("markSeen sets seen and the current path once; a URL pick is never seen on arrival", () => {
    const storage = memStorage({
      "switches:v1": JSON.stringify({ hero: { option: "a", path: "/old", seen: true, note: "n" } }),
    });
    const store = createStore({ storage, search: "?switches=hero:b,cta:y", path: "/landing" });
    expect(store.get().hero).toEqual({ option: "b", path: "/landing", note: "n" });
    expect(store.get().cta).toEqual({ option: "y", path: "/landing" });
    const fn = vi.fn();
    store.subscribe(fn);
    store.markSeen(["cta"]);
    expect(store.get().cta).toEqual({ option: "y", path: "/landing", seen: true });
    store.markSeen(["cta"]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.getItem("switches:v1")!).cta.seen).toBe(true);
  });
  it("a link repeating a stored pick keeps it as stored (seen and path)", () => {
    const storage = memStorage({
      "switches:v1": JSON.stringify({ hero: { option: "a", path: "/home", seen: true } }),
    });
    const store = createStore({ storage, search: "?switches=hero:a", path: "/x" });
    expect(store.get().hero).toEqual({ option: "a", path: "/home", seen: true });
  });
  it("setPick starts a new pick unseen", () => {
    const store = createStore({ storage: null, search: "", path: "/" });
    store.setPick("hero", "a");
    store.markSeen(["hero"]);
    store.setPick("hero", "b");
    expect(store.get().hero?.seen).toBeUndefined();
  });
  it("removePicks drops several picks in one commit", () => {
    const store = createStore({ storage: null, search: "", path: "/" });
    store.setPick("a", "1");
    store.setPick("b", "2");
    store.setPick("c", "3");
    const fn = vi.fn();
    store.subscribe(fn);
    store.removePicks(["a", "c", "missing"]);
    expect(Object.keys(store.get())).toEqual(["b"]);
    expect(fn).toHaveBeenCalledTimes(1);
    store.removePicks(["missing"]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("forgetStored drops picks from storage only; restoreStored puts them back", () => {
    const storage = memStorage();
    const store = createStore({ storage, search: "", path: "/" });
    store.setPick("a", "1");
    store.setPick("b", "2");
    const fn = vi.fn();
    store.subscribe(fn);
    store.forgetStored(["a", "missing"]);
    expect(Object.keys(JSON.parse(storage.getItem("switches:v1")!))).toEqual(["b"]);
    expect(Object.keys(store.get())).toEqual(["a", "b"]);
    store.forgetStored(["a"]); // idempotent
    expect(Object.keys(JSON.parse(storage.getItem("switches:v1")!))).toEqual(["b"]);
    // Another tab wrote meanwhile: restoring keeps its picks.
    storage.setItem("switches:v1", JSON.stringify({ c: { option: "3", path: "/x" } }));
    store.restoreStored(["a", "missing"]);
    expect(JSON.parse(storage.getItem("switches:v1")!)).toEqual({
      c: { option: "3", path: "/x" },
      a: { option: "1", path: "/" },
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it("forgetStored and restoreStored are safe without storage or with throwing storage", () => {
    const bad = memStorage();
    bad.setItem = () => {
      throw new Error("blocked");
    };
    for (const storage of [null, bad]) {
      const store = createStore({ storage, search: "", path: "/" });
      store.setPick("a", "1");
      expect(() => store.forgetStored(["a"])).not.toThrow();
      expect(() => store.restoreStored(["a"])).not.toThrow();
      expect(Object.keys(store.get())).toEqual(["a"]);
    }
  });
});

describe("prototype-named sections", () => {
  it("__proto__, constructor and prototype behave like any other name", () => {
    const storage = memStorage({
      "switches:v1": '{"__proto__":{"option":"x","path":"/"}}',
    });
    const store = createStore({ storage, search: "?switches=constructor:y", path: "/" });
    expect(Object.keys(store.get()).sort()).toEqual(["__proto__", "constructor"]);
    expect(store.get()["prototype"]).toBeUndefined();
    store.setPick("prototype", "z");
    store.setNote("constructor", "hi");
    expect(store.get()["constructor"]).toEqual({ option: "y", path: "/", note: "hi" });
    expect(store.get()["prototype"]?.option).toBe("z");
    const saved = JSON.parse(storage.getItem("switches:v1")!);
    expect(Object.getOwnPropertyDescriptor(saved, "__proto__")?.value).toEqual({ option: "x", path: "/" });
    store.clearPick("__proto__");
    expect(Object.keys(store.get()).sort()).toEqual(["constructor", "prototype"]);
    expect(parseUrlPicks("?switches=__proto__:a,constructor:b")).toEqual(
      Object.assign(Object.create(null), { ["__proto__"]: "a", constructor: "b" }),
    );
    expect(({} as Record<string, unknown>).option).toBeUndefined();
  });
  it("an empty store has no inherited picks", () => {
    const store = createStore({ storage: null, search: "", path: "/" });
    expect(store.get()["constructor"]).toBeUndefined();
    expect(store.get()["toString"]).toBeUndefined();
  });
});
