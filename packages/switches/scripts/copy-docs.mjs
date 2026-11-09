// Runs from `prepack`. The repo root holds the one README and LICENSE; npm
// shows the package folder's README, so copy both in just before packing.
// The copies are git-ignored, so they cannot drift.
import { copyFileSync } from "node:fs";

for (const f of ["README.md", "LICENSE"]) {
  copyFileSync(new URL(`../../../${f}`, import.meta.url), new URL(`../${f}`, import.meta.url));
}
