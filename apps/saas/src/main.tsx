// SPDX-License-Identifier: AGPL-3.0-only
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@hosanna/ui/css";
import { syncAnalyticsWithConsent } from "./lib/analytics";
import { I18nProvider } from "./lib/i18n";
import { router } from "./router";
import "./styles.css";

syncAnalyticsWithConsent();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  </StrictMode>,
);

if (typeof window !== "undefined" && "serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.debug("SW registration skipped", err));
  });
}
