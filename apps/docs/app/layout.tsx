import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Switches } from "switches-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Switches",
  description: "Flip between AI-made versions of a page section on the real site, then copy your picks.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The Switches script sets data-switches-picks on <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Switches />
        {children}
      </body>
    </html>
  );
}
