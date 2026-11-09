import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// DOCS_BASE_PATH serves the whole site under a sub-path. Production sets it to
// "/switches" (the site lives at https://mazur.design/switches); dev and the
// root-mode e2e run leave it unset.
const basePath = process.env.DOCS_BASE_PATH || "";

const config: NextConfig = {
  // NEXT_DIST_DIR lets the e2e run keep other builds (NEXT_PUBLIC_SWITCHES=off,
  // the /switches sub-path) next to the normal one.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // next/link, next/image, the router and Next's own assets add it themselves.
  basePath,
  // For plain <a href> and media URLs: see withBase() in app/base.ts.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // The monorepo root (a stray lockfile higher up would otherwise be picked).
  outputFileTracingRoot: root,
};

export default config;
