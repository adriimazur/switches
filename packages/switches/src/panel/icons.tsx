// Icons drawn from Mono Icons (MIT, Copyright 2020 Mono Company BV,
// https://github.com/mono-company/mono-icons), 24px grid, filled with currentColor.
// See THIRD_PARTY_NOTICES.md.

export const ICON_NAMES = ["sun", "moon", "system"] as const;
export type IconName = (typeof ICON_NAMES)[number];

const PATHS: Record<IconName | "copy", string> = {
  sun: "M12 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm7.071 2.929a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zm-14.142 0a1 1 0 0 1 1.414 0l.707.707A1 1 0 0 1 5.636 7.05l-.707-.707a1 1 0 0 1 0-1.414zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-6 4a6 6 0 1 1 12 0 6 6 0 0 1-12 0zm-4 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm17 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1zM5.636 16.95a1 1 0 0 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414-1.414l.707-.707zm11.314 1.414a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707zM12 19a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1z",
  moon: "M9.36 3.293a1 1 0 0 1 .187 1.157A7.45 7.45 0 0 0 19.55 14.453a1 1 0 0 1 1.343 1.343 9.45 9.45 0 1 1-12.69-12.69 1 1 0 0 1 1.158.187zM6.823 6.67A7.45 7.45 0 0 0 17.33 17.179 9.45 9.45 0 0 1 6.821 6.67z",
  system: "M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-7v2h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2H4a2 2 0 0 1-2-2V5zm18 11V5H4v11h16z",
  copy: "M2 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-4H4a2 2 0 0 1-2-2V4zm8 12v4h10V10h-4v4a2 2 0 0 1-2 2h-4zm4-2V4H4v10h10z",
};

export function isIconName(v: string | null | undefined): v is IconName {
  return !!v && (ICON_NAMES as readonly string[]).includes(v);
}

export function Icon({ name, className }: { name: IconName | "copy"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
