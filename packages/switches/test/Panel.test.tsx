import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { Panel } from "../src/panel/Panel";
import { css } from "../src/panel/styles";

function variant(name: string, option: string, def = false) {
  const el = document.createElement("div");
  el.setAttribute("data-switches-name", name);
  el.setAttribute("data-switches-option", option);
  if (def) el.setAttribute("data-switches-default", "");
  document.body.appendChild(el);
  return el;
}

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

async function openPanel() {
  render(<Panel />);
  await flush();
  fireEvent.click(screen.getByRole("button", { name: "Open Switches" }));
}

const realClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

beforeEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
  document.documentElement.removeAttribute("data-switches-picks");
  history.replaceState(null, "", "/");
});

afterEach(() => {
  if (realClipboard) Object.defineProperty(navigator, "clipboard", realClipboard);
  else delete (navigator as { clipboard?: unknown }).clipboard;
  vi.useRealTimers();
});

describe("Panel", () => {
  it("two options render a switch; clicking it flips the pick", async () => {
    variant("hero_layout", "split", true);
    variant("hero_layout", "centre");
    await openPanel();
    const sw = screen.getByRole("switch", { name: "Hero layout" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(document.documentElement.getAttribute("data-switches-picks")).toBe(
      "hero_layout:centre",
    );
    fireEvent.click(sw);
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(document.documentElement.getAttribute("data-switches-picks")).toBe(
      "hero_layout:split",
    );
  });

  it("three options render a radiogroup with aria-checked on the chosen one", async () => {
    variant("how", "loop", true);
    variant("how", "cubes");
    variant("how", "stack");
    await openPanel();
    const group = screen.getByRole("radiogroup", { name: "How" });
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(group.contains(radios[0]!)).toBe(true);
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    fireEvent.click(screen.getByRole("radio", { name: "Stack" }));
    expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-checked"))).toEqual([
      "false",
      "false",
      "true",
    ]);
  });

  it("Escape and outside click close the sheet", async () => {
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    const dialog = screen.getByRole("dialog", { name: "Switches" });
    expect(dialog.getAttribute("aria-hidden")).toBe("false");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(dialog.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Open Switches" }));
    expect(dialog.getAttribute("aria-hidden")).toBe("false");
    fireEvent.pointerDown(document.body);
    expect(dialog.getAttribute("aria-hidden")).toBe("true");
  });

  it("closed sheet is hidden via visibility, transitioned with the fade", () => {
    const closed = css.match(/\.sw-sheet\[aria-hidden="true"\]\s*\{([^}]*)\}/)![1]!;
    expect(closed).toContain("visibility: hidden");
    const sheet = css.match(/\.sw-sheet\s*\{([^}]*)\}/)![1]!;
    expect(sheet).toMatch(/transition-property:[^;]*\bvisibility\b/);
  });

  it("Escape with focus inside the sheet returns focus to the round button", async () => {
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    const sw = screen.getByRole("switch", { name: "Hero" });
    sw.focus();
    expect(document.activeElement).toBe(sw);
    fireEvent.keyDown(document, { key: "Escape" });
    const btn = screen.getByRole("button", { name: "Open Switches" });
    expect(document.activeElement).toBe(btn);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(btn.getAttribute("aria-controls")).toBe(dialog.id);
    expect(dialog.id).not.toBe("");
  });

  it("a pasted 500-char note is sliced to 280", async () => {
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    const input = screen.getByRole("textbox", { name: "Note for Hero" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "x".repeat(500) } });
    expect(input.value).toHaveLength(280);
  });

  it("a typed note is in the text copied by Copy my picks", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    const input = screen.getByRole("textbox", { name: "Note for Hero" });
    expect(input.getAttribute("maxlength")).toBe("280");
    fireEvent.change(input, { target: { value: "tighter please" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy my picks" }));
    await flush();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]![0]).toContain("— note: tighter please");
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("shows Copied for 1.5s", async () => {
    vi.useFakeTimers();
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    fireEvent.click(screen.getByRole("button", { name: "Copy my picks" }));
    await flush();
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
    act(() => vi.advanceTimersByTime(1499));
    expect(screen.queryByRole("button", { name: "Copied" })).toBeTruthy();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("button", { name: "Copy my picks" })).toBeTruthy();
  });

  for (const [label, clip] of [
    ["clipboard undefined", () => undefined],
    ["writeText rejecting", () => ({ writeText: vi.fn().mockRejectedValue(new Error("denied")) })],
  ] as const) {
    it(`falls back to a selected read-only textarea (${label})`, async () => {
      setClipboard(clip());
      variant("hero", "a", true);
      variant("hero", "b");
      await openPanel();
      fireEvent.click(screen.getByRole("switch", { name: "Hero" }));
      fireEvent.click(screen.getByRole("button", { name: "Copy my picks" }));
      await flush();
      await flush();
      const ta = screen.getByRole("textbox", { name: "Picks to copy" }) as HTMLTextAreaElement;
      expect(ta.readOnly).toBe(true);
      expect(ta.value).toContain("hero: b");
      expect(document.activeElement).toBe(ta);
      expect(ta.selectionStart).toBe(0);
      expect(ta.selectionEnd).toBe(ta.value.length);
      expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
    });
  }

  it("shows a generic message in the textarea when the picks text cannot be built", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    fireEvent.click(screen.getByRole("switch", { name: "Hero" }));
    const RealURL = URL;
    vi.stubGlobal("URL", function () {
      throw new TypeError("Invalid URL");
    });
    try {
      fireEvent.click(screen.getByRole("button", { name: "Copy my picks" }));
      await flush();
      await flush();
    } finally {
      vi.stubGlobal("URL", RealURL);
    }
    const ta = screen.getByRole("textbox", { name: "Picks to copy" }) as HTMLTextAreaElement;
    expect(ta.value).toMatch(/could not prepare/i);
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  });

  it("clears the fallback textarea when a pick or note changes", async () => {
    setClipboard(undefined);
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    const copy = () => fireEvent.click(screen.getByRole("button", { name: "Copy my picks" }));
    const area = () => screen.queryByRole("textbox", { name: "Picks to copy" });
    copy();
    await flush();
    expect(area()).not.toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Hero" }));
    expect(area()).toBeNull();
    copy();
    await flush();
    expect(area()).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Note for Hero" }), { target: { value: "x" } });
    expect(area()).toBeNull();
  });

  it("announces Copied in a polite live region", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live).not.toBeNull();
    expect(live.textContent).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Copy my picks" }));
    await flush();
    expect(live.textContent).toBe("Copied");
  });

  it("renders nothing when every section has one option", async () => {
    variant("hero", "a", true);
    variant("cta", "x", true);
    const { container } = render(<Panel />);
    await flush();
    expect(container.innerHTML).toBe("");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("hides one-option sections but shows the rest", async () => {
    variant("solo", "a", true);
    variant("hero", "a", true);
    variant("hero", "b");
    await openPanel();
    expect(screen.getAllByRole("switch")).toHaveLength(1);
    expect(screen.queryByText("Solo")).toBeNull();
  });

  it("injects the sw- stylesheet; every class is prefixed", async () => {
    variant("hero", "a", true);
    variant("hero", "b");
    const { container } = render(<Panel />);
    await flush();
    expect(container.querySelector("style")?.textContent).toBe(css);
    expect(css).toContain("all: initial");
    for (const el of Array.from(container.querySelectorAll("[class]")))
      for (const c of Array.from(el.classList)) expect(c.startsWith("sw-")).toBe(true);
    // Selectors only reach .sw-* elements.
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/@media[^{]*\{/g, "")
      .match(/[^{}]+(?=\{)/g)!;
    for (const s of selectors)
      for (const part of s.split(/,(?![^(]*\))/))
        expect(part.trim()).toMatch(/^\.sw-/);
  });
});
