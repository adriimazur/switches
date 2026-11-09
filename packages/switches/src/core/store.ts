/**
 * `seen` is set once the pick's section (with that option) has actually been
 * observed on a page. A pick that only arrived through a link stays unseen: it
 * is applied, but never copied into the prompt text.
 */
export type Pick = { option: string; path: string; note?: string; seen?: true };
export type Picks = Record<string, Pick>;

export type PicksStore = {
  get(): Picks;
  setPick(name: string, option: string): void;
  setNote(name: string, note: string): void;
  clearPick(name: string): void;
  /** Drop several picks in one commit (no-op when none exist). */
  removePicks(names: string[]): void;
  /**
   * Remove picks from storage only (memory and listeners untouched), so the
   * next visit no longer has them. Other stored picks are kept as they are.
   */
  forgetStored(names: string[]): void;
  /** Put picks from memory back into storage (undoes forgetStored). */
  restoreStored(names: string[]): void;
  /** Mark picks as observed on the current page; the first time also records this path. */
  markSeen(names: string[]): void;
  subscribe(fn: () => void): () => void;
};

const STORAGE_KEY = "switches:v1";
const PARAM = "switches";

/**
 * Maps keyed by section name have no prototype, so names such as
 * `__proto__` or `constructor` are plain keys, never inherited members.
 */
export function emptyMap<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function copyMap<T>(m: Record<string, T>): Record<string, T> {
  return Object.assign(emptyMap<T>(), m);
}

function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}

export function parseUrlPicks(search: string): Record<string, string> {
  const out = emptyMap<string>();
  let raw: string | null;
  try {
    raw = new URLSearchParams(search).get(PARAM);
  } catch {
    return out;
  }
  if (!raw) return out;
  for (const part of raw.split(",")) {
    const i = part.indexOf(":");
    if (i <= 0) continue;
    const name = safeDecode(part.slice(0, i));
    const option = safeDecode(part.slice(i + 1));
    if (!name || !option) continue;
    out[name] = option;
  }
  return out;
}

export function serializeUrlPicks(p: Record<string, string>): string {
  return Object.entries(p)
    .map(([name, option]) => `${encodeURIComponent(name)}:${encodeURIComponent(option)}`)
    .join(",");
}

export function buildShareUrl(href: string, picks: Picks): string {
  const url = new URL(href);
  const flat = emptyMap<string>();
  for (const [name, pick] of Object.entries(picks)) flat[name] = pick.option;
  const value = serializeUrlPicks(flat);
  if (value) url.searchParams.set(PARAM, value);
  else url.searchParams.delete(PARAM);
  return url.toString();
}

function isPick(v: unknown): v is Pick {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.option === "string" &&
    typeof p.path === "string" &&
    (p.note === undefined || typeof p.note === "string") &&
    (p.seen === undefined || typeof p.seen === "boolean")
  );
}

function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function readStored(storage: Storage | null): Picks {
  const out: Picks = emptyMap();
  if (!storage) return out;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return out;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return out;
    for (const [k, v] of Object.entries(data)) {
      if (!isPick(v)) continue;
      const pick: Pick = { option: v.option, path: v.path };
      if (v.note !== undefined) pick.note = v.note;
      if (v.seen === true) pick.seen = true;
      out[k] = pick;
    }
    return out;
  } catch {
    return emptyMap();
  }
}

export function createStore(
  opts: { storage?: Storage | null; search?: string; path?: string } = {},
): PicksStore {
  const storage = opts.storage === undefined ? defaultStorage() : opts.storage;
  // Read per call: a client-side navigation changes the page without a new store.
  const currentPath = () =>
    opts.path ?? (typeof location !== "undefined" ? location.pathname : "/");
  const path = currentPath();
  const search =
    opts.search ?? (typeof location !== "undefined" ? location.search : "");

  let picks: Picks = readStored(storage);
  for (const [name, option] of Object.entries(parseUrlPicks(search))) {
    // The link repeats what is stored (e.g. a reload): nothing new.
    if (picks[name]?.option === option) continue;
    // Otherwise the link's pick is new and unseen, whatever was stored before.
    const pick: Pick = { option, path };
    const note = picks[name]?.note;
    if (note !== undefined) pick.note = note;
    picks[name] = pick;
  }

  const listeners = new Set<() => void>();

  function write(p: Picks) {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // storage blocked or full: keep going in memory
    }
  }

  function commit(next: Picks) {
    picks = next;
    write(picks);
    listeners.forEach((fn) => fn());
  }

  // Edit what is stored now (another tab may have written), not memory.
  function editStored(edit: (stored: Picks) => boolean) {
    if (!storage) return;
    const stored = readStored(storage);
    if (edit(stored)) write(stored);
  }

  return {
    get: () => picks,
    setPick(name, option) {
      const note = picks[name]?.note;
      const pick: Pick = { option, path: currentPath() };
      if (note !== undefined) pick.note = note;
      const next = copyMap(picks);
      next[name] = pick;
      commit(next);
    },
    setNote(name, note) {
      const cur = picks[name];
      if (!cur) return;
      const next = copyMap(picks);
      next[name] = { ...cur, note };
      commit(next);
    },
    clearPick(name) {
      this.removePicks([name]);
    },
    removePicks(names) {
      const next = copyMap(picks);
      let changed = false;
      for (const name of names) {
        if (!(name in next)) continue;
        delete next[name];
        changed = true;
      }
      if (changed) commit(next);
    },
    forgetStored(names) {
      editStored((stored) => {
        let changed = false;
        for (const name of names) {
          if (!(name in stored)) continue;
          delete stored[name];
          changed = true;
        }
        return changed;
      });
    },
    restoreStored(names) {
      editStored((stored) => {
        let changed = false;
        for (const name of names) {
          const cur = picks[name];
          if (!cur) continue;
          stored[name] = cur;
          changed = true;
        }
        return changed;
      });
    },
    markSeen(names) {
      const next = copyMap(picks);
      let changed = false;
      for (const name of names) {
        const cur = next[name];
        if (!cur || cur.seen) continue;
        next[name] = { ...cur, path: currentPath(), seen: true };
        changed = true;
      }
      if (changed) commit(next);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },
  };
}
