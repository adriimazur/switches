"use client";
import { useEffect, useId, useRef, useState } from "react";
import { humanise, type Section } from "../core/discover";
import { usePanel, type PanelApi } from "./usePanel";
import { css } from "./styles";
import { revealSection } from "./reveal";

const MAX_NOTE = 280;
const COPIED_MS = 1500;

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className="sw-switch"
    >
      <span className="sw-knob" />
    </button>
  );
}

/** "Add note" link that becomes a one-line input bound to setNote. */
function Note({ s, label, api }: { s: Section; label: string; api: PanelApi }) {
  const value = api.note(s.name);
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);

  if (!editing && !value)
    return (
      <button type="button" className="sw-note-link" onClick={() => setEditing(true)}>
        Add note
      </button>
    );
  return (
    <input
      ref={input}
      type="text"
      className="sw-note"
      aria-label={`Note for ${label}`}
      placeholder="Add note"
      maxLength={MAX_NOTE}
      value={value}
      onChange={(e) => {
        // The store keeps notes on picks only: record the version on screen first.
        if (!api.picks[s.name]) api.choose(s.name, api.chosen(s.name));
        api.setNote(s.name, e.target.value.replace(/[\r\n]+/g, " ").slice(0, MAX_NOTE));
      }}
      onBlur={() => setEditing(false)}
    />
  );
}

// Shown in the fallback box if the picks text cannot be built on this page.
const COPY_FAILED =
  "Could not prepare the picks text on this page. Open the site from its web address and try again.";

export function Panel() {
  const base = usePanel();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  // A changed pick or note makes a shown fallback snapshot stale: hide it.
  const api: PanelApi = {
    ...base,
    choose(name, option) {
      setFallback(null);
      base.choose(name, option);
    },
    setNote(name, note) {
      setFallback(null);
      base.setNote(name, note);
    },
  };
  const root = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const sheetId = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Close on outside click or Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Focus inside the sheet would be lost once it hides: hand it to the button.
      if (sheet.current?.contains(document.activeElement)) button.current?.focus();
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (fallback === null || !area.current) return;
    area.current.focus();
    area.current.select();
  }, [fallback]);

  const shown = api.sections.filter((s) => s.options.length >= 2);
  if (!shown.length) return null;
  const rows = shown.filter((s) => s.options.length === 2);
  const choices = shown.filter((s) => s.options.length > 2);

  const copy = async () => {
    let text = COPY_FAILED;
    try {
      text = api.copyText();
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
    } catch {
      setCopied(false);
      setFallback(text);
      return;
    }
    setFallback(null);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <>
      <style>{css}</style>
      <div ref={root} className="sw-root">
        {/* settings sheet */}
        <div ref={sheet} id={sheetId} role="dialog" aria-label="Switches" aria-hidden={!open} className="sw-sheet">
          <p className="sw-title">Switches</p>
          {rows.length > 0 && (
            <ul className="sw-group">
              {rows.map((s) => {
                const label = humanise(s.name);
                const [off, on] = s.options as [Section["options"][0], Section["options"][0]];
                const isOn = api.chosen(s.name) === on.option;
                return (
                  <li key={s.name} className="sw-item">
                    <div className="sw-row">
                      <span className="sw-label">{label}</span>
                      <Switch
                        on={isOn}
                        label={label}
                        onChange={() => {
                          const next = isOn ? off.option : on.option;
                          api.choose(s.name, next);
                          revealSection(s.name, next, sheet.current);
                        }}
                      />
                    </div>
                    <Note s={s} label={label} api={api} />
                  </li>
                );
              })}
            </ul>
          )}
          {choices.length > 0 && (
            <ul className="sw-group">
              {choices.map((s) => {
                const label = humanise(s.name);
                const current = api.chosen(s.name);
                return (
                  <li key={s.name} className="sw-item">
                    <span className="sw-label">{label}</span>
                    <div
                      role="radiogroup"
                      aria-label={label}
                      style={{ gridTemplateColumns: `repeat(${s.options.length}, minmax(0, 1fr))` }}
                      className="sw-segments"
                    >
                      {s.options.map((o) => (
                        <button
                          key={o.option}
                          type="button"
                          role="radio"
                          aria-checked={current === o.option}
                          onClick={() => {
                            // Already the pick: only bring it into view (no store or URL write).
                            if (api.picks[s.name]?.option !== o.option) api.choose(s.name, o.option);
                            revealSection(s.name, o.option, sheet.current);
                          }}
                          className="sw-segment"
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <Note s={s} label={label} api={api} />
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" className="sw-copy" onClick={copy}>
            {copied ? "Copied" : "Copy my picks"}
          </button>
          <span aria-live="polite" className="sw-sr">
            {copied ? "Copied" : ""}
          </span>
          {fallback !== null && (
            <textarea
              ref={area}
              readOnly
              aria-label="Picks to copy"
              className="sw-fallback"
              value={fallback}
            />
          )}
        </div>

        {/* the round button */}
        <button
          ref={button}
          type="button"
          aria-controls={sheetId}
          aria-label={open ? "Close Switches" : "Open Switches"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="sw-button"
        >
          <svg viewBox="0 0 20 20" className="sw-icon" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M3 6h8M15 6h2M3 14h2M9 14h8" />
            <circle cx="13" cy="6" r="2" />
            <circle cx="7" cy="14" r="2" />
          </svg>
        </button>
      </div>
    </>
  );
}
