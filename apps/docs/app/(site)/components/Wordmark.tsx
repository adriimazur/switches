import Link from "next/link";
import { PRODUCT_NAME } from "../../site";

/**
 * The wordmark: a small switch (a pill track with its knob on) and the
 * product name set in the site font. The same glyph is the favicon
 * (app/icon.svg). Rename the product in app/site.ts.
 */
export function Wordmark() {
  return (
    <Link href="/" className="s-wordmark" aria-label={`${PRODUCT_NAME} overview`}>
      {/* The same geometry as the favicon (app/icon.svg). */}
      <svg className="s-mark" viewBox="0 0 32 32" aria-hidden focusable="false">
        <rect className="s-mark-track" x="1" y="6" width="30" height="20" rx="10" fill="var(--s-green)" />
        <circle className="s-mark-knob" cx="21" cy="16" r="7" fill="#ffffff" />
      </svg>
      <span>{PRODUCT_NAME}</span>
    </Link>
  );
}
