import type { Metadata } from "next";
import "./globals.css";
import { PrivyProvider } from "@/components/PrivyProvider";

export const metadata: Metadata = {
  title: "Lockbox — Lock in. Hold the line. Get paid.",
  description: "Commit funds with your group. Rage quit early and lose your penalty to those who stayed. Built on Rialo.",
  metadataBase: new URL("https://lockbox-vault.vercel.app"),
  openGraph: {
    title: "Lockbox — Lock in. Hold the line. Get paid.",
    description: "Commit funds with your group. Rage quit early and lose your penalty to those who stayed. Built on Rialo.",
    url: "https://lockbox-vault.vercel.app",
    siteName: "Lockbox",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lockbox — Lock in. Hold the line. Get paid.",
    description: "Commit funds with your group. Rage quit early and lose your penalty to those who stayed. Built on Rialo.",
    creator: "@varl999",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
