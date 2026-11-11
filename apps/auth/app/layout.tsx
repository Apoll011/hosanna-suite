import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers";
import { AUTH_THEME_BOOT_SCRIPT, THEME_BG } from "@/lib/ui/theme-boot";

import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Hosanna Auth",
  title: {
    default: "Hosanna Auth",
    template: "%s · Hosanna Auth",
  },
  description: "Sign in to Hosanna Studio and related products.",
  metadataBase: new URL(process.env.AUTH_URL ?? "https://auth.hosanna.live"),
  // Intentionally omit appleWebApp.capable — auth should not feel installable.
  formatDetection: {
    telephone: false,
  },
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
      </head>
      <body
        className={`${figtree.variable} ${jetbrainsMono.variable} min-h-dvh antialiased font-sans`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
