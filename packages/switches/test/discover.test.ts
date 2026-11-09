import { describe, it, expect, vi, afterEach } from "vitest";
import { discoverSections, observeSections, type Section } from "../src/core/discover";

function v(name: string, option: string, extra = "") {
  return `<div style="display:contents" data-switches-name="${name}" data-switches-option="${option}" ${extra}>${option}</div>`;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("discoverSections", () => {
  it("returns sections with options in DOM order and default = first", () => {
    document.body.innerHTML = `
      <main>
        ${v("hero", "phone")}${v("hero", "big-photo", 'data-switches-label="Huge photo"')}
        <section>${v("pricing", "simple")}${v("pricing", "table", "data-switches-default")}</section>
      </main>`;
    expect(discoverSections(document)).toEqual<Section[]>([
      {
        name: "hero",
        options: [
          { option: "phone", label: "Phone" },
          { option: "big-photo", label: "Huge photo" },
        ],
        defaultOption: "phone",
      },
      {
        name: "pricing",
        options: [
          { option: "simple", label: "Simple" },
          { option: "table", label: "Table" },
        ],
        defaultOption: "table",
      },
    ]);
  });

  it("humanises option names for labels", () => {
    document.body.innerHTML = v("s", "big_photo-left") + v("s", "x");
    expect(discoverSections(document.body)[0]!.options[0]!.label).toBe("Big photo left");
  });

  it("returns a section that has a single option", () => {
    document.body.innerHTML = v("solo", "only");
    expect(discoverSections(document)).toEqual([
      { name: "solo", options: [{ option: "only", label: "Only" }], defaultOption: "only" },
    ]);
  });

  it("returns a duplicate option once and warns once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.innerHTML = v("hero", "a") + v("hero", "b") + v("hero", "a");
    const [hero] = discoverSections(document);
    expect(hero!.options.map((o) => o.option)).toEqual(["a", "b"]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns [] when there are no variants", () => {
    document.body.innerHTML = "<p>nothing</p>";
    expect(discoverSections(document)).toEqual([]);
  });
});

describe("observeSections", () => {
  const tick = () => new Promise((r) => setTimeout(r, 0));

  it("fires with a late-mounted section and stops after disconnect", async () => {
    document.body.innerHTML = v("hero", "a") + v("hero", "b");
    const cb = vi.fn();
    const stop = observeSections(document.body, cb);
    await tick();
    cb.mockClear();

    const late = document.createElement("div");
    late.innerHTML = v("pricing", "simple") + v("pricing", "table");
    document.body.appendChild(late);
    await tick();

    expect(cb).toHaveBeenCalled();
    const latest: Section[] = cb.mock.calls[cb.mock.calls.length - 1]![0];
    expect(latest.map((s) => s.name)).toEqual(["hero", "pricing"]);
    expect(latest[1]!.options.map((o) => o.option)).toEqual(["simple", "table"]);

    stop();
    cb.mockClear();
    document.body.insertAdjacentHTML("beforeend", v("footer", "x"));
    await tick();
    expect(cb).not.toHaveBeenCalled();
  });

  it("reports the current sections on start", async () => {
    document.body.innerHTML = v("hero", "a");
    const cb = vi.fn();
    const stop = observeSections(document, cb);
    await tick();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0]![0][0].name).toBe("hero");
    stop();
  });

  it("does not fire for mutations that leave the sections unchanged", async () => {
    document.body.innerHTML = v("hero", "a");
    const cb = vi.fn();
    const stop = observeSections(document.body, cb);
    await tick();
    cb.mockClear();
    document.body.insertAdjacentHTML("beforeend", "<p>unrelated</p>");
    await tick();
    expect(cb).not.toHaveBeenCalled();
    stop();
  });
});
