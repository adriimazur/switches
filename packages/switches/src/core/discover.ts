export type SectionOption = { option: string; label: string };
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
    s.options.push({
      option,
      label: el.getAttribute("data-switches-label") || humanise(option),
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
      "data-switches-default",
    ],
  });
  check();
  return () => mo.disconnect();
}
