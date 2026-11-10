import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { AppProviders } from "@/components/providers";
import { AUTH_THEME_BOOT_SCRIPT, THEME_BG } from "@/lib/theme-boot";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hosanna Auth",
    template: "%s · Hosanna Auth",
  },
  description: "Sign in to Hosanna Studio and related products.",
  metadataBase: new URL(process.env.AUTH_URL ?? "https://auth.hosanna.live"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
    other: [{ rel: "mask-icon", url: "/hosanna_favicon.svg", color: "#0284c7" }],
  },
  openGraph: {
    title: "Hosanna Auth",
    description: "Sign in to Hosanna Studio and related products.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_BG.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_BG.dark },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Blocking boot: set .dark before first paint (localStorage → cookie → OS).
          dangerouslySetInnerHTML={{ __html: AUTH_THEME_BOOT_SCRIPT }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
