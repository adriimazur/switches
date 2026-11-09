// Environment reads, safe where `process` does not exist (a browser bundle
// from Vite or another bundler that does not define it): a ReferenceError
// means "unset". Each read is written as the literal `process.env.X` so
// Next.js (and any bundler that defines these) inlines the value at build time.

// Typed locally so the package does not depend on @types/node.
declare const process: { env: Record<string, string | undefined> };

/** `NEXT_PUBLIC_SWITCHES`, or undefined when unavailable. */
export function switchesFlag(): string | undefined {
  try {
    return process.env.NEXT_PUBLIC_SWITCHES;
  } catch {
    return undefined;
  }
}

/** `NODE_ENV`, or undefined when unavailable. */
export function nodeEnv(): string | undefined {
  try {
    return process.env.NODE_ENV;
  } catch {
    return undefined;
  }
}

/** True when the NEXT_PUBLIC_SWITCHES=off emergency switch is set. */
export function switchesOff(): boolean {
  return switchesFlag() === "off";
}
