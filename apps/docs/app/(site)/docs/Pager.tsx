import Link from "next/link";
import { PAGES } from "../nav";

/** Previous / next links at the foot of a docs page. */
export function Pager({ current }: { current: string }) {
  const i = PAGES.findIndex((p) => p.href === current);
  const prev = PAGES[i - 1];
  const next = PAGES[i + 1];
  return (
    <nav className="s-pager" aria-label="Previous and next page">
      {prev ? (
        <Link href={prev.href} rel="prev">
          <span>Previous</span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} rel="next" className="s-pager-next">
          <span>Next</span>
          {next.title}
        </Link>
      )}
    </nav>
  );
}
