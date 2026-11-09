import { buildShareUrl, type Pick, type Picks } from "./store";

const MAX_NOTE = 280;

/**
 * Section names and options are identifiers, never prose: letters, digits,
 * `_`, space, `.`, `-`. Anything else (newlines, `$(…)`, quotes, backticks)
 * could only come from a crafted link or storage, so such picks are left out
 * of the copied text rather than escaped.
 */
const IDENT = /^[\w .-]{1,64}$/u;
// C0/C1 controls, Unicode format chars (bidi overrides, zero-width), line/paragraph separators.
const CONTROL = /[\p{Cc}\p{Cf}\u2028\u2029]/gu;

export function sanitizeNote(note: string): string {
  const s = note.replace(CONTROL, " ").replace(/\s+/g, " ").trim();
  return s.length > MAX_NOTE ? s.slice(0, MAX_NOTE - 1) + "…" : s;
}

/**
 * A page path is a hint about where a section lives, so only plain ASCII path
 * characters pass: letters, digits, `_ . ~ / -`, and `%` only as the escape of
 * a non-ASCII byte (`%C3%A9`, never `%20` or `%0A`); at most 200 in all.
 * Shell or prose characters (`$ ( ) | ; ' & = ?`, spaces) mean a crafted URL
 * or an unusual route (`/@user`): the pick is still printed, without its path.
 */
const PATH = /^\/(?:[\w.~\/-]|%[89A-Fa-f][0-9A-Fa-f]){0,199}$/;

function cleanPath(path: string): string | null {
  return PATH.test(path) ? path : null;
}

/**
 * The page URL for the Link line: origin and a clean path only. The hash,
 * other query parameters and credentials can carry prose, so they are dropped;
 * buildShareUrl then adds the `switches` parameter for the printed picks.
 */
function linkBase(href: string): string {
  const url = new URL(href);
  if (url.origin !== "null") return url.origin + (cleanPath(url.pathname) ?? "/");
  // Opaque origin (file:, about:srcdoc, sandboxed): keep the address as it is.
  url.hash = "";
  url.search = "";
  url.username = "";
  url.password = "";
  return url.toString();
}

/** A printable pick: the path is left out when it is not clean. */
type SafePick = Omit<Pick, "path" | "seen"> & { path: string | null };

/** The picks that are safe to print, with trimmed names and options. */
function safePicks(picks: Picks): Record<string, SafePick> {
  const out: Record<string, SafePick> = Object.create(null);
  for (const [rawName, p] of Object.entries(picks)) {
    const name = rawName.trim();
    const option = p.option.trim();
    if (!IDENT.test(name) || !IDENT.test(option)) continue;
    const pick: SafePick = { option, path: cleanPath(p.path) };
    if (p.note) pick.note = p.note;
    out[name] = pick;
  }
  return out;
}

function linkPicks(picks: Record<string, SafePick>): Picks {
  const out: Picks = Object.create(null);
  for (const [name, p] of Object.entries(picks)) out[name] = { option: p.option, path: p.path ?? "/" };
  return out;
}

export function formatPicks(all: Picks, href: string): string {
  const picks = safePicks(all);
  const entries = Object.entries(picks);
  if (entries.length === 0) return "No picks yet.";
  const summary = entries.map(([name, p]) => `${name}: ${p.option}`).join(" · ");
  const lines = entries.map(([name, p]) => {
    const note = p.note ? sanitizeNote(p.note) : "";
    const where = p.path === null ? "" : ` (${p.path})`;
    return `${name}: ${p.option}${where}${note ? ` — note: ${note}` : ""}`;
  });
  return [
    `Switches picks: ${summary}`,
    ...lines,
    `Link: ${buildShareUrl(linkBase(href), linkPicks(picks))}`,
    "Apply these picks: keep the chosen version of each section and delete the others.",
  ].join("\n");
}
