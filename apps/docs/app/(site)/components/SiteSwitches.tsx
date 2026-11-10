import { Variant } from "switches-react";

// The site's global switches: two sections with no content of their own, so
// the Switches panel on every page of the shell offers Mode and Accent next to
// the page's own sections. A pick changes the site through
// <html data-switches-picks> (rules at the top of site.css). Each section's
// options are adjacent siblings, as the package expects. Option names are
// distinct within a section and none is a prefix of another.
//
// Mode is drawn with the panel's preset icons (the `icon` prop); Accent is
// plain text. It colours the panel's switches, the illustration and the Try it
// mock, not the site's links (those stay blue). System is the green of an OS switch.
//
// There is no Animation switch in the panel. The site still honours
// ?switches=animation:calm and animation:full in a link (stills the
// illustration and the hint, or plays them under reduced motion); the e2e
// tests and screenshots use that.

export function SiteSwitches() {
  return (
    <>
      <Variant name="mode" option="light" label="Light" icon="sun">
        {null}
      </Variant>
      <Variant name="mode" option="dark" label="Dark" icon="moon">
        {null}
      </Variant>
      <Variant name="mode" option="system" label="System" icon="system" default>
        {null}
      </Variant>

      <Variant name="accent" option="system" label="System" default>
        {null}
      </Variant>
      <Variant name="accent" option="black" label="Black">
        {null}
      </Variant>
      <Variant name="accent" option="blue" label="Blue">
        {null}
      </Variant>
      <Variant name="accent" option="orange" label="Orange">
        {null}
      </Variant>
    </>
  );
}
