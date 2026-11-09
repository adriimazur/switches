import { Variant } from "switches-react";

// The live demo on the landing page: three versions of one sample hero,
// wrapped in <Variant name="layout">. The single <Switches /> in the root layout
// finds them, so the real panel (round button, bottom left) switches them.
// Section names must be unique site-wide: /demo uses hero, pricing, footer;
// /demo/more uses testimonials.
//
// The mock is a quiet browser window in the site's own hairline language:
// one frame, the site's surface, one accent (the studio's glaze, a clear medium blue), real
// words only for what a visitor reads (a headline, one line, one button; or
// three classes). Every version keeps the same height so flipping between
// them changes the page, not the layout around it. The chrome names the
// version showing, matching the panel's label for it. The mock's headlines
// are paragraphs, so the page outline keeps only the site's own headings.

export const TRY_OPTIONS = [
  { option: "headline", label: "Big headline" },
  { option: "photo", label: "Photo split" },
  { option: "classes", label: "Class list" },
] as const;

function Chrome({ label }: { label: string }) {
  return (
    <div className="kh-chrome">
      <span className="kh-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="kh-version">
        <span className="s-sr">Version: </span>
        {label}
      </span>
    </div>
  );
}

function Logo() {
  return (
    <p className="kh-logo">
      <span className="kh-logo-mark" aria-hidden />
      Kiln Hours
    </p>
  );
}

function TryHeadline() {
  return (
    <div className="kh-page kh-headline" data-testid="layout-headline">
      <Chrome label="Big headline" />
      <div className="kh-body">
        <Logo />
        <div className="kh-copy">
          <p className="kh-big">Make something with your hands this week.</p>
          <p className="kh-text">Evening pottery classes. Clay and firing included.</p>
          <span className="kh-btn">Book a class</span>
        </div>
      </div>
    </div>
  );
}

function TryPhoto() {
  return (
    <div className="kh-page kh-photo" data-testid="layout-photo">
      <Chrome label="Photo split" />
      <div className="kh-body kh-split">
        <div className="kh-split-text">
          <Logo />
          <div className="kh-copy">
            <p className="kh-mid">Evening pottery for beginners.</p>
            <p className="kh-text">Six people per table.</p>
            <span className="kh-btn">See dates</span>
          </div>
        </div>
        {/* The "photo": one glazed pot on a shelf, drawn as two shapes. */}
        <div className="kh-pic" aria-hidden>
          <svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMax meet">
            <path className="kh-pot" d="M44 52c0-6 4-10 4-16h24c0 6 4 10 4 16 14 10 22 26 22 46 0 22-12 38-38 38S22 120 22 98c0-20 8-36 22-46Z" />
            <path className="kh-pot-rim" d="M46 36h28" />
          </svg>
        </div>
      </div>
    </div>
  );
}

const classes = [
  ["Wheel basics", "Tue 18:30"],
  ["Hand-built mugs", "Thu 19:00"],
  ["Glazing night", "Sat 11:00"],
];

function TryClasses() {
  return (
    <div className="kh-page kh-classes" data-testid="layout-classes">
      <Chrome label="Class list" />
      <div className="kh-body">
        <Logo />
        <div className="kh-copy">
          <p className="kh-mid">This week</p>
          <ul className="kh-list">
            {classes.map(([name, when]) => (
              <li key={name}>
                <span className="kh-list-name">{name}</span>
                <span className="kh-list-when">{when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function TryDemo() {
  const [a, b, c] = TRY_OPTIONS;
  return (
    <div className="s-try">
      <Variant name="layout" option={a.option} label={a.label} default>
        <TryHeadline />
      </Variant>
      <Variant name="layout" option={b.option} label={b.label}>
        <TryPhoto />
      </Variant>
      <Variant name="layout" option={c.option} label={c.label}>
        <TryClasses />
      </Variant>
    </div>
  );
}
