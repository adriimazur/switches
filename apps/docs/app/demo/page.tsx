import type { Metadata } from "next";
import Link from "next/link";
import { Variant } from "switches-react";

export const metadata: Metadata = {
  title: "Fernpost: the shared inbox for small support teams (Switches demo)",
};

/* ---------- Hero ---------- */

function HeroCentered() {
  return (
    <section className="fp-hero-centered" data-testid="hero-centered">
      <p className="fp-eyebrow">Shared inbox for teams of 2 to 20</p>
      <h1>Every customer email, answered by the right person.</h1>
      <p className="fp-lede">
        Fernpost turns support@ into a calm, shared queue. Assign, reply and close threads together,
        without forwarding chains or double replies.
      </p>
      <div className="fp-actions">
        <a href="#pricing" className="fp-btn">Start free for 14 days</a>
        <a href="#pricing" className="fp-btn fp-btn-ghost">See pricing</a>
      </div>
      <p className="fp-fine">No card needed. Connects to Gmail and Outlook in two minutes.</p>
    </section>
  );
}

function HeroSplit() {
  return (
    <section className="fp-hero-split" data-testid="hero-split">
      <div>
        <p className="fp-eyebrow">Shared inbox</p>
        <h1>Stop asking “did anyone reply to this?”</h1>
        <p className="fp-lede">
          See who is on which thread, hand off with one click, and keep the whole team in one
          inbox.
        </p>
        <form className="fp-signup" action="#">
          <input type="email" placeholder="you@company.com" aria-label="Work email" />
          <button type="button" className="fp-btn">Get started</button>
        </form>
      </div>
      <div className="fp-mock" aria-hidden>
        <div className="fp-mock-bar">
          <span />
          <span />
          <span />
        </div>
        {[
          ["Refund for order #4821", "Maya", "fp-tag-blue"],
          ["Can I change my plan?", "Sam", "fp-tag-green"],
          ["Invoice address wrong", "You", "fp-tag-amber"],
          ["Love the new update!", "Closed", "fp-tag-grey"],
        ].map(([subject, who, tag]) => (
          <div className="fp-mock-row" key={subject}>
            <span className="fp-mock-dot" />
            <span className="fp-mock-subject">{subject}</span>
            <span className={`fp-tag ${tag}`}>{who}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeroMinimal() {
  return (
    <section className="fp-hero-minimal" data-testid="hero-minimal">
      <h1>
        One inbox.
        <br />
        Whole team.
      </h1>
      <a href="#pricing" className="fp-arrow">Try Fernpost free →</a>
    </section>
  );
}

/* ---------- Pricing ---------- */

const tiers = [
  { name: "Starter", price: "$0", per: "up to 2 seats", items: ["1 shared inbox", "Assign and snooze", "7-day history"] },
  { name: "Team", price: "$12", per: "per seat / month", items: ["5 shared inboxes", "Collision alerts", "Saved replies", "Unlimited history"], featured: true },
  { name: "Business", price: "$24", per: "per seat / month", items: ["Unlimited inboxes", "SLA timers", "SSO and audit log", "Priority support"] },
];

function PricingTiers() {
  return (
    <section className="fp-section" data-testid="pricing-tiers">
      <h2>Simple plans that grow with you</h2>
      <div className="fp-tiers">
        {tiers.map((t) => (
          <div key={t.name} className={`fp-tier${t.featured ? " fp-tier-featured" : ""}`}>
            {t.featured && <span className="fp-badge">Most popular</span>}
            <h3>{t.name}</h3>
            <p className="fp-price">
              {t.price} <span>{t.per}</span>
            </p>
            <ul>
              {t.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <a href="#" className={`fp-btn${t.featured ? "" : " fp-btn-ghost"}`}>
              Choose {t.name}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSimple() {
  return (
    <section className="fp-section fp-pricing-simple" data-testid="pricing-simple">
      <div className="fp-ps-card">
        <div>
          <h2>One plan. Everything included.</h2>
          <p className="fp-lede">Unlimited inboxes, history and saved replies for every seat.</p>
        </div>
        <div className="fp-ps-price">
          <p className="fp-price">
            $15 <span>per seat / month</span>
          </p>
          <a href="#pricing" className="fp-btn">Start free</a>
          <p className="fp-fine">Billed monthly. Cancel any time.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function FooterColumns() {
  return (
    <footer className="fp-footer-columns" data-testid="footer-columns">
      <div className="fp-footer-brand">
        <span className="fp-logo">
          <span className="fp-logo-mark" aria-hidden />
          Fernpost
        </span>
        <p>The shared inbox for small support teams.</p>
      </div>
      {[
        ["Product", ["Shared inbox", "Assignments", "Saved replies", "Pricing"]],
        ["Company", ["About", "Customers", "Careers", "Blog"]],
        ["Help", ["Docs", "Status", "Contact", "Privacy"]],
      ].map(([title, links]) => (
        <div key={title as string}>
          <h4>{title}</h4>
          <ul>
            {(links as string[]).map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </footer>
  );
}

function FooterCompact() {
  return (
    <footer className="fp-footer-compact" data-testid="footer-compact">
      <span>© 2026 Fernpost</span>
      <nav>
        <a href="#">Docs</a>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Contact</a>
      </nav>
    </footer>
  );
}

function FooterCta() {
  return (
    <footer className="fp-footer-cta" data-testid="footer-cta">
      <h2>Ready for a calmer inbox?</h2>
      <p>Set up Fernpost in two minutes. Your team will thank you by lunch.</p>
      <a href="#pricing" className="fp-btn fp-btn-light">Start free for 14 days</a>
      <p className="fp-footer-cta-small">© 2026 Fernpost · Privacy · Terms</p>
    </footer>
  );
}

export default function DemoPage() {
  return (
    <main>
      <Variant name="hero" option="centered" default>
        <HeroCentered />
      </Variant>
      <Variant name="hero" option="split">
        <HeroSplit />
      </Variant>
      <Variant name="hero" option="minimal">
        <HeroMinimal />
      </Variant>

      <section className="fp-logos" aria-label="Teams using Fernpost">
        <span>Trusted by 3,400 small teams</span>
        <span className="fp-logos-row">
          <b>Northfold</b>
          <b>Pebble&amp;Co</b>
          <b>Larchway</b>
          <b>Brightloom</b>
        </span>
      </section>

      <div id="pricing">
        <Variant name="pricing" option="tiers" default>
          <PricingTiers />
        </Variant>
        <Variant name="pricing" option="simple">
          <PricingSimple />
        </Variant>
      </div>

      <section className="fp-section fp-more">
        <p>
          Hear from teams who switched. <Link href="/demo/more">Read customer stories →</Link>
        </p>
      </section>

      <Variant name="footer" option="columns" default>
        <FooterColumns />
      </Variant>
      <Variant name="footer" option="compact">
        <FooterCompact />
      </Variant>
      <Variant name="footer" option="cta" label="Call to action">
        <FooterCta />
      </Variant>
    </main>
  );
}
