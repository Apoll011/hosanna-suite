import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AppProviders } from "@/components/providers";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh antialiased font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
