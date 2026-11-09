"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createStore, buildShareUrl, emptyMap, type Picks } from "../core/store";
import { formatPicks } from "../core/format";
import { observeSections, type Section } from "../core/discover";
import { pickToken } from "../script";

export type PanelApi = {
  sections: Section[];
  picks: Picks;
  chosen(name: string): string;
  choose(name: string, option: string): void;
  note(name: string): string;
  setNote(name: string, note: string): void;
  copyText(): string;
  apply(): void;
};

const hasOption = (s: Section | undefined, option: string) =>
  !!s && s.options.some((o) => o.option === option);

/**
 * Passthrough picks for the attribute and URL: drop only stale ones (section
 * mounted but the picked option is gone). Picks for sections that have not
 * mounted yet stay, matching what pickScript wrote before first paint.
 */
function livePicks(picks: Picks, byName: Map<string, Section>): Picks {
  const out: Picks = emptyMap();
  for (const [name, p] of Object.entries(picks)) {
    const s = byName.get(name);
    if (!s || hasOption(s, p.option)) out[name] = p;
  }
  return out;
}

function pickAttr(picks: Picks): string {
  return Object.entries(picks)
    .map(([name, p]) => pickToken(name, p.option))
    .join(",");
}

const herePath = () => (typeof location !== "undefined" ? location.pathname : "/");

/**
 * For the copied prompt: this page's picks must be mounted and valid; picks
 * from other pages only once their section was actually seen. A pick that only
 * arrived through a link (possibly crafted) is applied but never copied.
 */
function copyPicks(picks: Picks, byName: Map<string, Section>): Picks {
  const path = herePath();
  const out: Picks = emptyMap();
  for (const [name, p] of Object.entries(picks)) {
    if (p.path === path ? hasOption(byName.get(name), p.option) : p.seen) out[name] = p;
  }
  return out;
}

/**
 * Picks to forget once the page has settled: recorded on this page, seen
 * before, and their section IS mounted but the picked option is no longer in
 * it (a round was applied and the losing versions deleted). A pick is never
 * forgotten because its section is absent: it may mount later (Suspense,
 * lazy routes, tabs, dialogs, data fetched on the client).
 */
function gonePicks(picks: Picks, byName: Map<string, Section>): string[] {
  const path = herePath();
  return Object.entries(picks)
    .filter(([name, p]) => {
      const s = byName.get(name);
      return p.path === path && p.seen && !!s && !hasOption(s, p.option);
    })
    .map(([name]) => name);
}

export function usePanel(): PanelApi {
  const store = useMemo(() => createStore(), []);
  const [sections, setSections] = useState<Section[]>([]);
  const [picks, setPicks] = useState<Picks>({});

  const byName = useMemo(() => new Map(sections.map((s) => [s.name, s])), [sections]);

  useEffect(() => {
    setPicks(store.get());
    const off = store.subscribe(() => setPicks(store.get()));
    // This visit: every section mounted at any point, and the pages it was on.
    const mounted = new Set<string>();
    const visited = new Set<string>([herePath()]);
    let forgotten: string[] = [];
    // Visit end: a seen pick of a page visited now whose section never mounted
    // (e.g. its Variant was unwrapped when a round was applied) is forgotten
    // from storage. Memory, the attribute and the URL stay for this document.
    const forget = () => {
      const names = Object.entries(store.get())
        .filter(([name, p]) => p.seen && visited.has(p.path) && !mounted.has(name))
        .map(([name]) => name);
      store.forgetStored(names);
      forgotten = names;
    };
    // Back on the page (tab visible again, or restored from the bfcache): the
    // visit goes on, so put the forgotten picks back.
    const restore = () => {
      if (forgotten.length) store.restoreStored(forgotten);
      forgotten = [];
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? forget() : restore());
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) restore();
    };
    addEventListener("pagehide", forget);
    addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisibility);
    let settled = false;
    const stop = observeSections(document, (found) => {
      visited.add(herePath());
      for (const s of found) mounted.add(s.name);
      if (!settled) {
        // First pass after load: forget picks whose option was deleted from a
        // mounted section. Sections not here yet keep their picks.
        settled = true;
        store.removePicks(gonePicks(store.get(), new Map(found.map((s) => [s.name, s]))));
      }
      setSections(found);
    });
    return () => {
      off();
      stop();
      removeEventListener("pagehide", forget);
      removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [store]);

  // Picks whose section (with that option) is on this page have been seen.
  useEffect(() => {
    const names = Object.entries(picks)
      .filter(([name, p]) => !p.seen && hasOption(byName.get(name), p.option))
      .map(([name]) => name);
    if (names.length) store.markSeen(names);
  }, [store, picks, byName]);

  const chosen = useCallback(
    (name: string) => {
      const s = byName.get(name);
      if (!s) return "";
      const p = picks[name];
      return p && hasOption(s, p.option) ? p.option : s.defaultOption;
    },
    [byName, picks],
  );

  const copyText = useCallback(
    () =>
      formatPicks(
        copyPicks(picks, byName),
        typeof location !== "undefined" ? location.href : "http://localhost/",
      ),
    [picks, byName],
  );

  const sync = useCallback((all: Picks, map: Map<string, Section>) => {
    const live = livePicks(all, map);
    const attr = pickAttr(live);
    const el = document.documentElement;
    if (attr) el.setAttribute("data-switches-picks", attr);
    else el.removeAttribute("data-switches-picks");
    try {
      history.replaceState(history.state, "", buildShareUrl(location.href, live));
    } catch {
      // history unavailable: the attribute is still applied
    }
  }, []);

  const apply = useCallback(() => sync(picks, byName), [sync, picks, byName]);

  // Late-mounting sections or removed options: keep the attribute in step.
  useEffect(() => {
    if (sections.length) sync(picks, byName);
  }, [sections, picks, byName, sync]);

  const choose = useCallback(
    (name: string, option: string) => {
      store.setPick(name, option);
      sync(store.get(), byName);
    },
    [store, byName, sync],
  );

  const note = useCallback((name: string) => picks[name]?.note ?? "", [picks]);
  const setNote = useCallback((name: string, n: string) => store.setNote(name, n), [store]);
  return { sections, picks, chosen, choose, note, setNote, copyText, apply };
}

