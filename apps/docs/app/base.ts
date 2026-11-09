// The site's basePath ("" in dev, "/switches" in production), set from
// DOCS_BASE_PATH in next.config.ts. next/link and next/image add it on their
// own; plain <a href> and media `src` values must go through withBase().
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * A site-relative path ("/docs", "/?switches=layout:photo") under the basePath.
 * "/" maps to the basePath itself ("/switches", not "/switches/", which
 * would redirect). Absolute URLs, "//host" and "#hash" are returned unchanged.
 */
export function withBase(path: string): string {
  if (!BASE_PATH || !path.startsWith("/") || path.startsWith("//")) return path;
  if (path === "/" || path.startsWith("/?") || path.startsWith("/#")) return BASE_PATH + path.slice(1);
  return BASE_PATH + path;
}
