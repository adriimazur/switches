import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { Panel } from "../src/panel/Panel";
import { pickScript } from "../src/script";

const WARNING =
  '[switches] Switches is still installed in this production build. Remove it before launch: ask Claude to "finish" Switches.';

async function load() {
  vi.resetModules();
  return import("../src/index");
}

describe("Switches", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    warn.mockRestore();
  });

  it("returns null and Variant renders default only when off", async () => {
    vi.stubEnv("NEXT_PUBLIC_SWITCHES", "off");
    const { Switches, Variant } = await load();
    expect(Switches()).toBeNull();
    const html = renderToString(
      <>
        <Variant name="hero" option="a" default>A</Variant>
        <Variant name="hero" option="b">B</Variant>
      </>,
    );
    // picks are ignored: only the default-hiding rules are emitted
    expect(html).not.toContain("html:not(");
    expect(html).not.toContain("html:is(");
    expect(html).toContain('[data-switches-option="b"]:not([data-switches-default])');
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once in production when not off", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SWITCHES", "");
    const { Switches } = await load();
    renderToString(<Switches />);
    renderToString(<Switches />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(WARNING);
  });

  it("does not warn in production when off", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SWITCHES", "off");
    const { Switches } = await load();
    Switches();
    expect(warn).not.toHaveBeenCalled();
  });

  it("does not warn in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { Switches } = await load();
    renderToString(<Switches />);
    expect(warn).not.toHaveBeenCalled();
  });

  it("renders the inline script before the panel", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SWITCHES", "");
    const { Switches } = await load();
    const el = Switches() as ReactElement<{ children: ReactElement[] }>;
    const [first, second] = el.props.children;
    expect(first!.type).toBe("script");
    expect(
      (first!.props as { dangerouslySetInnerHTML: { __html: string } })
        .dangerouslySetInnerHTML.__html,
    ).toBe(pickScript);
    expect((second!.type as { name: string }).name).toBe(Panel.name);
    expect(renderToString(<Switches />).startsWith("<script>")).toBe(true);
  });

  describe("without `process` (a browser bundle that does not define it)", () => {
    it("Switches renders the script and the panel without throwing, and does not warn", async () => {
      const { Switches } = await load();
      vi.stubGlobal("process", undefined);
      expect(typeof process).toBe("undefined");
      const el = Switches() as ReactElement<{ children: ReactElement[] }>;
      const [first, second] = el.props.children;
      expect(first!.type).toBe("script");
      expect((second!.type as { name: string }).name).toBe(Panel.name);
      expect(renderToString(<Switches />).startsWith("<script>")).toBe(true);
      expect(warn).not.toHaveBeenCalled();
    });

    it("Variant renders with picks honoured (the flag reads as unset)", async () => {
      const { Variant } = await load();
      vi.stubGlobal("process", undefined);
      const html = renderToString(
        <>
          <Variant name="hero" option="a" default>A</Variant>
          <Variant name="hero" option="b">B</Variant>
        </>,
      );
      expect(html).toContain("html:is(");
      expect(html).toContain("html:not(");
    });

    it("env accessors treat the ReferenceError as unset", async () => {
      vi.resetModules();
      const env = await import("../src/env");
      vi.stubGlobal("process", undefined);
      expect(env.switchesFlag()).toBeUndefined();
      expect(env.nodeEnv()).toBeUndefined();
      expect(env.switchesOff()).toBe(false);
    });
  });

  it("with `process` present, off still turns everything off (unchanged)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SWITCHES", "off");
    const { Switches } = await load();
    expect(Switches()).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
});
