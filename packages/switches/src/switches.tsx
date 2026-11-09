import { Panel } from "./panel/Panel";
import { pickScript } from "./script";
import { nodeEnv, switchesOff } from "./env";

// Server component: no hooks, no "use client". Place as the first child of
// <body> so the blocking script applies saved picks before first paint.

let warned = false;

export function Switches() {
  if (switchesOff()) return null;
  // Without NODE_ENV (e.g. a browser bundle that does not define it) the
  // warning is skipped silently.
  if (nodeEnv() === "production" && !warned) {
    warned = true;
    console.warn(
      '[switches] Switches is still installed in this production build. Remove it before launch: ask Claude to "finish" Switches.',
    );
  }
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: pickScript }} />
      <Panel />
    </>
  );
}
