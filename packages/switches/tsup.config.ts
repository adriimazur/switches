import { chmodSync } from "node:fs";
import { defineConfig, type Options } from "tsup";

// Next.js App Router needs "use client" at the top of the module that holds
// the Panel. esbuild keeps a directive only on an entry file, so Panel is its
// own entry (dist/panel.*) and the main bundle imports it as an external.
const base: Options = {
  entry: { index: "src/index.ts", panel: "src/panel/Panel.tsx" },
  dts: { entry: { index: "src/index.ts" } },
  sourcemap: true,
  external: ["react", "react-dom"],
};

const panelExternal = (ext: string) => ({
  name: "panel-external",
  setup(build: { onResolve: Function }) {
    build.onResolve({ filter: /(^|\/)panel\/Panel$/ }, () => ({
      path: `./panel.${ext}`,
      external: true,
    }));
  },
});

// The configs below build concurrently, so none of them sets `clean` (one
// could wipe another's output); the build script empties dist/ first.
export default defineConfig([
  {
    ...base,
    format: ["esm"],
    esbuildPlugins: [panelExternal("js")],
  },
  {
    ...base,
    format: ["cjs"],
    dts: false,
    esbuildPlugins: [panelExternal("cjs")],
  },
  {
    // `npx switches init|uninit`: Node-only, no React, executable.
    entry: { cli: "src/cli/bin.ts" },
    format: ["esm"],
    platform: "node",
    target: "node18",
    banner: { js: "#!/usr/bin/env node" },
    onSuccess: async () => chmodSync("dist/cli.js", 0o755),
  },
]);
