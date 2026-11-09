import Link from "next/link";
import type { ReactNode } from "react";
import "./demo.css";

// Fernpost is a made-up product: the sample site the Switches demo runs on.
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fp">
      <div className="fp-banner">
        Sample site for the Switches demo. Open the round button at the bottom left to flip sections.
      </div>
      <header className="fp-nav">
        <Link href="/demo" className="fp-logo">
          <span className="fp-logo-mark" aria-hidden />
          Fernpost
        </Link>
        <nav className="fp-links">
          <Link href="/demo#pricing">Pricing</Link>
          <Link href="/demo/more">Customers</Link>
          <Link href="/demo#pricing" className="fp-btn fp-btn-sm">
            Start free
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
