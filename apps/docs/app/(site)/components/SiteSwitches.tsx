import { Variant } from "switches-react";

// The site's global switches: three sections with no content of their own,
// so the Switches panel on every page of the shell offers Mode, Animation and
// Accent next to the page's own sections. A pick changes the site through
// <html data-switches-picks> (rules at the top of site.css, live JS in
// sitePicks.ts). Each section's options are adjacent siblings, as the
// package expects. Option names are distinct within a section and none is a
// prefix of another.
//
// Animation mirrors Mode, with three options so the panel keeps the rows in
// page order (it puts two-option sections, drawn as switches, first):
// System follows the OS's reduced-motion setting; Calm always stills the
// site's decorative motion; Full plays the decorative illustration and hint
// even when the OS asks for reduced motion, because picking it in the panel
// is an explicit choice. Full doesn't touch the scroll glide.

export function SiteSwitches() {
  return (
    <>
      <Variant name="mode" option="system" label="System" default>
        {null}
      </Variant>
      <Variant name="mode" option="light" label="Light">
        {null}
      </Variant>
      <Variant name="mode" option="dark" label="Dark">
        {null}
      </Variant>

      <Variant name="animation" option="system" label="System" default>
        {null}
      </Variant>
      <Variant name="animation" option="full" label="Full">
        {null}
      </Variant>
      <Variant name="animation" option="calm" label="Calm">
        {null}
      </Variant>

      <Variant name="accent" option="blue" label="Blue" default>
        {null}
      </Variant>
      <Variant name="accent" option="green" label="Green">
        {null}
      </Variant>
      <Variant name="accent" option="orange" label="Orange">
        {null}
      </Variant>
    </>
  );
}
