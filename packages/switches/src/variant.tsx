import type { ReactNode } from "react";
import { pickToken } from "./script";
import { switchesOff } from "./env";

// Server-safe: no hooks, no "use client". Every version is in the HTML; the
// <style> each Variant emits decides visibility from <html data-switches-picks>
// (written by pickScript before first paint) and the DOM itself.

export type VariantProps = {
  name: string;
  option: string;
  label?: string;
  default?: boolean;
  children: ReactNode;
};

const N = "data-switches-name";
const O = "data-switches-option";
const D = "data-switches-default";
const P = "data-switches-picks";

/** Escape for a double-quoted CSS string that also lives inside <style>. */
function cssStr(s: string): string {
  return (
    '"' +
    s.replace(/[\\"<>\n\r\f]/g, (c) => "\\" + c.charCodeAt(0).toString(16) + " ") +
    '"'
  );
}

/** Selector list matching <html> while data-switches-picks has the entry `token`. */
function pickedList(token: string): string {
  const t = token; // URI-encoded, so it holds no quotes or backslashes
  return `[${P}="${t}"],[${P}^="${t},"],[${P}$=",${t}"],[${P}*=",${t},"]`;
}

/**
 * The rules one `<Variant name option>` needs. Visibility, per section S:
 * - no valid pick: the `default` version if any, else the first version among
 *   its siblings in DOM order;
 * - a pick naming an existing option: only that option. A stale pick (unknown
 *   option or section) matches no rule, so the default stays visible.
 *
 * Every rule only hides (`display:none!important`, beating the wrapper's
 * inline `display:contents`), and each Variant's default rules exempt itself
 * while it is picked. So no rule ever has to out-rank another: the outcome
 * does not depend on specificity or on the order the <style>s appear in.
 * With `ignorePicks` (NEXT_PUBLIC_SWITCHES=off) only the default rules remain.
 */
export function switchesCss(
  name: string,
  option: string,
  opts: { ignorePicks?: boolean } = {},
): string {
  const n = `[${N}=${cssStr(name)}]`;
  const self = `${n}[${O}=${cssStr(option)}]:not([${D}])`;
  const list = pickedList(pickToken(name, option));
  const html = opts.ignorePicks ? "html" : `html:not(${list})`;
  const rules = [
    // a default exists in the section and this is not it
    `${html}:has(${n}[${D}]) ${self}{display:none!important}`,
    // no default: this is not the first version among its siblings
    `${html} ${n}~${self}{display:none!important}`,
  ];
  if (!opts.ignorePicks) {
    // this version is picked: hide the others in the section
    rules.push(
      `html:is(${list}) ${n}:not([${O}=${cssStr(option)}]){display:none!important}`,
    );
  }
  return rules.join("\n");
}

export function Variant(props: VariantProps) {
  const { name, option, label, children } = props;
  const css = switchesCss(name, option, { ignorePicks: switchesOff() });
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        style={{ display: "contents" }}
        data-switches-name={name}
        data-switches-option={option}
        data-switches-label={label}
        data-switches-default={props.default ? "" : undefined}
      >
        {children}
      </div>
    </>
  );
}
