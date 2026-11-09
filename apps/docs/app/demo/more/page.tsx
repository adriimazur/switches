import type { Metadata } from "next";
import Link from "next/link";
import { Variant } from "switches-react";
import { Later } from "./Later";

export const metadata: Metadata = {
  title: "Fernpost customer stories (Switches demo)",
};

const quotes = [
  { text: "We cut our first-reply time from six hours to forty minutes in the first week.", who: "Ines Okafor", role: "Support lead, Northfold" },
  { text: "Nobody double-replies anymore. That alone paid for it.", who: "Tom Brandt", role: "Founder, Pebble&Co" },
  { text: "Setup took less time than our stand-up.", who: "Priya Raman", role: "Ops, Larchway" },
  { text: "The collision alerts are quietly brilliant.", who: "Leo Marsh", role: "CX, Brightloom" },
];

function TestimonialsQuote() {
  const q = quotes[0]!;
  return (
    <section className="fp-section fp-quote" data-testid="testimonials-quote">
      <blockquote>“{q.text}”</blockquote>
      <p>
        <b>{q.who}</b> · {q.role}
      </p>
    </section>
  );
}

function TestimonialsWall() {
  return (
    <section className="fp-section" data-testid="testimonials-wall">
      <h2>Teams that switched to Fernpost</h2>
      <div className="fp-wall">
        {quotes.map((q) => (
          <figure key={q.who} className="fp-wall-card">
            <blockquote>“{q.text}”</blockquote>
            <figcaption>
              <b>{q.who}</b>
              <span>{q.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// `?without=logos` renders the page as it is after a round was applied and the
// logos Variants were unwrapped (no logos section at all); used by e2e.
export default async function MorePage({
  searchParams,
}: {
  searchParams: Promise<{ without?: string }>;
}) {
  const { without } = await searchParams;
  return (
    <main>
      <section className="fp-section fp-more-head">
        <p className="fp-eyebrow">Customer stories</p>
        <h1>Small teams, calmer inboxes.</h1>
      </section>
      <Variant name="testimonials" option="quote" default>
        <TestimonialsQuote />
      </Variant>
      <Variant name="testimonials" option="wall">
        <TestimonialsWall />
      </Variant>
      {without !== "logos" && (
        <Later>
          <Variant name="logos" option="row" default>
            <section className="fp-section" data-testid="logos-row">
              <p>Northfold · Pebble&amp;Co · Larchway · Brightloom</p>
            </section>
          </Variant>
          <Variant name="logos" option="grid">
            <section className="fp-section fp-wall" data-testid="logos-grid">
              {quotes.map((q) => (
                <p key={q.who}>{q.role.split(", ")[1]}</p>
              ))}
            </section>
          </Variant>
        </Later>
      )}
      <section className="fp-section fp-more">
        <p>
          <Link href="/demo">← Back to the Fernpost home page</Link>
        </p>
      </section>
    </main>
  );
}
