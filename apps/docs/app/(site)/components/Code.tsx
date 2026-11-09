import { CopyButton } from "./CopyButton";

type CodeProps = {
  /** What the block is: a file name, "Terminal", "Clipboard". */
  label?: string;
  children: string;
  /** Show a Copy button. */
  copy?: boolean;
  /** Wrap long lines instead of scrolling (for prose-like text). */
  wrap?: boolean;
};

/** A labelled code block. The text is shown exactly as given. */
export function Code({ label, children, copy, wrap }: CodeProps) {
  const text = children.replace(/^\n+|\s+$/g, "");
  return (
    <div className={wrap ? "s-code s-code-wrap" : "s-code"}>
      {(label || copy) && (
        <div className="s-code-bar">
          {label && <span className="s-code-label">{label}</span>}
          {copy && <CopyButton text={text} />}
        </div>
      )}
      <pre tabIndex={0}>
        <code>{text}</code>
      </pre>
    </div>
  );
}
