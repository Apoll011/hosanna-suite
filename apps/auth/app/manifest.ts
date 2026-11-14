import type { MetadataRoute } from "next";

/**
 * Non-installable PWA shell: `display: "browser"` keeps auth in a normal tab
 * so browsers don't promote "Add to Home Screen" the way Studio's standalone does.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hosanna Auth",
    short_name: "Hosanna Auth",
    description: "Sign in to Hosanna Studio and related products.",
    start_url: "/",
    display: "browser",
    background_color: "#f4f6f8",
    theme_color: "#0F766E",
    icons: [
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
