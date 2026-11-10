/**
 * Panel styles: plain CSS ported from an earlier Tailwind version of this
 * panel (Tailwind v4 values, as compiled). Every selector starts with
 * `.sw-`, so nothing here reaches the host page.
 *
 * Colours: set any of --sw-bg, --sw-ink, --sw-muted, --sw-line,
 * --sw-line-strong, --sw-accent, --sw-font on an ancestor (e.g. :root) to
 * theme the panel. Defaults are a warm light palette, and a dark one under
 * prefers-color-scheme: dark.
 */
export const css = `
.sw-root {
  all: initial;
  --sw-c-bg: var(--sw-bg, #f6f5f1);
  --sw-c-ink: var(--sw-ink, #0f0f0e);
  --sw-c-muted: var(--sw-muted, #5f5e5a);
  --sw-c-line: var(--sw-line, #e2e0da);
  --sw-c-line-strong: var(--sw-line-strong, #c9c6be);
  --sw-c-accent: var(--sw-accent, #ff4b14);
  display: block;
  position: fixed;
  bottom: 76px;
  left: 20px;
  z-index: 90;
  box-sizing: border-box;
  font-family: var(--sw-font, Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: -0.01em;
  color: var(--sw-c-ink);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  tab-size: 4;
}
@media (prefers-color-scheme: dark) {
  .sw-root {
    --sw-c-bg: var(--sw-bg, #1a1a1a);
    --sw-c-ink: var(--sw-ink, #f2f1ee);
    --sw-c-muted: var(--sw-muted, #908f8a);
    --sw-c-line: var(--sw-line, #282826);
    --sw-c-line-strong: var(--sw-line-strong, #3c3c39);
  }
}

/* Reset: undo host author styles on everything inside (SVG excluded, whose
   geometry lives in presentation attributes), then a Tailwind-preflight base. */
.sw-root :where(*:not(svg, svg *)),
.sw-root :where(*:not(svg, svg *))::before,
.sw-root :where(*:not(svg, svg *))::after {
  all: revert;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0 solid;
}
.sw-root :where(button, input, textarea) {
  font: inherit;
  font-feature-settings: inherit;
  font-variation-settings: inherit;
  letter-spacing: inherit;
  color: inherit;
  border-radius: 0;
  background-color: transparent;
  opacity: 1;
  outline-offset: 2px;
}
.sw-root :where(ul) {
  list-style: none;
}

/* The settings sheet. */
.sw-sheet {
  position: absolute;
  bottom: 52px;
  left: 0;
  width: 268px;
  transform-origin: 0 100%;
  border-radius: 18px;
  border: 1px solid var(--sw-c-line);
  background-color: color-mix(in srgb, var(--sw-c-bg) 90%, transparent);
  padding: 8px;
  color: var(--sw-c-ink);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
  /* As in the original: transitions opacity and transform, while the scale
     itself uses the scale property (Tailwind v4), so only opacity eases.
     visibility flips at the end of the fade-out, taking the closed sheet out
     of the tab order and the accessibility tree. */
  transition-property: opacity, transform, visibility;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
  scale: 1 1;
  opacity: 1;
  visibility: visible;
}
.sw-sheet[aria-hidden="true"] {
  pointer-events: none;
  visibility: hidden;
  scale: 0.95 0.95;
  opacity: 0;
}
.sw-title {
  display: block;
  padding: 6px 12px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--sw-c-muted);
}
.sw-group {
  display: block;
  overflow: hidden;
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--sw-c-ink) 5%, transparent);
}
.sw-group + .sw-group {
  margin-top: 8px;
}
.sw-item {
  display: block;
  padding: 10px 12px;
}
.sw-item + .sw-item {
  border-top: 1px solid var(--sw-c-line);
}
.sw-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sw-label {
  display: inline;
  font-size: 14px;
  letter-spacing: -0.01em;
}

/* iOS-style switch. */
.sw-switch {
  display: block;
  position: relative;
  height: 26px;
  width: 44px;
  flex-shrink: 0;
  border-radius: 9999px;
  background-color: color-mix(in srgb, var(--sw-c-ink) 16%, transparent);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.sw-switch[aria-checked="true"] {
  background-color: var(--sw-c-accent);
}
.sw-knob {
  display: block;
  position: absolute;
  left: 2px;
  top: 2px;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition-property: transform, translate, scale, rotate;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.3, 1.4, 0.6, 1);
}
.sw-switch[aria-checked="true"] .sw-knob {
  translate: 18px 0;
}

/* iOS-style segmented control. */
.sw-segments {
  display: grid;
  margin-top: 8px;
  border-radius: 9px;
  background-color: color-mix(in srgb, var(--sw-c-ink) 8%, transparent);
  padding: 2px;
}
.sw-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  text-align: center;
  border-radius: 7px;
  padding: 4px 0;
  font-size: 12.5px;
  color: var(--sw-c-muted);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
@media (hover: hover) {
  .sw-segment:hover {
    color: var(--sw-c-ink);
  }
}
.sw-segment[aria-checked="true"] {
  background-color: var(--sw-c-bg);
  color: var(--sw-c-ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* Per-section note (new; sized to sit quietly under each row). */
.sw-note-link {
  display: inline-block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--sw-c-muted);
  transition-property: color;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
@media (hover: hover) {
  .sw-note-link:hover {
    color: var(--sw-c-ink);
  }
}
.sw-note {
  display: block;
  width: 100%;
  margin-top: 8px;
  border-radius: 7px;
  padding: 4px 8px;
  font-size: 12.5px;
  background-color: color-mix(in srgb, var(--sw-c-ink) 8%, transparent);
  color: var(--sw-c-ink);
  outline: none;
}
.sw-note::placeholder {
  color: var(--sw-c-muted);
  opacity: 1;
}
.sw-note:focus {
  box-shadow: 0 0 0 1px var(--sw-c-line-strong);
}

/* Copy button: in the slot (and style) of the original "Edit hub animation" link. */
.sw-copy {
  display: flex;
  width: 100%;
  margin-top: 8px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background-color: var(--sw-c-ink);
  color: var(--sw-c-bg);
  padding: 10px 12px;
  font-size: 14px;
  letter-spacing: -0.01em;
  text-align: left;
}
@media (hover: hover) {
  .sw-copy:hover {
    background-color: color-mix(in srgb, var(--sw-c-ink) 82%, var(--sw-c-bg));
  }
}
.sw-copy-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
/* Option decorations: a colour dot or a preset icon beside the label. */
.sw-dot {
  display: block;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 9999px;
  box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.5);
}
.sw-opt-icon {
  display: block;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
/* Screen-reader-only live region for the "Copied" confirmation. */
.sw-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.sw-fallback {
  display: block;
  width: 100%;
  height: 120px;
  margin-top: 8px;
  resize: none;
  border-radius: 12px;
  padding: 8px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.45;
  letter-spacing: 0;
  background-color: color-mix(in srgb, var(--sw-c-ink) 5%, transparent);
  color: var(--sw-c-ink);
  outline: none;
}

/* The round button. */
.sw-button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  border: 1px solid var(--sw-c-line-strong);
  background-color: var(--sw-c-bg);
  color: var(--sw-c-ink);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
@media (hover: hover) {
  .sw-button:hover {
    background-color: color-mix(in srgb, var(--sw-c-ink) 6%, var(--sw-c-bg));
  }
}
.sw-button[aria-expanded="true"] {
  background-color: var(--sw-c-ink);
  color: var(--sw-c-bg);
}
.sw-icon {
  display: block;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  vertical-align: middle;
}
`;
