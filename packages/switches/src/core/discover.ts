export type SectionOption = {
  option: string;
  label: string;
  /** A safe CSS colour, drawn as a dot beside the label. */
  swatch?: string;
  /** A preset icon name ("sun", "moon", "system"), drawn beside the label. */
  icon?: string;
};

// Only plain colours reach a style: #hex, rgb()/hsl() with numbers, or a name.
const SWATCH = /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%/]{1,40}\)|[a-z]{3,24})$/i;
const ICONS = new Set(["sun", "moon", "system"]);
export type Section = {
  name: string;
  options: SectionOption[];
  defaultOption: string;
};

/** "big_photo-left" -> "Big photo left" */
export function humanise(option: string): string {
  const s = option.replace(/[-_]+/g, " ").trim();
  return s ? s[0]!.toUpperCase() + s.slice(1) : option;
}

function scan(root: ParentNode, warned?: Set<string>): Section[] {
  const byName = new Map<string, Section & { explicitDefault: boolean }>();
  for (const el of Array.from(root.querySelectorAll("[data-switches-name]"))) {
    const name = el.getAttribute("data-switches-name");
    const option = el.getAttribute("data-switches-option");
    if (!name || !option) continue;
    let s = byName.get(name);
    if (!s) {
      s = { name, options: [], defaultOption: option, explicitDefault: false };
      byName.set(name, s);
    }
    if (s.options.some((o) => o.option === option)) {
      const key = `${name}\u0000${option}`;
      if (!warned || !warned.has(key)) {
        warned?.add(key);
        console.warn(
          `[switches] duplicate <Variant name="${name}" option="${option}">; using the first one.`,
        );
      }
      continue;
    }
    const swatch = el.getAttribute("data-switches-swatch")?.trim();
    const icon = el.getAttribute("data-switches-icon")?.trim();
    s.options.push({
      option,
      label: el.getAttribute("data-switches-label") || humanise(option),
      ...(swatch && SWATCH.test(swatch) ? { swatch } : {}),
      ...(icon && ICONS.has(icon) ? { icon } : {}),
    });
    if (!s.explicitDefault && el.hasAttribute("data-switches-default")) {
      s.defaultOption = option;
      s.explicitDefault = true;
    }
  }
  return Array.from(byName.values(), ({ name, options, defaultOption }) => ({
    name,
    options,
    defaultOption,
  }));
}

/** Sections in DOM order of first appearance; options in DOM order, deduplicated. */
export function discoverSections(root: ParentNode): Section[] {
  return scan(root);
}

/**
 * Report sections now and whenever they change (late mounts, removals,
 * attribute edits). Returns a function that stops observing.
 */
export function observeSections(
  root: ParentNode,
  cb: (s: Section[]) => void,
): () => void {
  const warned = new Set<string>();
  let last = "";
  const check = () => {
    const sections = scan(root, warned);
    const key = JSON.stringify(sections);
    if (key === last) return;
    last = key;
    cb(sections);
  };
  const mo = new MutationObserver(check);
  mo.observe(root as unknown as Node, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "data-switches-name",
      "data-switches-option",
      "data-switches-label",
      "data-switches-swatch",
      "data-switches-icon",
      "data-switches-default",
    ],
  });
  check();
  return () => mo.disconnect();
}
