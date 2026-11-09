"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Copy-to-clipboard button. `variant="icon"` is the small icon button of the
 * install line; the default is the text button of code blocks. A polite live
 * region announces "Copied".
 */
export function CopyButton({
  text,
  label = "Copy",
  variant = "text",
}: {
  text: string;
  label?: string;
  variant?: "text" | "icon";
}) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard blocked: the text is still selectable
    }
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1500);
  };

  return (
    <>
      <button
        type="button"
        className={variant === "icon" ? "s-copy s-copy-icon" : "s-copy"}
        onClick={copy}
        aria-label={variant === "icon" ? label : undefined}
        data-done={done || undefined}
      >
        {variant === "icon" ? (
          <svg viewBox="0 0 16 16" aria-hidden focusable="false">
            {done ? (
              <path d="M3.5 8.5l3 3 6-7" />
            ) : (
              <>
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" />
                <path d="M10.5 3.2V3A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.3" />
              </>
            )}
          </svg>
        ) : done ? (
          "Copied"
        ) : (
          label
        )}
        {variant === "icon" && done && <span className="s-copy-done">Copied</span>}
      </button>
      <span className="s-sr" aria-live="polite">
        {done ? "Copied" : ""}
      </span>
    </>
  );
}
