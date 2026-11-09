import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";

import { AppProviders } from "@/components/providers";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hosanna Auth",
    template: "%s · Hosanna Auth",
  },
  description: "Sign in to Hosanna Studio and related products.",
  metadataBase: new URL(process.env.AUTH_URL ?? "https://auth.hosanna.live"),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.png" }],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Hosanna Auth",
    description: "Sign in to Hosanna Studio and related products.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body
        className="min-h-dvh antialiased"
        style={
          {
            "--font-display": "var(--font-fraunces), ui-serif, Georgia, serif",
            "--font-sans": "var(--font-source-sans), ui-sans-serif, system-ui, sans-serif",
          } as CSSProperties
        }
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
