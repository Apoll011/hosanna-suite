import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { getSuiteAppAccent, suiteAppAccentCssVars } from "@hosanna/auth";

import { AppProviders } from "@/components/providers";
import { AUTH_THEME_BOOT_SCRIPT, THEME_BG } from "@/lib/ui/theme-boot";

import "./globals.css";

const AUTH_ACCENT = getSuiteAppAccent("auth");

export const metadata: Metadata = {
  applicationName: "Hosanna Auth",
  title: {
    default: "Hosanna Auth",
    template: "%s · Hosanna Auth",
  },
  description: "Sign in to Hosanna Studio and related products.",
  metadataBase: new URL(process.env.AUTH_URL ?? "https://auth.hosanna.live"),
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "512x512" }],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Hosanna Auth",
    description: "Sign in to Hosanna Studio and related products.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: AUTH_ACCENT },
    { media: "(prefers-color-scheme: dark)", color: THEME_BG.dark },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={suiteAppAccentCssVars("auth") as CSSProperties}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: AUTH_THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className="min-h-dvh antialiased font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
